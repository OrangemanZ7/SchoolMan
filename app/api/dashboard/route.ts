import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Contract, Order, Shipment, Inventory, Location, Product, Settings } from '@/lib/models';

export async function GET() {
  try {
    await connectToDatabase();

    const [
      activeContractsCount,
      pendingOrdersCount,
      activeShipmentsCount,
      recentShipments,
      lowInventory,
      settings
    ] = await Promise.all([
      Contract.countDocuments({ status: 'active' }),
      Order.countDocuments({ status: 'pending' }),
      Shipment.countDocuments({ status: { $in: ['preparing', 'shipped'] } }),
      Shipment.find().sort({ createdAt: -1 }).limit(5).populate('fromLocation').populate('toLocation').lean(),
      Inventory.find().populate('product').populate('location').lean(),
      Settings.findOne()
    ]);

    // Filter low inventory in memory since threshold can be per-product or global
    // In a real app with millions of records, this would need a more complex aggregation pipeline
    // For this prototype, fetching all and filtering is acceptable
    const globalThreshold = settings?.lowInventoryThreshold ?? 50;
    const filteredLowInventory = lowInventory
      .filter((item: any) => {
        const threshold = item.product?.lowInventoryThreshold ?? globalThreshold;
        return item.quantity < threshold;
      })
      .slice(0, 10);

    return NextResponse.json({
      activeContractsCount,
      pendingOrdersCount,
      activeShipmentsCount,
      recentShipments,
      lowInventory: filteredLowInventory
    });
  } catch (error: any) {
    console.error('Failed to fetch dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}

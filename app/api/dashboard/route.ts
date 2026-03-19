import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Contract, Order, Shipment, Inventory } from '@/lib/models';

export async function GET() {
  try {
    await connectToDatabase();

    const [
      activeContractsCount,
      pendingOrdersCount,
      activeShipmentsCount,
      recentShipments,
      lowInventory
    ] = await Promise.all([
      Contract.countDocuments({ status: 'active' }),
      Order.countDocuments({ status: 'pending' }),
      Shipment.countDocuments({ status: { $in: ['preparing', 'shipped'] } }),
      Shipment.find().sort({ createdAt: -1 }).limit(5).populate('fromLocation').populate('toLocation'),
      Inventory.find({ quantity: { $lt: 50 } }).populate('product').populate('location').limit(10)
    ]);

    return NextResponse.json({
      activeContractsCount,
      pendingOrdersCount,
      activeShipmentsCount,
      recentShipments,
      lowInventory
    });
  } catch (error: any) {
    console.error('Failed to fetch dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}

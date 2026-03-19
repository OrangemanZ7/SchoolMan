import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Shipment, Location, Inventory } from '@/lib/models';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const toLocation = searchParams.get('toLocation');

    let query = {};
    if (toLocation) {
      query = { toLocation };
    }

    const shipments = await Shipment.find(query)
      .populate('fromLocation')
      .populate('toLocation')
      .populate('items.product')
      .sort({ createdAt: -1 });

    return NextResponse.json(shipments);
  } catch (error: any) {
    console.error('Failed to fetch shipments:', error);
    return NextResponse.json({ error: 'Failed to fetch shipments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const data = await request.json();

    // Basic validation
    if (!data.shipmentNumber || !data.fromLocation || !data.toLocation || !data.items || data.items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate that we have enough inventory in the fromLocation
    for (const item of data.items) {
      const inventory = await Inventory.findOne({ location: data.fromLocation, product: item.product });
      if (!inventory || inventory.quantity < item.quantity) {
        return NextResponse.json({ error: `Insufficient inventory for product ID ${item.product}` }, { status: 400 });
      }
    }

    // Deduct inventory from the fromLocation immediately upon creating the shipment (preparing)
    for (const item of data.items) {
      await Inventory.findOneAndUpdate(
        { location: data.fromLocation, product: item.product },
        { $inc: { quantity: -item.quantity } }
      );
    }

    const newShipment = await Shipment.create(data);
    return NextResponse.json(newShipment, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create shipment:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Shipment number already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create shipment' }, { status: 500 });
  }
}

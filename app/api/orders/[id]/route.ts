import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Order, Inventory, Location } from '@/lib/models';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const { status } = await request.json();

    if (!status || !['pending', 'received', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // If status is changing to 'received', we need to update inventory
    if (status === 'received' && order.status !== 'received') {
      // Find the central warehouse location
      const centralLocation = await Location.findOne({ type: 'central' });
      if (!centralLocation) {
        return NextResponse.json({ error: 'Central warehouse location not found' }, { status: 500 });
      }

      // Update inventory for each item
      for (const item of order.items) {
        await Inventory.findOneAndUpdate(
          { location: centralLocation._id, product: item.product },
          { $inc: { quantity: item.quantity } },
          { upsert: true, new: true }
        );
      }
    }

    order.status = status;
    await order.save();

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Failed to update order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

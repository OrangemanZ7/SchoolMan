import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Order, Inventory, Location } from '@/lib/models';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const { status, receivedItems, items } = await request.json();

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (status && !['pending', 'received', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // If updating items while pending
    if (items && order.status === 'pending' && (!status || status === 'pending')) {
      order.items = items;
      await order.save();
      return NextResponse.json(order);
    }

    // If status is changing to 'received', we need to update inventory
    if (status === 'received' && order.status !== 'received') {
      // Find the central warehouse location
      const centralLocation = await Location.findOne({ type: 'central' });
      if (!centralLocation) {
        return NextResponse.json({ error: 'Central warehouse location not found' }, { status: 500 });
      }

      // Update order items with received quantities and update inventory
      for (const item of order.items) {
        let qtyToReceive = item.quantity;
        
        if (receivedItems && Array.isArray(receivedItems)) {
          const receivedItem = receivedItems.find((ri: any) => ri.itemId === item._id.toString());
          if (receivedItem && typeof receivedItem.receivedQuantity === 'number') {
            qtyToReceive = receivedItem.receivedQuantity;
          }
        }
        
        item.receivedQuantity = qtyToReceive;

        if (qtyToReceive > 0) {
          await Inventory.findOneAndUpdate(
            { location: centralLocation._id, product: item.product },
            { $inc: { quantity: qtyToReceive } },
            { upsert: true, new: true }
          );
        }
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

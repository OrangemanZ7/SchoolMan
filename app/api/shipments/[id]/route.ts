import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Shipment, Inventory } from '@/lib/models';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const { status, receivedItems } = await request.json();

    if (!status || !['preparing', 'shipped', 'delivered'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const shipment = await Shipment.findById(id);
    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    // If status is changing to 'delivered', we need to add inventory to the destination
    if (status === 'delivered' && shipment.status !== 'delivered') {
      shipment.deliveredAt = new Date();
      
      // Update shipment items with received quantities and update inventory at the destination
      for (const item of shipment.items) {
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
            { location: shipment.toLocation, product: item.product },
            { $inc: { quantity: qtyToReceive } },
            { upsert: true, new: true }
          );
        }
      }
    } else if (status === 'shipped' && shipment.status === 'preparing') {
      shipment.shippedAt = new Date();
    }

    shipment.status = status;
    await shipment.save();

    return NextResponse.json(shipment);
  } catch (error: any) {
    console.error('Failed to update shipment:', error);
    return NextResponse.json({ error: 'Failed to update shipment' }, { status: 500 });
  }
}

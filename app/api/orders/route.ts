import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Order, Contract, Product } from '@/lib/models';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let query = {};
    if (type) {
      query = { type };
    }

    const orders = await Order.find(query)
      .populate('contract')
      .populate('items.product')
      .sort({ createdAt: -1 });

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Failed to fetch orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const data = await request.json();

    // Basic validation
    if (!data.orderNumber || !data.type || !data.items || data.items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // If it's a contract order, we should validate against the contract
    if (data.type === 'contract') {
      if (!data.contract) {
        return NextResponse.json({ error: 'Contract is required for contract orders' }, { status: 400 });
      }
      
      const contract = await Contract.findById(data.contract);
      if (!contract) {
        return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
      }

      // We could add logic here to check if the ordered quantities exceed the contract's maxQuantity - purchasedQuantity
      // For now, we just create the order.
    }

    const newOrder = await Order.create(data);
    return NextResponse.json(newOrder, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create order:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Order number already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

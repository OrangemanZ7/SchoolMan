import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Consumption, Inventory } from '@/lib/models';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');
    
    const query = location ? { location } : {};
    
    const consumptions = await Consumption.find(query)
      .populate('product')
      .populate('location')
      .populate('consumedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();
      
    return NextResponse.json(consumptions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    const { location, product, quantity, consumedBy, notes } = body;

    if (!location || !product || !quantity || !consumedBy) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    if (quantity <= 0) {
      return NextResponse.json({ error: 'A quantidade deve ser maior que zero' }, { status: 400 });
    }

    // Check inventory
    const inventoryItem = await Inventory.findOne({ location, product });
    
    if (!inventoryItem || inventoryItem.quantity < quantity) {
      return NextResponse.json({ error: 'Estoque insuficiente para este consumo' }, { status: 400 });
    }

    // Deduct from inventory
    inventoryItem.quantity -= quantity;
    await inventoryItem.save();

    // Create consumption log
    const consumption = await Consumption.create({
      location,
      product,
      quantity,
      consumedBy,
      notes
    });

    return NextResponse.json(consumption, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

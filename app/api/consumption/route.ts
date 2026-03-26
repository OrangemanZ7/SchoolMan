import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Consumption, Inventory, Location } from '@/lib/models';

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
    
    // Support bulk creation
    if (body.items && Array.isArray(body.items)) {
      const { location, consumedBy, items, notes } = body;
      
      if (!location || !consumedBy || items.length === 0) {
        return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
      }

      const locationDoc = await Location.findById(location);
      if (!locationDoc) {
        return NextResponse.json({ error: 'Local não encontrado' }, { status: 404 });
      }
      
      const alias = locationDoc.alias || locationDoc.name.substring(0, 2).toUpperCase();
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const code = `CS-${dateStr}-${alias}`;

      // Validate all items first
      for (const item of items) {
        if (!item.product || !item.quantity || item.quantity <= 0) {
          return NextResponse.json({ error: 'Item inválido na lista' }, { status: 400 });
        }
        
        const inventoryItem = await Inventory.findOne({ location, product: item.product });
        if (!inventoryItem || inventoryItem.quantity < item.quantity) {
          return NextResponse.json({ error: `Estoque insuficiente para um dos produtos selecionados` }, { status: 400 });
        }
      }

      // Process all items
      const consumptions = [];
      const batchId = new Date().getTime().toString() + Math.random().toString(36).substring(2, 9);
      for (const item of items) {
        const inventoryItem = await Inventory.findOne({ location, product: item.product });
        inventoryItem.quantity -= item.quantity;
        await inventoryItem.save();

        const consumption = await Consumption.create({
          location,
          product: item.product,
          quantity: item.quantity,
          consumedBy,
          notes: notes || item.notes,
          batchId,
          code
        });
        consumptions.push(consumption);
      }

      return NextResponse.json({ success: true, consumptions }, { status: 201 });
    }

    // Single item fallback
    const { location, product, quantity, consumedBy, notes } = body;

    if (!location || !product || !quantity || !consumedBy) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    if (quantity <= 0) {
      return NextResponse.json({ error: 'A quantidade deve ser maior que zero' }, { status: 400 });
    }

    const locationDoc = await Location.findById(location);
    if (!locationDoc) {
      return NextResponse.json({ error: 'Local não encontrado' }, { status: 404 });
    }
    
    const alias = locationDoc.alias || locationDoc.name.substring(0, 2).toUpperCase();
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const code = `CS-${dateStr}-${alias}`;

    // Check inventory
    const inventoryItem = await Inventory.findOne({ location, product });
    
    if (!inventoryItem || inventoryItem.quantity < quantity) {
      return NextResponse.json({ error: 'Estoque insuficiente para este consumo' }, { status: 400 });
    }

    // Deduct from inventory
    inventoryItem.quantity -= quantity;
    await inventoryItem.save();

    // Create consumption log
    const batchId = new Date().getTime().toString() + Math.random().toString(36).substring(2, 9);
    const consumption = await Consumption.create({
      location,
      product,
      quantity,
      consumedBy,
      notes,
      batchId,
      code
    });

    return NextResponse.json(consumption, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

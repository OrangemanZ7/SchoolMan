import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Consumption, Inventory } from '@/lib/models';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id: rawId } = await params;
    const id = decodeURIComponent(rawId);
    const body = await request.json();
    const { location, consumedBy, items, notes } = body;

    if (!location || !consumedBy || !items || items.length === 0) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    // Find existing consumptions for this batch/group
    // We'll use the same logic: if id doesn't contain '_', it's a batchId. Otherwise, it's a composite ID.
    let query: any = {};
    if (id.includes('_')) {
      const [createdAt, locationId, consumedById] = id.split('_');
      query = { 
        createdAt: new Date(createdAt), 
        location: locationId, 
        consumedBy: consumedById,
        batchId: { $exists: false }
      };
    } else {
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
      query = { 
        $or: [
          { batchId: id },
          ...(isValidObjectId ? [{ _id: id }] : [])
        ]
      };
    }

    const existingConsumptions = await Consumption.find(query);

    if (existingConsumptions.length === 0) {
      return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 });
    }

    // 1. Revert inventory for existing consumptions
    for (const ec of existingConsumptions) {
      const inventoryItem = await Inventory.findOne({ location: ec.location, product: ec.product });
      if (inventoryItem) {
        inventoryItem.quantity += ec.quantity;
        await inventoryItem.save();
      }
    }

    // 2. Validate new items against reverted inventory
    for (const item of items) {
      if (!item.product || !item.quantity || item.quantity <= 0) {
        // Rollback: we should ideally use a transaction, but for now we'll just return error
        // Note: In a real app, we'd use MongoDB transactions here.
        return NextResponse.json({ error: 'Item inválido na lista' }, { status: 400 });
      }
      
      const inventoryItem = await Inventory.findOne({ location, product: item.product });
      if (!inventoryItem || inventoryItem.quantity < item.quantity) {
        return NextResponse.json({ error: `Estoque insuficiente para um dos produtos selecionados` }, { status: 400 });
      }
    }

    // 3. Delete old consumptions
    await Consumption.deleteMany(query);

    // 4. Create new consumptions and deduct from inventory
    const newConsumptions = [];
    const newBatchId = id.includes('_') ? new Date().getTime().toString() + Math.random().toString(36).substring(2, 9) : id;
    
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
        batchId: newBatchId
      });
      newConsumptions.push(consumption);
    }

    return NextResponse.json({ success: true, consumptions: newConsumptions });
  } catch (error: any) {
    console.error('Failed to update consumption batch:', error);
    return NextResponse.json({ error: 'Falha ao atualizar o registro de consumo' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id: rawId } = await params;
    const id = decodeURIComponent(rawId);

    let query: any = {};
    if (id.includes('_')) {
      const [createdAt, locationId, consumedById] = id.split('_');
      query = { 
        createdAt: new Date(createdAt), 
        location: locationId, 
        consumedBy: consumedById,
        batchId: { $exists: false }
      };
    } else {
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
      query = { 
        $or: [
          { batchId: id },
          ...(isValidObjectId ? [{ _id: id }] : [])
        ]
      };
    }

    const existingConsumptions = await Consumption.find(query);

    if (existingConsumptions.length === 0) {
      return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 });
    }

    // Revert inventory
    for (const ec of existingConsumptions) {
      const inventoryItem = await Inventory.findOne({ location: ec.location, product: ec.product });
      if (inventoryItem) {
        inventoryItem.quantity += ec.quantity;
        await inventoryItem.save();
      }
    }

    // Delete consumptions
    await Consumption.deleteMany(query);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete consumption batch:', error);
    return NextResponse.json({ error: 'Falha ao excluir o registro de consumo' }, { status: 500 });
  }
}

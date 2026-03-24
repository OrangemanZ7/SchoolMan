import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Consumption, Inventory } from '@/lib/models';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const { quantity, notes } = body;

    if (quantity === undefined || quantity <= 0) {
      return NextResponse.json({ error: 'Quantidade inválida' }, { status: 400 });
    }

    const consumption = await Consumption.findById(id);
    if (!consumption) {
      return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 });
    }

    const quantityDifference = quantity - consumption.quantity;

    const inventoryItem = await Inventory.findOne({
      location: consumption.location,
      product: consumption.product
    });

    if (!inventoryItem) {
      return NextResponse.json({ error: 'Item não encontrado no estoque' }, { status: 404 });
    }

    if (quantityDifference > 0 && inventoryItem.quantity < quantityDifference) {
      return NextResponse.json({ error: 'Estoque insuficiente para este aumento' }, { status: 400 });
    }

    // Update inventory
    inventoryItem.quantity -= quantityDifference;
    await inventoryItem.save();

    // Update consumption
    consumption.quantity = quantity;
    if (notes !== undefined) consumption.notes = notes;
    await consumption.save();

    return NextResponse.json(consumption);
  } catch (error: any) {
    console.error('Failed to update consumption:', error);
    return NextResponse.json({ error: 'Falha ao atualizar o registro de consumo' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    
    // Find the consumption record
    const consumption = await Consumption.findById(id);
    
    if (!consumption) {
      return NextResponse.json({ error: 'Registro de consumo não encontrado' }, { status: 404 });
    }
    
    // Restore the inventory quantity
    const inventoryItem = await Inventory.findOne({ 
      location: consumption.location, 
      product: consumption.product 
    });
    
    if (inventoryItem) {
      inventoryItem.quantity += consumption.quantity;
      await inventoryItem.save();
    } else {
      // If the inventory item was somehow deleted, recreate it
      await Inventory.create({
        location: consumption.location,
        product: consumption.product,
        quantity: consumption.quantity
      });
    }
    
    // Delete the consumption record
    await Consumption.findByIdAndDelete(id);
    
    return NextResponse.json({ message: 'Registro de consumo excluído e estoque restaurado com sucesso' });
  } catch (error: any) {
    console.error('Failed to delete consumption:', error);
    return NextResponse.json({ error: 'Falha ao excluir o registro de consumo' }, { status: 500 });
  }
}

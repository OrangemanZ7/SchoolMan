import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Contract, Location, Inventory, Product } from '@/lib/models';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await dbConnect();
    const contracts = await Contract.find({})
      .populate('items.product')
      .populate('supplier')
      .sort({ createdAt: -1 });
    return NextResponse.json(contracts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    const contractId = new mongoose.Types.ObjectId();

    // Process items to ALWAYS create new products
    const processedItems = await Promise.all(body.items.map(async (item: any) => {
      const productDoc = await Product.create({
        name: item.name,
        brand: item.brand || '',
        category: item.category,
        unit: item.unit,
        supplier: body.supplier,
        contract: contractId
      });

      return {
        product: productDoc._id,
        pricePerUnit: item.pricePerUnit,
        maxQuantity: item.maxQuantity
      };
    }));

    const contractData = {
      ...body,
      _id: contractId,
      items: processedItems
    };

    const contract = await Contract.create(contractData);

    // Initialize inventory in Central Warehouse for these products
    let central = await Location.findOne({ type: 'central' });
    if (!central) {
      central = await Location.create({ 
        name: 'Main Central Warehouse', 
        type: 'central', 
        city: 'Headquarters' 
      });
    }

    const inventoryOps = processedItems.map((item: any) => ({
      updateOne: {
        filter: { location: central._id, product: item.product },
        update: { $setOnInsert: { location: central._id, product: item.product, quantity: 0 } },
        upsert: true
      }
    }));

    if (inventoryOps.length > 0) {
      await Inventory.bulkWrite(inventoryOps);
    }

    return NextResponse.json(contract, { status: 201 });
  } catch (error: any) {
    // Check for duplicate contract number
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Contract number already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

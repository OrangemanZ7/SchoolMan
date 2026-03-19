import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Inventory, Location, Product } from '@/lib/models';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('location');

    await connectToDatabase();
    
    let query = {};
    if (locationId) {
      query = { location: locationId };
    }

    const inventory = await Inventory.find(query)
      .populate('location')
      .populate({
        path: 'product',
        populate: { path: 'supplier' }
      })
      .sort({ 'location.name': 1, 'product.name': 1 });
      
    return NextResponse.json(inventory);
  } catch (error: any) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

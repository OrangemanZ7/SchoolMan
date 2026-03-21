import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Supplier } from '@/lib/models';

export async function GET() {
  try {
    await dbConnect();
    const suppliers = await Supplier.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'supplier',
          as: 'products'
        }
      },
      { $sort: { alias: 1 } }
    ]);
    return NextResponse.json(suppliers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const supplier = await Supplier.create(body);
    return NextResponse.json(supplier, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'A supplier with this CNPJ/CPF already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

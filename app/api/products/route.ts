import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Product, User, Settings } from '@/lib/models';
import { cookies } from 'next/headers';
import * as jose from 'jose';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    const query = category ? { category } : {};
    const products = await Product.find(query).sort({ name: 1 });
    
    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');
    const { payload } = await jose.jwtVerify(token, secret);
    
    const user = await User.findOne({ email: payload.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const settings = await Settings.findOne();
    const canCreate = user.role === 'admin' || settings?.rolePermissions?.[user.role]?.products?.create;

    if (!canCreate) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to create products' }, { status: 403 });
    }

    const body = await request.json();
    const product = await Product.create(body);
    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

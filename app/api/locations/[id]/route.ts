import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/mongodb';
import { Location, User } from '@/lib/models';

async function checkAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) return false;

  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    await connectToDatabase();
    const user = await User.findById(decoded.id);
    
    return user && user.role === 'admin';
  } catch (err) {
    return false;
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    await connectToDatabase();
    
    const updatedLocation = await Location.findByIdAndUpdate(id, body, { new: true });
    if (!updatedLocation) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }
    
    return NextResponse.json(updatedLocation);
  } catch (error: any) {
    console.error('Error updating location:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    await connectToDatabase();
    
    const deletedLocation = await Location.findByIdAndDelete(id);
    if (!deletedLocation) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Location deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting location:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

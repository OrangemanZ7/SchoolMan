import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Location } from '@/lib/models';

export async function GET() {
  try {
    await connectToDatabase();
    const locations = await Location.find().sort({ type: 1, name: 1 });
    return NextResponse.json(locations);
  } catch (error: any) {
    console.error('Error fetching locations:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await connectToDatabase();
    const newLocation = await Location.create(body);
    return NextResponse.json(newLocation, { status: 201 });
  } catch (error: any) {
    console.error('Error creating location:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

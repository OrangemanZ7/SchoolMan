import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Settings } from '@/lib/models';

export async function GET() {
  try {
    await connectToDatabase();
    let settings = await Settings.findOne();
    
    // Create default settings if none exist
    if (!settings) {
      settings = await Settings.create({
        systemName: 'EduSupply Chain',
        lowInventoryThreshold: 50,
        enableEmailNotifications: true,
      });
    }
    
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectToDatabase();
    const data = await request.json();
    
    let settings = await Settings.findOne();
    
    if (settings) {
      settings = await Settings.findByIdAndUpdate(settings._id, data, { new: true });
    } else {
      settings = await Settings.create(data);
    }
    
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Failed to update settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

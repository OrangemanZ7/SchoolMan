import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Location } from '@/lib/models';

export async function GET() {
  try {
    await connectToDatabase();
    const locations = await Location.find().sort({ type: 1, name: 1 }).lean();
    
    // Calculate central totals
    const centralIndex = locations.findIndex(loc => loc.type === 'central');
    if (centralIndex !== -1) {
      const dependencies = locations.filter(loc => loc.type === 'dependency');
      const totalStudents = dependencies.reduce((sum, loc) => sum + (loc.studentsCount || 0), 0);
      const totalTeachers = dependencies.reduce((sum, loc) => sum + (loc.teachersCount || 0), 0);
      const totalStaff = dependencies.reduce((sum, loc) => sum + (loc.staffCount || 0), 0);
      
      locations[centralIndex].studentsCount = totalStudents;
      locations[centralIndex].teachersCount = totalTeachers;
      locations[centralIndex].staffCount = totalStaff;
    }

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

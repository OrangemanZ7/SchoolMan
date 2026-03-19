import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Location } from '@/lib/models';

export async function POST() {
  try {
    await connectToDatabase();

    const count = await Location.countDocuments();
    if (count > 0) {
      return NextResponse.json({ message: 'Locations already seeded' });
    }

    const locations = [
      { name: 'Central Warehouse', type: 'central', city: 'Metropolis' },
      { name: 'North High School', type: 'dependency', city: 'Metropolis' },
      { name: 'South Elementary', type: 'dependency', city: 'Metropolis' },
      { name: 'East Middle School', type: 'dependency', city: 'Metropolis' },
      { name: 'West High School', type: 'dependency', city: 'Metropolis' },
      { name: 'Central Elementary', type: 'dependency', city: 'Metropolis' },
      { name: 'Valley Middle School', type: 'dependency', city: 'Metropolis' },
    ];

    await Location.insertMany(locations);
    return NextResponse.json({ message: 'Locations seeded successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('Error seeding locations:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

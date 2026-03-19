import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Product } from '@/lib/models';

export async function POST() {
  try {
    await dbConnect();
    const demoProducts = [
      { name: 'Rice (White, 5kg)', category: 'meal', unit: 'bags', description: 'Standard white rice' },
      { name: 'Black Beans (1kg)', category: 'meal', unit: 'bags', description: 'Dried black beans' },
      { name: 'Cooking Oil (Soybean, 900ml)', category: 'meal', unit: 'bottles', description: 'Refined soybean oil' },
      { name: 'Tomato Paste (340g)', category: 'meal', unit: 'cans', description: 'Concentrated tomato paste' },
      { name: 'Chicken Breast (Frozen)', category: 'meal', unit: 'kg', description: 'Boneless skinless chicken breast' },
      { name: 'Printer Paper (A4, 500 sheets)', category: 'office', unit: 'reams', description: 'Standard white copy paper' },
      { name: 'Ballpoint Pens (Blue, Box of 50)', category: 'office', unit: 'boxes', description: 'Medium point blue pens' },
    ];
    
    // Only insert if empty to avoid duplicates
    const count = await Product.countDocuments();
    if (count === 0) {
      await Product.insertMany(demoProducts);
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

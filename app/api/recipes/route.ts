import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Recipe } from '@/lib/models';

export async function GET() {
  try {
    await connectToDatabase();
    const recipes = await Recipe.find().populate('ingredients.product').sort({ name: 1 });
    return NextResponse.json(recipes);
  } catch (error) {
    console.error('Failed to fetch recipes:', error);
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const data = await request.json();
    
    if (!data.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const recipe = await Recipe.create(data);
    return NextResponse.json(recipe, { status: 201 });
  } catch (error) {
    console.error('Failed to create recipe:', error);
    return NextResponse.json({ error: 'Failed to create recipe' }, { status: 500 });
  }
}

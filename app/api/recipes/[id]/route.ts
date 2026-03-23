import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Recipe } from '@/lib/models';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const data = await request.json();
    
    const recipe = await Recipe.findByIdAndUpdate(id, data, { new: true });
    
    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }
    
    return NextResponse.json(recipe);
  } catch (error) {
    console.error('Failed to update recipe:', error);
    return NextResponse.json({ error: 'Failed to update recipe' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    
    const recipe = await Recipe.findByIdAndDelete(id);
    
    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error('Failed to delete recipe:', error);
    return NextResponse.json({ error: 'Failed to delete recipe' }, { status: 500 });
  }
}

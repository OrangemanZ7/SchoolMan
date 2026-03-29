import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Inventory, InventoryAdjustment, User } from '@/lib/models';
import { cookies } from 'next/headers';
import * as jose from 'jose';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { inventoryId, newQuantity, justification } = body;

    if (!inventoryId || newQuantity === undefined || !justification) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Authenticate user
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');
    const { payload } = await jose.jwtVerify(token, secret);
    
    await connectToDatabase();
    
    const user = await User.findOne({ email: payload.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { Settings } = await import('@/lib/models');
    const settings = await Settings.findOne();
    const canAdjust = user.role === 'admin' || user.role === 'manager' || settings?.rolePermissions?.[user.role]?.adjustments?.create;

    // Check permissions
    if (!canAdjust) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to adjust inventory' }, { status: 403 });
    }

    const inventory = await Inventory.findById(inventoryId);
    if (!inventory) {
      return NextResponse.json({ error: 'Inventory record not found' }, { status: 404 });
    }

    const previousQuantity = inventory.quantity;

    // Create adjustment record
    await InventoryAdjustment.create({
      location: inventory.location,
      product: inventory.product,
      previousQuantity,
      newQuantity,
      adjustedBy: user._id,
      justification
    });

    // Create consumption record to reflect the movement
    const difference = previousQuantity - newQuantity;
    if (difference !== 0) {
      const { Location, Consumption } = await import('@/lib/models');
      const locationDoc = await Location.findById(inventory.location);
      const alias = locationDoc?.alias || locationDoc?.name.substring(0, 2).toUpperCase() || 'XX';
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const code = `AJ-${dateStr}-${alias}`;

      await Consumption.create({
        location: inventory.location,
        product: inventory.product,
        quantity: difference, // positive if stock decreased, negative if stock increased
        consumedBy: user._id,
        notes: `Ajuste de Estoque: ${justification}`,
        batchId: `ADJ-${Date.now()}`,
        code
      });
    }

    // Update inventory
    inventory.quantity = newQuantity;
    await inventory.save();

    return NextResponse.json({ success: true, inventory });
  } catch (error: any) {
    console.error('Error adjusting inventory:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

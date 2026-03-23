import mongoose, { Schema, model, models } from 'mongoose';

// --- User Schema ---
// Represents system users with different roles and permissions
const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  employeeNumber: { type: String },
  cellPhone: { type: String },
  role: { 
    type: String, 
    default: 'dependency' 
  },
  location: { type: Schema.Types.ObjectId, ref: 'Location' }, // For 'warehouse' or 'dependency' roles
}, { timestamps: true });

export const User = models.User || model('User', UserSchema);

// --- Location Schema ---
// Represents the Central Warehouse or one of the 6 dependencies
const LocationSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['central', 'dependency'], required: true },
  city: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  studentsCount: { type: Number, default: 0 },
  teachersCount: { type: Number, default: 0 },
  staffCount: { type: Number, default: 0 },
}, { timestamps: true });

export const Location = models.Location || model('Location', LocationSchema);

// --- Supplier Schema ---
// Represents a vendor/supplier for contracts or ad-hoc purchases
const SupplierSchema = new Schema({
  name: { type: String, required: true }, // Full company name
  alias: { type: String, required: true }, // Short name for listings
  document: { type: String, required: true, unique: true }, // CNPJ or CPF
  email: { type: String },
  phone: { type: String },
  attendantName: { type: String }, // Contact person
}, { timestamps: true });

export const Supplier = models.Supplier || model('Supplier', SupplierSchema);

// --- Product Schema ---
// Represents an item (meal ingredient or office supply)
const ProductSchema = new Schema({
  name: { type: String, required: true },
  brand: { type: String },
  category: { type: String, enum: ['meal', 'office'], required: true },
  unit: { type: String, required: true }, // e.g., kg, liters, units, boxes
  description: { type: String },
  supplier: { type: Schema.Types.ObjectId, ref: 'Supplier' },
  contract: { type: Schema.Types.ObjectId, ref: 'Contract' },
  lowInventoryThreshold: { type: Number }, // Product-specific threshold
}, { timestamps: true });

export const Product = models.Product || model('Product', ProductSchema);

// --- Contract Schema ---
// Public contracts for meal products with limits and prices
const ContractSchema = new Schema({
  contractNumber: { type: String, required: true, unique: true },
  supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
  validFrom: { type: Date, required: true },
  validUntil: { type: Date, required: true },
  status: { type: String, enum: ['active', 'expired', 'exhausted'], default: 'active' },
  items: [{
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    pricePerUnit: { type: Number, required: true },
    maxQuantity: { type: Number, required: true },
    purchasedQuantity: { type: Number, default: 0 }
  }]
}, { timestamps: true });

export const Contract = models.Contract || model('Contract', ContractSchema);

// --- Inventory Schema ---
// Tracks the quantity of a product at a specific location
const InventorySchema = new Schema({
  location: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, default: 0 },
}, { timestamps: true });

// Ensure unique product per location
InventorySchema.index({ location: 1, product: 1 }, { unique: true });

export const Inventory = models.Inventory || model('Inventory', InventorySchema);

// --- Order Schema ---
// Purchase orders for products (from suppliers to Central Warehouse)
const OrderSchema = new Schema({
  orderNumber: { type: String, required: true, unique: true },
  type: { type: String, enum: ['contract', 'inquiry'], required: true }, // contract for meals, inquiry for office
  contract: { type: Schema.Types.ObjectId, ref: 'Contract' }, // Optional, only for meals
  supplierName: { type: String }, // For office supplies bought via inquiry
  status: { type: String, enum: ['pending', 'received', 'cancelled'], default: 'pending' },
  expectedDelivery: { type: Date },
  items: [{
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    receivedQuantity: { type: Number },
    pricePerUnit: { type: Number, required: true },
  }]
}, { timestamps: true });

export const Order = models.Order || model('Order', OrderSchema);

// --- Shipment Schema ---
// Transfers from Central Warehouse to Dependencies
const ShipmentSchema = new Schema({
  shipmentNumber: { type: String, required: true, unique: true },
  fromLocation: { type: Schema.Types.ObjectId, ref: 'Location', required: true }, // Usually Central
  toLocation: { type: Schema.Types.ObjectId, ref: 'Location', required: true }, // Dependency
  status: { type: String, enum: ['preparing', 'shipped', 'delivered'], default: 'preparing' },
  shippedAt: { type: Date },
  deliveredAt: { type: Date },
  items: [{
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    receivedQuantity: { type: Number },
  }]
}, { timestamps: true });

// --- Consumption Schema ---
// Tracks the consumption of products at a specific location
const ConsumptionSchema = new Schema({
  location: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  consumedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  notes: { type: String },
}, { timestamps: true });

export const Consumption = models.Consumption || model('Consumption', ConsumptionSchema);

// --- Settings Schema ---
// System configuration
const SettingsSchema = new Schema({
  systemName: { type: String, default: 'Prof. João Florentino' },
  lowInventoryThreshold: { type: Number, default: 50 },
  enableEmailNotifications: { type: Boolean, default: true },
  rolePermissions: { type: Schema.Types.Mixed, default: {} },
  roles: { 
    type: [{ id: String, name: String }], 
    default: [
      { id: 'admin', name: 'Administrador' },
      { id: 'manager', name: 'Gerente' },
      { id: 'purchaser', name: 'Comprador' },
      { id: 'warehouse', name: 'Almoxarifado' },
      { id: 'dependency', name: 'Dependência' }
    ] 
  }
}, { timestamps: true });

export const Settings = models.Settings || model('Settings', SettingsSchema);

export const Shipment = models.Shipment || model('Shipment', ShipmentSchema);

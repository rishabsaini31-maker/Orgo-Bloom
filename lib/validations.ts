import { z } from "zod";

// Auth validation schemas
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.preprocess(
    (val) => (!val || val === "" ? undefined : val),
    z.string().optional(),
  ),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Product validation schemas
export const productSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.number().positive("Price must be positive"),
  weight: z.string().min(1, "Weight is required"),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  imageUrl: z.string().min(1).optional().or(z.literal("")),
  images: z.array(z.string().min(1)).optional(),
  category: z.enum(["cow", "chicken"]).default("cow"),
  benefits: z.array(z.string()).optional(),
  usage: z.string().optional(),
  composition: z.string().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export const updateProductSchema = productSchema.partial();

// Address validation schema
export const addressSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  addressLine1: z.string().min(5, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Invalid pincode"),
  country: z.string().default("India"),
  isDefault: z.boolean().optional(),
});

// Cart item validation
export const cartItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().positive("Quantity must be positive"),
  weight: z.string().min(1, "Weight variant is required"),
});

// Order validation
export const createOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().cuid(),
      quantity: z.number().int().positive(),
      weight: z.string(),
    }),
  ),
  shippingAddressId: z.string().cuid(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type CartItemInput = z.infer<typeof cartItemSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

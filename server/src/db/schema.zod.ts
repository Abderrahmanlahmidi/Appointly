import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users, services, appointments } from './schema';

const commonOmit = {
  id: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  firstName: z.string().min(2, 'First name is too short'),
  lastName: z.string().min(2, 'Last name is too short'),
  phone: z.string().optional(),
}).omit(commonOmit);

export const updateUserSchema = insertUserSchema.partial();

export const insertServiceSchema = createInsertSchema(services, {
  title: z.string().min(3, 'Title must be at least 3 characters'),
  price: z.number().positive('Price must be a positive number'),
  duration: z.number().int().min(1, 'Duration must be at least 1 minute'),
}).omit(commonOmit);

export const insertAppointmentSchema = createInsertSchema(appointments, {
  totalPrice: z.number().nonnegative('Total price cannot be negative'),
}).omit(commonOmit);

export type CreateUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

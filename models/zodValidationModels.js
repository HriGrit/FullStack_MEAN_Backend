import { z } from 'zod';



export const userSignUpSchema = z.object({
  name: z.string(),
  password: z.string().min(8),
  email: z.email(),
  phone: z.string(),  
}).strict();

export const userSignInSchema=z.object({
    email:z.email(),
    password:z.string().min(8),
}).strict();

// Common validators
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/);

// Doctor
export const doctorCreateSchema = z.object({
  userId: objectIdSchema,
  deptId: objectIdSchema.optional(),
  specialization: z.string().max(100).optional(),
  availability: z.string().max(100).optional()
}).strict();

export const doctorUpdateSchema = z.object({
  deptId: objectIdSchema.optional(),
  specialization: z.string().max(100).optional(),
  availability: z.string().max(100).optional()
}).strict();

// Appointment
export const appointmentCreateSchema = z.object({
  patientId: objectIdSchema,
  doctorId: objectIdSchema,
  appointmentDate: z.coerce.date(),
  status: z.enum(['BOOKED','COMPLETED','CANCELLED']).optional()
}).strict();

export const appointmentUpdateSchema = z.object({
  patientId: objectIdSchema.optional(),
  doctorId: objectIdSchema.optional(),
  appointmentDate: z.coerce.date().optional(),
  status: z.enum(['BOOKED','COMPLETED','CANCELLED']).optional()
}).strict();

// Prescription
export const prescriptionCreateSchema = z.object({
  appointmentId: objectIdSchema,
  doctorNotes: z.string().optional(),
  medicines: z.string().optional()
}).strict();

export const prescriptionUpdateSchema = z.object({
  doctorNotes: z.string().optional(),
  medicines: z.string().optional()
}).strict();
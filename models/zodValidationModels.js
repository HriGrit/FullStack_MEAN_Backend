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
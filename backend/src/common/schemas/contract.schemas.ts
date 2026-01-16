import { z } from 'zod';

export const UserRoleSchema = z.enum(['super_admin', 'proprietario', 'gerente', 'operador']);
export const UserStatusSchema = z.enum(['ativo', 'pendente_aprovacao', 'suspenso']);
export const PropertyStatusSchema = z.enum(['ativa', 'pendente', 'suspensa']);
export const PlanTypeSchema = z.enum(['porteira', 'piquete', 'retiro', 'estancia', 'barao']);
export const MovementTypeSchema = z.enum(['nascimento', 'morte', 'venda', 'compra', 'vacina', 'ajuste']);
export const SexTypeSchema = z.enum(['macho', 'femea']);

export const LoginRequestSchema = z.object({
  cpfCnpj: z.string().min(11).max(14),
  password: z.string().min(6),
});

export const RegisterRequestSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  cpfCnpj: z.string().min(11).max(14),
  password: z.string().min(6),
  phone: z.string().optional(),
});

export const UserResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  cpfCnpj: z.string(),
  phone: z.string().nullable(),
  role: UserRoleSchema,
  status: UserStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const LoginResponseSchema = z.object({
  access_token: z.string(),
  user: UserResponseSchema,
});

export const PropertyResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  city: z.string(),
  state: z.string(),
  totalArea: z.number(),
  cultivatedArea: z.number(),
  naturalArea: z.number(),
  cattleCount: z.number(),
  status: PropertyStatusSchema,
  plan: PlanTypeSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreatePropertyRequestSchema = z.object({
  name: z.string().min(3),
  city: z.string().min(2),
  state: z.string().length(2),
  totalArea: z.number().positive(),
  cultivatedArea: z.number().nonnegative(),
  naturalArea: z.number().nonnegative(),
  cattleCount: z.number().nonnegative(),
  plan: PlanTypeSchema,
});

export const LivestockResponseSchema = z.object({
  id: z.string().uuid(),
  propertyId: z.string().uuid(),
  species: z.string(),
  ageGroup: z.string(),
  sex: SexTypeSchema,
  headcount: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateMovementRequestSchema = z.object({
  propertyId: z.string().uuid(),
  type: MovementTypeSchema,
  date: z.string().datetime(),
  quantity: z.number().positive(),
  sex: SexTypeSchema.optional(),
  ageGroup: z.string().optional(),
  description: z.string(),
  destination: z.string().optional(),
  value: z.number().optional(),
  gtaNumber: z.string().optional(),
  photoUrl: z.string().url().optional(),
  cause: z.string().optional(),
});

export const MovementResponseSchema = z.object({
  id: z.string().uuid(),
  propertyId: z.string().uuid(),
  type: MovementTypeSchema,
  date: z.date(),
  quantity: z.number(),
  sex: SexTypeSchema.nullable(),
  ageGroup: z.string().nullable(),
  description: z.string(),
  destination: z.string().nullable(),
  value: z.number().nullable(),
  gtaNumber: z.string().nullable(),
  photoUrl: z.string().nullable(),
  cause: z.string().nullable(),
  createdAt: z.date(),
});

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
    totalPages: z.number(),
  });

export const ErrorResponseSchema = z.object({
  statusCode: z.number(),
  message: z.union([z.string(), z.array(z.string())]),
  error: z.string().optional(),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type PropertyResponse = z.infer<typeof PropertyResponseSchema>;
export type CreatePropertyRequest = z.infer<typeof CreatePropertyRequestSchema>;
export type LivestockResponse = z.infer<typeof LivestockResponseSchema>;
export type CreateMovementRequest = z.infer<typeof CreateMovementRequestSchema>;
export type MovementResponse = z.infer<typeof MovementResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

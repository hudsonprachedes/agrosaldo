export class UserEntity {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

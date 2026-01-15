export class MovementEntity {
  id: string;
  propertyId: string;
  type: string;
  date: Date;
  quantity: number;
  sex?: string;
  ageGroup?: string;
  description: string;
  destination?: string;
  value?: number;
  gtaNumber?: string;
  photoUrl?: string;
  cause?: string;
  createdAt: Date;
}

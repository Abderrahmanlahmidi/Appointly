export class UpdateServiceDto {
  title?: string;
  description?: string | null;
  duration?: number;
  price?: number;
  status?: 'ACTIVE' | 'INACTIVE';
  categoryId?: number | null;
}

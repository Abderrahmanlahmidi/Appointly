export class ModerateCategoryDto {
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  moderationNote?: string | null;
}

export class ModerateServiceDto {
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  moderationNote?: string | null;
}

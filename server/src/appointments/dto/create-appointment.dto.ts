export class CreateAppointmentDto {
  serviceId: number;
  availabilityId: number;
  note?: string | null;
}

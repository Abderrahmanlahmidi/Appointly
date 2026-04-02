import { BadRequestException } from '@nestjs/common';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;

export const normalizeOptionalText = (value?: string | null) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const parseRequiredText = (value: unknown, label: string) => {
  if (typeof value !== 'string') {
    throw new BadRequestException(`${label} is required`);
  }

  const trimmed = value.trim();
  if (!trimmed.length) {
    throw new BadRequestException(`${label} is required`);
  }

  return trimmed;
};

export const parsePositiveInteger = (value: unknown, label: string) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    throw new BadRequestException(`${label} must be a positive integer`);
  }

  return parsed;
};

export const parseOptionalId = (value: unknown, label: string) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  return parsePositiveInteger(value, label);
};

export const parsePositivePrice = (value: unknown, label = 'Price') => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new BadRequestException(`${label} must be a positive number`);
  }

  return parsed.toFixed(2);
};

export const parseDateInput = (value: unknown, label = 'Date') => {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value.trim())) {
    throw new BadRequestException(`${label} must use YYYY-MM-DD format`);
  }

  const normalized = value.trim();
  const date = new Date(`${normalized}T00:00:00.000Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== normalized
  ) {
    throw new BadRequestException(`${label} is invalid`);
  }

  return normalized;
};

export const toDateOnly = (value: string) => new Date(`${value}T00:00:00.000Z`);

export const parseTimeInput = (value: unknown, label: string) => {
  if (typeof value !== 'string') {
    throw new BadRequestException(`${label} is required`);
  }

  const normalized = value.trim();
  const match = TIME_PATTERN.exec(normalized);
  if (!match) {
    throw new BadRequestException(`${label} must use HH:MM format`);
  }

  return `${match[1]}:${match[2]}:00`;
};

export const ensureValidTimeRange = (startTime: string, endTime: string) => {
  if (startTime >= endTime) {
    throw new BadRequestException('End time must be after start time');
  }
};

export const toSlotDateTime = (date: string | Date, time: string) => {
  const normalizedDate = formatDateValue(date);
  const normalizedTime = formatTimeValue(time);
  return new Date(`${normalizedDate}T${normalizedTime}:00`);
};

export const isPastSlot = (date: string | Date, startTime: string) =>
  toSlotDateTime(date, startTime).getTime() < Date.now();

export const formatDateValue = (value: string | Date | null | undefined) => {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
};

export const formatTimeValue = (value: string | null | undefined) => {
  if (!value) return null;
  return value.slice(0, 5);
};

export const buildUserName = (user?: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}) => {
  const firstName = String(user?.firstName ?? '').trim();
  const lastName = String(user?.lastName ?? '').trim();
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || String(user?.email ?? '').trim() || 'Unknown user';
};

export const parseApprovalStatus = (
  value: unknown,
): 'PENDING' | 'APPROVED' | 'REJECTED' => {
  if (typeof value !== 'string') {
    throw new BadRequestException('Invalid approval status');
  }

  const normalized = value.trim().toUpperCase();

  if (
    normalized !== 'PENDING' &&
    normalized !== 'APPROVED' &&
    normalized !== 'REJECTED'
  ) {
    throw new BadRequestException('Invalid approval status');
  }

  return normalized;
};

export const parseAppointmentStatus = (
  value: unknown,
): 'PENDING' | 'CONFIRMED' | 'CANCELLED' => {
  if (typeof value !== 'string') {
    throw new BadRequestException('Invalid appointment status');
  }

  const normalized = value.trim().toUpperCase();

  if (
    normalized !== 'PENDING' &&
    normalized !== 'CONFIRMED' &&
    normalized !== 'CANCELLED'
  ) {
    throw new BadRequestException('Invalid appointment status');
  }

  return normalized;
};

import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { buildUserName } from '../common/domain.utils';
import type { AuthUser } from '../auth/request-auth';
import { requireAdminUser } from '../auth/request-auth';
import { DRIZZLE } from '../db/drizzle.module';
import * as schema from '../db/schema';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

const parseUserRole = (
  value: unknown,
): 'ADMIN' | 'USER' | 'PROVIDER' => {
  if (typeof value !== 'string') {
    throw new BadRequestException('Invalid user role');
  }

  const normalized = value.trim().toUpperCase();

  if (
    normalized !== 'ADMIN' &&
    normalized !== 'USER' &&
    normalized !== 'PROVIDER'
  ) {
    throw new BadRequestException('Invalid user role');
  }

  return normalized;
};

type UserRow = {
  user: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    image: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  };
  roleName: string | null;
};

@Injectable()
export class UsersService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  private serializeUser(row: UserRow) {
    return {
      id: row.user.id,
      name: buildUserName(row.user),
      firstName: row.user.firstName,
      lastName: row.user.lastName,
      email: row.user.email,
      image: row.user.image,
      role: String(row.roleName ?? 'USER')
        .trim()
        .toUpperCase(),
      createdAt: row.user.createdAt,
      updatedAt: row.user.updatedAt,
    };
  }

  private async getUserRowById(id: number) {
    const [row] = await this.db
      .select({
        user: {
          id: schema.users.id,
          firstName: schema.users.firstName,
          lastName: schema.users.lastName,
          email: schema.users.email,
          image: schema.users.image,
          createdAt: schema.users.createdAt,
          updatedAt: schema.users.updatedAt,
        },
        roleName: schema.roles.name,
      })
      .from(schema.users)
      .leftJoin(schema.roles, eq(schema.users.roleId, schema.roles.id))
      .where(eq(schema.users.id, id));

    return row ?? null;
  }

  async findAll(authUser: AuthUser) {
    requireAdminUser(authUser);

    const rows = await this.db
      .select({
        user: {
          id: schema.users.id,
          firstName: schema.users.firstName,
          lastName: schema.users.lastName,
          email: schema.users.email,
          image: schema.users.image,
          createdAt: schema.users.createdAt,
          updatedAt: schema.users.updatedAt,
        },
        roleName: schema.roles.name,
      })
      .from(schema.users)
      .leftJoin(schema.roles, eq(schema.users.roleId, schema.roles.id))
      .orderBy(desc(schema.users.createdAt), desc(schema.users.id));

    return rows.map((row) => this.serializeUser(row));
  }

  async updateRole(
    id: number,
    values: UpdateUserRoleDto,
    authUser: AuthUser,
  ) {
    const adminUser = requireAdminUser(authUser);

    if (id === adminUser.id) {
      throw new ForbiddenException('You cannot change your own role');
    }

    const roleName = parseUserRole(values?.role);

    const role = await this.db.query.roles.findFirst({
      where: eq(schema.roles.name, roleName),
    });

    if (!role) {
      throw new BadRequestException(`Role "${roleName}" is not configured`);
    }

    const [updatedUser] = await this.db
      .update(schema.users)
      .set({ roleId: role.id })
      .where(eq(schema.users.id, id))
      .returning({ id: schema.users.id });

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    const row = await this.getUserRowById(id);

    if (!row) {
      throw new NotFoundException('User not found');
    }

    return this.serializeUser(row);
  }
}

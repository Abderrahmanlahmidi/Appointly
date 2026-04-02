import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { requireAuthUser } from '../auth/request-auth';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findMine(@Req() req: Request) {
    return this.notificationsService.findMine(await requireAuthUser(req));
  }

  @Patch('read-all')
  async markAllRead(@Req() req: Request) {
    return this.notificationsService.markAllRead(await requireAuthUser(req));
  }

  @Patch(':id/read')
  async markRead(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.notificationsService.markRead(id, await requireAuthUser(req));
  }
}

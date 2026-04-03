import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { requireAuthUser } from '../auth/request-auth';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { ChatService } from './chat.service';

@Controller('chat/conversations')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  async findMine(@Req() req: Request) {
    return this.chatService.listConversations(await requireAuthUser(req));
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.chatService.getConversation(id, await requireAuthUser(req));
  }

  @Post()
  async create(@Body() body: CreateConversationDto, @Req() req: Request) {
    return this.chatService.createConversation(
      body,
      await requireAuthUser(req),
    );
  }

  @Post(':id/messages')
  async createMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateChatMessageDto,
    @Req() req: Request,
  ) {
    return this.chatService.sendMessage(id, body, await requireAuthUser(req));
  }
}

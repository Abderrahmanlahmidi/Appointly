import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, inArray, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { AuthUser } from '../auth/request-auth';
import {
  buildUserName,
  parsePositiveInteger,
  parseRequiredText,
} from '../common/domain.utils';
import { DRIZZLE } from '../db/drizzle.module';
import * as schema from '../db/schema';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';

const clientUser = alias(schema.users, 'chat_client_user');
const providerUser = alias(schema.users, 'chat_provider_user');
const senderUser = alias(schema.users, 'chat_sender_user');
const serviceProviderUser = alias(schema.users, 'chat_service_provider_user');

type UserPreview = {
  id: number | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  image: string | null;
};

type ConversationRow = {
  conversation: typeof schema.chatConversations.$inferSelect;
  service: {
    id: number;
    title: string;
    status: 'ACTIVE' | 'INACTIVE';
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  };
  client: UserPreview;
  provider: UserPreview;
};

type MessageRow = {
  message: typeof schema.chatMessages.$inferSelect;
  sender: UserPreview;
};

const normalizeRole = (value?: string | null) =>
  String(value ?? 'USER')
    .trim()
    .toUpperCase();

@Injectable()
export class ChatService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly notificationsService: NotificationsService,
  ) {}

  private serializeUser(user: UserPreview) {
    return {
      id: user.id,
      name: buildUserName(user),
      email: user.email,
      image: user.image,
    };
  }

  private serializeConversationRow(
    row: ConversationRow,
    authUserId: number,
    latestMessage?: { body: string; createdAt: Date } | null,
  ) {
    const isProviderParticipant = row.conversation.providerId === authUserId;
    const otherParticipant = isProviderParticipant ? row.client : row.provider;

    return {
      id: row.conversation.id,
      service: {
        id: row.service.id,
        title: row.service.title,
        status: row.service.status,
        approvalStatus: row.service.approvalStatus,
      },
      otherParticipant: this.serializeUser(otherParticipant),
      currentUserRole: isProviderParticipant ? 'PROVIDER' : 'USER',
      latestMessage,
      lastMessageAt: row.conversation.lastMessageAt,
      createdAt: row.conversation.createdAt,
      updatedAt: row.conversation.updatedAt,
    };
  }

  private serializeMessageRow(row: MessageRow, authUserId: number) {
    return {
      id: row.message.id,
      body: row.message.body,
      senderId: row.message.senderId,
      isOwnMessage: row.message.senderId === authUserId,
      createdAt: row.message.createdAt,
      updatedAt: row.message.updatedAt,
      sender: this.serializeUser(row.sender),
    };
  }

  private async getConversationRowById(id: number) {
    const [row] = await this.db
      .select({
        conversation: schema.chatConversations,
        service: {
          id: schema.services.id,
          title: schema.services.title,
          status: schema.services.status,
          approvalStatus: schema.services.approvalStatus,
        },
        client: {
          id: clientUser.id,
          firstName: clientUser.firstName,
          lastName: clientUser.lastName,
          email: clientUser.email,
          image: clientUser.image,
        },
        provider: {
          id: providerUser.id,
          firstName: providerUser.firstName,
          lastName: providerUser.lastName,
          email: providerUser.email,
          image: providerUser.image,
        },
      })
      .from(schema.chatConversations)
      .innerJoin(
        schema.services,
        eq(schema.chatConversations.serviceId, schema.services.id),
      )
      .innerJoin(
        clientUser,
        eq(schema.chatConversations.clientId, clientUser.id),
      )
      .innerJoin(
        providerUser,
        eq(schema.chatConversations.providerId, providerUser.id),
      )
      .where(eq(schema.chatConversations.id, id));

    return row;
  }

  private async getConversationRowByParticipants(
    serviceId: number,
    clientId: number,
    providerId: number,
  ) {
    const [row] = await this.db
      .select({
        conversation: schema.chatConversations,
        service: {
          id: schema.services.id,
          title: schema.services.title,
          status: schema.services.status,
          approvalStatus: schema.services.approvalStatus,
        },
        client: {
          id: clientUser.id,
          firstName: clientUser.firstName,
          lastName: clientUser.lastName,
          email: clientUser.email,
          image: clientUser.image,
        },
        provider: {
          id: providerUser.id,
          firstName: providerUser.firstName,
          lastName: providerUser.lastName,
          email: providerUser.email,
          image: providerUser.image,
        },
      })
      .from(schema.chatConversations)
      .innerJoin(
        schema.services,
        eq(schema.chatConversations.serviceId, schema.services.id),
      )
      .innerJoin(
        clientUser,
        eq(schema.chatConversations.clientId, clientUser.id),
      )
      .innerJoin(
        providerUser,
        eq(schema.chatConversations.providerId, providerUser.id),
      )
      .where(
        and(
          eq(schema.chatConversations.serviceId, serviceId),
          eq(schema.chatConversations.clientId, clientId),
          eq(schema.chatConversations.providerId, providerId),
        ),
      );

    return row;
  }

  private async getConversationMessages(conversationId: number) {
    return this.db
      .select({
        message: schema.chatMessages,
        sender: {
          id: senderUser.id,
          firstName: senderUser.firstName,
          lastName: senderUser.lastName,
          email: senderUser.email,
          image: senderUser.image,
        },
      })
      .from(schema.chatMessages)
      .innerJoin(senderUser, eq(schema.chatMessages.senderId, senderUser.id))
      .where(eq(schema.chatMessages.conversationId, conversationId))
      .orderBy(asc(schema.chatMessages.createdAt));
  }

  private assertParticipant(row: ConversationRow, authUser: AuthUser) {
    if (
      row.conversation.clientId !== authUser.id &&
      row.conversation.providerId !== authUser.id
    ) {
      throw new NotFoundException('Conversation not found');
    }
  }

  private async buildConversation(row: ConversationRow, authUserId: number) {
    const messages = await this.getConversationMessages(row.conversation.id);
    const serializedMessages = messages.map((messageRow) =>
      this.serializeMessageRow(messageRow, authUserId),
    );
    const latestMessage = serializedMessages.length
      ? {
          body: serializedMessages[serializedMessages.length - 1].body,
          createdAt:
            serializedMessages[serializedMessages.length - 1].createdAt,
        }
      : null;

    return {
      ...this.serializeConversationRow(row, authUserId, latestMessage),
      messages: serializedMessages,
    };
  }

  private async appendMessage(
    row: ConversationRow,
    senderId: number,
    body: string,
  ) {
    const now = new Date();

    await this.db.transaction(async (tx) => {
      await tx.insert(schema.chatMessages).values({
        conversationId: row.conversation.id,
        senderId,
        body,
      });

      await tx
        .update(schema.chatConversations)
        .set({
          lastMessageAt: now,
          updatedAt: now,
        })
        .where(eq(schema.chatConversations.id, row.conversation.id));
    });

    const sender =
      senderId === row.conversation.providerId ? row.provider : row.client;
    const recipientId =
      senderId === row.conversation.providerId
        ? row.conversation.clientId
        : row.conversation.providerId;

    await this.notificationsService.createMany([
      {
        userId: recipientId,
        title: 'New chat message',
        message: `${buildUserName(sender)} sent you a message about "${row.service.title}".`,
        type: 'INFO',
      },
    ]);
  }

  private async getStartableService(serviceId: number) {
    const [row] = await this.db
      .select({
        service: {
          id: schema.services.id,
          title: schema.services.title,
          status: schema.services.status,
          approvalStatus: schema.services.approvalStatus,
          categoryId: schema.services.categoryId,
          providerId: schema.services.providerId,
        },
        category: {
          status: schema.categories.status,
        },
        provider: {
          id: serviceProviderUser.id,
          firstName: serviceProviderUser.firstName,
          lastName: serviceProviderUser.lastName,
          email: serviceProviderUser.email,
          image: serviceProviderUser.image,
        },
      })
      .from(schema.services)
      .leftJoin(
        schema.categories,
        eq(schema.services.categoryId, schema.categories.id),
      )
      .leftJoin(
        serviceProviderUser,
        eq(schema.services.providerId, serviceProviderUser.id),
      )
      .where(eq(schema.services.id, serviceId));

    const providerId = row?.provider?.id;

    if (!row?.service?.id || !providerId || !row.provider) {
      throw new NotFoundException('Service not found');
    }

    const categoryApproved =
      row.service.categoryId === null || row.category?.status === 'APPROVED';
    const isVisible =
      row.service.status === 'ACTIVE' &&
      row.service.approvalStatus === 'APPROVED' &&
      categoryApproved;

    if (!isVisible) {
      throw new NotFoundException('Service not found');
    }

    return {
      ...row,
      provider: {
        id: providerId,
        firstName: row.provider.firstName,
        lastName: row.provider.lastName,
        email: row.provider.email,
        image: row.provider.image,
      },
    };
  }

  async listConversations(authUser: AuthUser) {
    const rows = await this.db
      .select({
        conversation: schema.chatConversations,
        service: {
          id: schema.services.id,
          title: schema.services.title,
          status: schema.services.status,
          approvalStatus: schema.services.approvalStatus,
        },
        client: {
          id: clientUser.id,
          firstName: clientUser.firstName,
          lastName: clientUser.lastName,
          email: clientUser.email,
          image: clientUser.image,
        },
        provider: {
          id: providerUser.id,
          firstName: providerUser.firstName,
          lastName: providerUser.lastName,
          email: providerUser.email,
          image: providerUser.image,
        },
      })
      .from(schema.chatConversations)
      .innerJoin(
        schema.services,
        eq(schema.chatConversations.serviceId, schema.services.id),
      )
      .innerJoin(
        clientUser,
        eq(schema.chatConversations.clientId, clientUser.id),
      )
      .innerJoin(
        providerUser,
        eq(schema.chatConversations.providerId, providerUser.id),
      )
      .where(
        or(
          eq(schema.chatConversations.clientId, authUser.id),
          eq(schema.chatConversations.providerId, authUser.id),
        ),
      )
      .orderBy(desc(schema.chatConversations.lastMessageAt));

    if (!rows.length) {
      return [];
    }

    const conversationIds = rows.map((row) => row.conversation.id);
    const latestMessages = await this.db
      .select({
        conversationId: schema.chatMessages.conversationId,
        body: schema.chatMessages.body,
        createdAt: schema.chatMessages.createdAt,
      })
      .from(schema.chatMessages)
      .where(inArray(schema.chatMessages.conversationId, conversationIds))
      .orderBy(desc(schema.chatMessages.createdAt));

    const latestMessageByConversation = new Map<
      number,
      { body: string; createdAt: Date }
    >();

    for (const message of latestMessages) {
      if (!latestMessageByConversation.has(message.conversationId)) {
        latestMessageByConversation.set(message.conversationId, {
          body: message.body,
          createdAt: message.createdAt,
        });
      }
    }

    return rows.map((row) =>
      this.serializeConversationRow(
        row,
        authUser.id,
        latestMessageByConversation.get(row.conversation.id) ?? null,
      ),
    );
  }

  async getConversation(id: number, authUser: AuthUser) {
    const row = await this.getConversationRowById(id);

    if (!row) {
      throw new NotFoundException('Conversation not found');
    }

    this.assertParticipant(row, authUser);

    return this.buildConversation(row, authUser.id);
  }

  async createConversation(values: CreateConversationDto, authUser: AuthUser) {
    if (normalizeRole(authUser.role) !== 'USER') {
      throw new ForbiddenException(
        'Only standard users can start a conversation from a service',
      );
    }

    const serviceId = parsePositiveInteger(values?.serviceId, 'serviceId');
    const body = parseRequiredText(values?.message, 'Message');
    const serviceRow = await this.getStartableService(serviceId);

    if (serviceRow.service.providerId === authUser.id) {
      throw new ForbiddenException(
        'You cannot start a conversation with yourself',
      );
    }

    let conversation = await this.getConversationRowByParticipants(
      serviceId,
      authUser.id,
      serviceRow.provider.id,
    );

    if (!conversation) {
      const now = new Date();
      const [createdConversation] = await this.db
        .insert(schema.chatConversations)
        .values({
          serviceId,
          clientId: authUser.id,
          providerId: serviceRow.provider.id,
          lastMessageAt: now,
          updatedAt: now,
        })
        .returning();

      conversation = await this.getConversationRowById(createdConversation.id);
    }

    if (!conversation) {
      throw new NotFoundException('Unable to start conversation');
    }

    await this.appendMessage(conversation, authUser.id, body);

    return this.getConversation(conversation.conversation.id, authUser);
  }

  async sendMessage(
    conversationId: number,
    values: CreateChatMessageDto,
    authUser: AuthUser,
  ) {
    const body = parseRequiredText(values?.message, 'Message');
    const conversation = await this.getConversationRowById(conversationId);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    this.assertParticipant(conversation, authUser);
    await this.appendMessage(conversation, authUser.id, body);

    return this.getConversation(conversationId, authUser);
  }
}

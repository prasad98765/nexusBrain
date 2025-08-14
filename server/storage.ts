import {
  users,
  workspaces,
  workspaceMembers,
  conversations,
  messages,
  type User,
  type UpsertUser,
  type Workspace,
  type InsertWorkspace,
  type WorkspaceMember,
  type InsertWorkspaceMember,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type WorkspaceWithMembers,
  type ConversationWithMessages,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Workspace operations
  createWorkspace(workspace: InsertWorkspace): Promise<Workspace>;
  getUserWorkspaces(userId: string): Promise<WorkspaceWithMembers[]>;
  getWorkspace(id: string): Promise<WorkspaceWithMembers | undefined>;
  addWorkspaceMember(member: InsertWorkspaceMember): Promise<WorkspaceMember>;
  
  // Conversation operations
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getWorkspaceConversations(workspaceId: string): Promise<Conversation[]>;
  getConversation(id: string): Promise<ConversationWithMessages | undefined>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getConversationMessages(conversationId: string): Promise<Message[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Workspace operations
  async createWorkspace(workspaceData: InsertWorkspace): Promise<Workspace> {
    const [workspace] = await db
      .insert(workspaces)
      .values(workspaceData)
      .returning();
    
    // Add owner as admin member
    await db.insert(workspaceMembers).values({
      workspaceId: workspace.id,
      userId: workspace.ownerId,
      role: "owner",
    });

    return workspace;
  }

  async getUserWorkspaces(userId: string): Promise<WorkspaceWithMembers[]> {
    const userWorkspaces = await db
      .select({
        workspace: workspaces,
        owner: users,
      })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .innerJoin(users, eq(workspaces.ownerId, users.id))
      .where(eq(workspaceMembers.userId, userId));

    const result: WorkspaceWithMembers[] = [];
    for (const { workspace, owner } of userWorkspaces) {
      const members = await db
        .select({
          member: workspaceMembers,
          user: users,
        })
        .from(workspaceMembers)
        .innerJoin(users, eq(workspaceMembers.userId, users.id))
        .where(eq(workspaceMembers.workspaceId, workspace.id));

      result.push({
        ...workspace,
        owner,
        members: members.map(({ member, user }) => ({ ...member, user })),
      });
    }

    return result;
  }

  async getWorkspace(id: string): Promise<WorkspaceWithMembers | undefined> {
    const [workspaceData] = await db
      .select({
        workspace: workspaces,
        owner: users,
      })
      .from(workspaces)
      .innerJoin(users, eq(workspaces.ownerId, users.id))
      .where(eq(workspaces.id, id));

    if (!workspaceData) return undefined;

    const members = await db
      .select({
        member: workspaceMembers,
        user: users,
      })
      .from(workspaceMembers)
      .innerJoin(users, eq(workspaceMembers.userId, users.id))
      .where(eq(workspaceMembers.workspaceId, id));

    return {
      ...workspaceData.workspace,
      owner: workspaceData.owner,
      members: members.map(({ member, user }) => ({ ...member, user })),
    };
  }

  async addWorkspaceMember(memberData: InsertWorkspaceMember): Promise<WorkspaceMember> {
    const [member] = await db
      .insert(workspaceMembers)
      .values(memberData)
      .returning();
    return member;
  }

  // Conversation operations
  async createConversation(conversationData: InsertConversation): Promise<Conversation> {
    const [conversation] = await db
      .insert(conversations)
      .values(conversationData)
      .returning();
    return conversation;
  }

  async getWorkspaceConversations(workspaceId: string): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.workspaceId, workspaceId))
      .orderBy(desc(conversations.updatedAt));
  }

  async getConversation(id: string): Promise<ConversationWithMessages | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));

    if (!conversation) return undefined;

    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);

    return {
      ...conversation,
      messages: conversationMessages,
    };
  }

  // Message operations
  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(messageData)
      .returning();
    return message;
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }
}

export const storage = new DatabaseStorage();

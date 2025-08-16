import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";
import { eq, and, desc } from "drizzle-orm";
import {
  users,
  workspaces,
  workspaceMembers,
  conversations,
  messages,
  type InsertUser,
  type User,
  type InsertWorkspace,
  type Workspace,
  type InsertWorkspaceMember,
  type WorkspaceMember,
  type InsertConversation,
  type Conversation,
  type InsertMessage,
  type Message,
  type WorkspaceWithMembers,
  type ConversationWithMessages,
} from "@shared/schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql });

export interface IStorage {
  // Users
  upsertUser(user: InsertUser & { id: string }): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;

  // Workspaces
  createWorkspace(workspace: InsertWorkspace): Promise<Workspace>;
  getWorkspaceById(id: string): Promise<Workspace | null>;
  getWorkspaceWithMembers(id: string): Promise<WorkspaceWithMembers | null>;
  getUserWorkspaces(userId: string): Promise<WorkspaceWithMembers[]>;
  updateWorkspace(id: string, updates: Partial<InsertWorkspace>): Promise<void>;
  deleteWorkspace(id: string): Promise<void>;

  // Workspace Members
  addWorkspaceMember(member: InsertWorkspaceMember): Promise<WorkspaceMember>;
  getWorkspaceMembers(workspaceId: string): Promise<(WorkspaceMember & { user: User })[]>;
  removeWorkspaceMember(workspaceId: string, userId: string): Promise<void>;
  updateMemberRole(workspaceId: string, userId: string, role: string): Promise<void>;

  // Conversations
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversationById(id: string): Promise<Conversation | null>;
  getConversationWithMessages(id: string): Promise<ConversationWithMessages | null>;
  getWorkspaceConversations(workspaceId: string, userId: string): Promise<Conversation[]>;
  updateConversation(id: string, updates: Partial<InsertConversation>): Promise<void>;
  deleteConversation(id: string): Promise<void>;

  // Messages
  createMessage(message: InsertMessage): Promise<Message>;
  getConversationMessages(conversationId: string): Promise<Message[]>;
  deleteMessage(id: string): Promise<void>;
}

class DbStorage implements IStorage {
  // Users
  async upsertUser(user: InsertUser & { id: string }): Promise<User> {
    const [result] = await db
      .insert(users)
      .values(user)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async getUserById(id: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || null;
  }

  // Workspaces
  async createWorkspace(workspace: InsertWorkspace): Promise<Workspace> {
    const [result] = await db.insert(workspaces).values(workspace).returning();
    return result;
  }

  async getWorkspaceById(id: string): Promise<Workspace | null> {
    const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, id));
    return workspace || null;
  }

  async getWorkspaceWithMembers(id: string): Promise<WorkspaceWithMembers | null> {
    const workspace = await this.getWorkspaceById(id);
    if (!workspace) return null;

    const members = await this.getWorkspaceMembers(id);
    const owner = await this.getUserById(workspace.ownerId);

    return {
      ...workspace,
      members,
      owner: owner!,
    };
  }

  async getUserWorkspaces(userId: string): Promise<WorkspaceWithMembers[]> {
    const userMemberships = await db
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, userId));

    const workspacesWithMembers = await Promise.all(
      userMemberships.map(async (membership) => {
        return await this.getWorkspaceWithMembers(membership.workspaceId);
      })
    );

    return workspacesWithMembers.filter(Boolean) as WorkspaceWithMembers[];
  }

  async updateWorkspace(id: string, updates: Partial<InsertWorkspace>): Promise<void> {
    await db
      .update(workspaces)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(workspaces.id, id));
  }

  async deleteWorkspace(id: string): Promise<void> {
    await db.delete(workspaces).where(eq(workspaces.id, id));
  }

  // Workspace Members
  async addWorkspaceMember(member: InsertWorkspaceMember): Promise<WorkspaceMember> {
    const [result] = await db.insert(workspaceMembers).values(member).returning();
    return result;
  }

  async getWorkspaceMembers(workspaceId: string): Promise<(WorkspaceMember & { user: User })[]> {
    const members = await db
      .select()
      .from(workspaceMembers)
      .leftJoin(users, eq(workspaceMembers.userId, users.id))
      .where(eq(workspaceMembers.workspaceId, workspaceId));

    return members.map((row) => ({
      ...row.workspace_members,
      user: row.users!,
    }));
  }

  async removeWorkspaceMember(workspaceId: string, userId: string): Promise<void> {
    await db
      .delete(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, userId)
        )
      );
  }

  async updateMemberRole(workspaceId: string, userId: string, role: string): Promise<void> {
    await db
      .update(workspaceMembers)
      .set({ role })
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, userId)
        )
      );
  }

  // Conversations
  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [result] = await db.insert(conversations).values(conversation).returning();
    return result;
  }

  async getConversationById(id: string): Promise<Conversation | null> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation || null;
  }

  async getConversationWithMessages(id: string): Promise<ConversationWithMessages | null> {
    const conversation = await this.getConversationById(id);
    if (!conversation) return null;

    const conversationMessages = await this.getConversationMessages(id);

    return {
      ...conversation,
      messages: conversationMessages,
    };
  }

  async getWorkspaceConversations(workspaceId: string, userId: string): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.workspaceId, workspaceId),
          eq(conversations.userId, userId)
        )
      )
      .orderBy(desc(conversations.updatedAt));
  }

  async updateConversation(id: string, updates: Partial<InsertConversation>): Promise<void> {
    await db
      .update(conversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(conversations.id, id));
  }

  async deleteConversation(id: string): Promise<void> {
    await db.delete(conversations).where(eq(conversations.id, id));
  }

  // Messages
  async createMessage(message: InsertMessage): Promise<Message> {
    const [result] = await db.insert(messages).values(message).returning();
    return result;
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async deleteMessage(id: string): Promise<void> {
    await db.delete(messages).where(eq(messages.id, id));
  }
}

export const storage = new DbStorage();
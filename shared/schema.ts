// TypeScript types for the frontend to use
// These should match the Python models in server/models.py

export interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: string; // owner, admin, member
  joinedAt?: string;
  user?: User;
}

export interface Conversation {
  id: string;
  title?: string;
  workspaceId: string;
  userId: string;
  model?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  role: string; // user, assistant, system
  model?: string;
  tokens?: string;
  createdAt?: string;
}

// Extended types for API responses
export interface WorkspaceWithMembers extends Workspace {
  members: (WorkspaceMember & { user: User })[];
  owner: User;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

// For upsert operations (matching Python backend)
export interface UpsertUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

// Insert types for creating new records
export interface InsertWorkspace {
  name: string;
  description?: string;
  ownerId: string;
}

export interface InsertWorkspaceMember {
  workspaceId: string;
  userId: string;
  role?: string;
}

export interface InsertConversation {
  title?: string;
  workspaceId: string;
  userId: string;
  model?: string;
}

export interface InsertMessage {
  conversationId: string;
  content: string;
  role: string;
  model?: string;
}
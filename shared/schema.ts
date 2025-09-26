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

// Contact Management Types
export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  workspaceId: string;
  customFields?: Record<string, any>;
}

export interface CustomField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'date' | 'dropdown' | 'radio' | 'multiselect';
  options?: string[]; // For dropdown, radio, and multiselect types
  required: boolean;
  showInForm: boolean;
  readonly: boolean;
  workspaceId: string;
  createdAt: string;
}

export interface InsertContact {
  name: string;
  email: string;
  phone?: string;
  workspaceId: string;
  customFields?: Record<string, any>;
}

export interface ContactsResponse {
  contacts: Contact[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

// API Token Management Types
export interface ApiToken {
  id: string;
  token: string;
  name?: string;
  workspaceId: string;
  userId: string;
  cachingEnabled: boolean;
  isActive: boolean;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiUsageLog {
  id: string;
  tokenId: string;
  workspaceId: string;
  endpoint: string;
  model: string;
  method: string;
  statusCode: number;
  tokensUsed: number;
  responseTimeMs?: number;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface InsertApiToken {
  name?: string;
  workspaceId: string;
  userId: string;
  cachingEnabled?: boolean;
}

// API Token response with plaintext token (only shown once)
export interface ApiTokenResponse {
  id: string;
  plainToken: string; // Only returned during creation
  name?: string;
  workspaceId: string;
  userId: string;
  cachingEnabled: boolean;
  isActive: boolean;
  createdAt: string;
}

// API Usage Analytics
export interface UsageAnalytics {
  totalRequests: number;
  totalTokens: number;
  averageResponseTime: number;
  successRate: number;
  topModels: Array<{ model: string; requests: number }>;
  requestsOverTime: Array<{ date: string; requests: number }>;
}
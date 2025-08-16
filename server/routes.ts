import { Router } from "express";
import { storage } from "./storage";
import "./types";
import {
  insertUserSchema,
  insertWorkspaceSchema,
  insertWorkspaceMemberSchema,
  insertConversationSchema,
  insertMessageSchema,
} from "@shared/schema";

const router = Router();

// Auth routes
router.post("/auth/register", async (req, res) => {
  try {
    const userData = insertUserSchema.parse(req.body);
    const user = await storage.upsertUser({ ...userData, id: crypto.randomUUID() });
    
    req.session.userId = user.id;
    res.json({ user });
  } catch (error) {
    res.status(400).json({ error: "Invalid user data" });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await storage.getUserByEmail(email);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    req.session.userId = user.id;
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    res.json({ message: "Logged out successfully" });
  });
});

router.get("/auth/me", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const user = await storage.getUserById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: "Failed to get user" });
  }
});

// Middleware to check authentication
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

// Workspace routes
router.get("/workspaces", requireAuth, async (req, res) => {
  try {
    const workspaces = await storage.getUserWorkspaces(req.session.userId!);
    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ error: "Failed to get workspaces" });
  }
});

router.post("/workspaces", requireAuth, async (req, res) => {
  try {
    const workspaceData = insertWorkspaceSchema.parse({
      ...req.body,
      ownerId: req.session.userId!,
    });
    
    const workspace = await storage.createWorkspace(workspaceData);
    
    // Add creator as owner member
    await storage.addWorkspaceMember({
      workspaceId: workspace.id,
      userId: req.session.userId!,
      role: "owner",
    });
    
    const workspaceWithMembers = await storage.getWorkspaceWithMembers(workspace.id);
    res.json(workspaceWithMembers);
  } catch (error) {
    res.status(400).json({ error: "Invalid workspace data" });
  }
});

router.get("/workspaces/:id", requireAuth, async (req, res) => {
  try {
    const workspace = await storage.getWorkspaceWithMembers(req.params.id);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }
    res.json(workspace);
  } catch (error) {
    res.status(500).json({ error: "Failed to get workspace" });
  }
});

// Conversation routes
router.get("/workspaces/:workspaceId/conversations", requireAuth, async (req, res) => {
  try {
    const conversations = await storage.getWorkspaceConversations(
      req.params.workspaceId,
      req.session.userId!
    );
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: "Failed to get conversations" });
  }
});

router.post("/workspaces/:workspaceId/conversations", requireAuth, async (req, res) => {
  try {
    const conversationData = insertConversationSchema.parse({
      ...req.body,
      workspaceId: req.params.workspaceId,
      userId: req.session.userId!,
    });
    
    const conversation = await storage.createConversation(conversationData);
    res.json(conversation);
  } catch (error) {
    res.status(400).json({ error: "Invalid conversation data" });
  }
});

router.get("/conversations/:id", requireAuth, async (req, res) => {
  try {
    const conversation = await storage.getConversationWithMessages(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: "Failed to get conversation" });
  }
});

// Message routes
router.post("/conversations/:conversationId/messages", requireAuth, async (req, res) => {
  try {
    const messageData = insertMessageSchema.parse({
      ...req.body,
      conversationId: req.params.conversationId,
    });
    
    const message = await storage.createMessage(messageData);
    res.json(message);
  } catch (error) {
    res.status(400).json({ error: "Invalid message data" });
  }
});

export const authRoutes = router;
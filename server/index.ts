import express from "express";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import { neon } from "@neondatabase/serverless";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import { authRoutes } from "./routes.js";

const app = express();
const server = createServer(app);

// WebSocket server for real-time features
const wss = new WebSocketServer({ server });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
const PgSession = ConnectPgSimple(session);
const pgPool = neon(process.env.DATABASE_URL!);

app.use(
  session({
    store: new PgSession({
      pool: pgPool as any,
      tableName: "session",
    }),
    secret: process.env.SESSION_SECRET || "dev-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

// API Routes
app.use("/api", authRoutes);

// WebSocket connection handling
wss.on("connection", (ws) => {
  console.log("New WebSocket connection");

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log("Received message:", data);
      
      // Echo message back (you can implement your own logic here)
      ws.send(JSON.stringify({ type: "echo", data }));
    } catch (error) {
      console.error("Invalid JSON message:", error);
    }
  });

  ws.on("close", () => {
    console.log("WebSocket connection closed");
  });
});

const PORT = parseInt(process.env.PORT || "5000", 10);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
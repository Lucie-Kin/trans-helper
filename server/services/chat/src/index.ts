import Fastify from "fastify";
import { Server } from "socket.io";
import { register, onWsConnect, onWsDisconnect, onWsMessage } from "./metrics.js";

import { authenticateSocket } from "./auth.js";
import { initDb } from "./db.js";
import {
  registerSocket,
  unregisterSocket,
  getAllUsers,
} from "./socketRegistry.js";
import { registerAllHandlers } from "./handlers/index.js";
import { syncUsersFromAuth } from "./services/authSync.js";

initDb();

const fastify = Fastify({ logger: true });

// Socket.IO
const io = new Server(fastify.server, {
  path: "/chat/socket.io",
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
});

io.use(authenticateSocket);

io.on("connection", (socket: any) => {
  onWsConnect();
  
  socket.onAny((event: string, ...args: unknown[]) => {
    onWsMessage("in", event, args);
  });

  const user = {
    id: socket.user.id,
    login: socket.user.login,
  };

  console.log("Connected: ", {
    id: user.id,
    login: user.login,
    socketId: socket.id,
  });
  
  registerSocket(user, socket.id);
  registerAllHandlers(io, socket);

  io.emit("users:online", getAllUsers());


  socket.on("disconnect", (reason: string) => {
    onWsDisconnect(reason);
    
    socket.onAnyOutgoing((event: string, ...args: unknown[]) => {
      onWsMessage("out", event, args);
    });

    console.log("Disconnected: ", {
      id: user.id,
      socketId: socket.id,
    });

    const wentOffline = unregisterSocket(user.id, socket.id);
    if (wentOffline) {
      io.emit("users:online", getAllUsers());
    }
  });
});

fastify.get("/chat/metrics", async (_req, reply) => {
  reply.header("Content-Type", register.contentType);
  return register.metrics();
});

await fastify.listen({ port: 3002, host: "0.0.0.0" });
console.log("Chat service running on 3002");

// start polling
setInterval(async () => {
  const hasNew = await syncUsersFromAuth();
  if (hasNew) {
    io.emit("user:new");
  }
}, 5000);
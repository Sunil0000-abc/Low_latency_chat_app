// src/sockets/socket.js
import { verifyToken } from "../utils/jwt.js";
import { sendToKafka } from "../services/producer.js";
import { ObjectId } from "mongodb";

const users = {};
export const getReceiverSocketId = (receiverId) => {
	return users[receiverId];
};

export function initSocket(io, db) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      socket.user = verifyToken(token);
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    // Determine the user's ID
    const userId = socket.user._id || socket.user.userId;
    users[userId] = socket.id;

    // Set user explicitly online
    if (db) {
      await db.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        { $set: { isOnline: true, updatedAt: new Date() } }
      );
      // Broadcast to others
      io.emit("user_presence", { userId, isOnline: true });
    }

    socket.on("send_message", async (msg) => {

      const serverReceivedAt = Date.now();

      const enreachedMsg = {
        ...msg,
        from:userId,
        clientSentAt: msg.clientSentAt,
        serverReceivedAt,
      }
      if (users[msg.to]) {
        io.to(users[msg.to]).emit("receive_message", enreachedMsg);
      }

      const kafkastart = Date.now();

      await sendToKafka({
        ...enreachedMsg,
        status: "sent",
        createdAt: new Date(),
        kafkaProducedAt: Date.now(),
      });

       const kafkaLatency = Date.now() - kafkastart;

      console.log("📨 Kafka Latency:", kafkaLatency, "ms");
    });

    

    socket.on("typing", (data) => {
      if (users[data.to]) {
        io.to(users[data.to]).emit("typing", { conversationId: data.conversationId, from: userId });
      }
    });

    socket.on("stop_typing", (data) => {
      if (users[data.to]) {
        io.to(users[data.to]).emit("stop_typing", { conversationId: data.conversationId, from: userId });
      }
    });

    socket.on("mark_delivered", async (data) => {
      if (db) {
        await db.collection("messages").updateMany(
          { conversationId: data.conversationId, to: userId, status: "sent" },
          { $set: { status: "delivered" } }
        );
        if (users[data.fromUserId]) {
          io.to(users[data.fromUserId]).emit("messages_delivered", { conversationId: data.conversationId });
        }
      }
    });

    socket.on("mark_seen", async (data) => {
      if (db) {
        await db.collection("messages").updateMany(
          { conversationId: data.conversationId, to: userId, status: { $ne: "seen" } },
          { $set: { status: "seen" } }
        );
        if (users[data.fromUserId]) {
          io.to(users[data.fromUserId]).emit("messages_seen", { conversationId: data.conversationId });
        }
      }
    });

    socket.on("disconnect", async () => {
      delete users[userId];
      if (db) {
        const lastSeen = new Date();
        await db.collection("users").updateOne(
          { _id: new ObjectId(userId) },
          { $set: { isOnline: false, lastSeen, updatedAt: new Date() } }
        );
        io.emit("user_presence", { userId, isOnline: false, lastSeen });
      }
    });
  });
}
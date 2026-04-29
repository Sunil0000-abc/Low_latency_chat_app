// src/server.js
import http from "http";
import { Server } from "socket.io";
import { createApp } from "./app.js";
import { connectDB } from "./config/db.js";
import { initSocket } from "./sockets/socket.js";
import { initProducer } from "./services/producer.js";
import { startConsumer } from "./services/consumer.js";
import 'dotenv/config';

async function start() {
  const db = await connectDB();
   
  await initProducer();
  startConsumer();

  const app = createApp(db);
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    }
  }); 

  initSocket(io, db);

  server.listen(process.env.PORT, () => {
    console.log("Server running");
  });
}

start();
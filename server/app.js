// src/app.js
import express from "express";
import "dotenv/config";
import cors from "cors";
import authRoutes from "./routes/authroutes.js";
import userRoutes from "./routes/userroutes.js";
import conversationRoutes from "./routes/conversationroute.js";
import s3urlrouter from './routes/s3urlrouter.js'

export function createApp(db) {
  const app = express();
  app.use(cors({
    origin: "http:/3.7.58.95:5173",
    credentials: true
  }));  
  app.use(express.json());

  app.get("/health",(req,res)=>{
    res.send("Server is running");
  })

  app.use("/api/auth", authRoutes(db));
  app.use("/api/user", userRoutes(db));
  app.use("/api/conversations", conversationRoutes(db));
  app.use("/api/files",s3urlrouter)

  return app;
}

import express from "express";
import conversationController from "../controllers/conversationcontroller.js";
import { auth } from "../middleware/authmiddleware.js";

const router = express.Router();

export default (db) => {
  const controller = conversationController(db);

  router.post("/", auth, controller.createOrGet);
  router.get("/user", auth, controller.getUserConversations);
  router.get("/:id/messages", auth, controller.getMessages);
  router.delete("/:conversationId",auth,controller.deleteConversation)

  return router;
};
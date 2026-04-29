import express from "express";
import userController from "../controllers/usercontrollers.js";
import { auth } from "../middleware/authmiddleware.js";

const router = express.Router();

export default (db) => {
  const controller = userController(db);

  router.get("/search", auth, controller.searchUsers);

  return router;
};
import express from "express";
import authController from "../controllers/authcontroller.js";

const router = express.Router();

export default (db) => {
  const controller = authController(db);

  router.post("/signup", controller.signup);
  router.post("/login", controller.login);

  return router;
};

// src/controllers/auth.controller.js
import bcrypt from "bcrypt";
import { generateToken } from "../utils/jwt.js";

export default (db) => ({
  signup: async (req, res) => {
    try {
      const { username, password, avatar } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Missing fields" });
      }

      // Explicitly check if the user already exists
      const existingUser = await db.collection("users").findOne({ username });
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const hash = await bcrypt.hash(password, 10);
      const result = await db.collection("users").insertOne({
        username,
        password: hash,
        avatar: avatar || "",
        isOnline: false,
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const token = generateToken({ _id: result.insertedId, username });
      res.json({ token, user: { _id: result.insertedId, username } });
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  login: async (req, res) => {
    const { username, password } = req.body;

    const user = await db.collection("users").findOne({ username });
    if (!user) return res.status(400).json({ error: "User not found" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: "Invalid password" });

    const token = generateToken(user);
    res.json({ token, user: { _id: user._id, username: user.username, avatar: user.avatar } });
  },
});
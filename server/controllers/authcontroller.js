// src/controllers/auth.controller.js
import bcrypt from "bcrypt";
import { generateToken } from "../utils/jwt.js";

export default (db) => ({
  signup: async (req, res) => {
    try {
      const { email, name, password, avatar } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ error: "Missing fields" });
      }

      // Explicitly check if the user already exists
      const existingUser = await db.collection("users").findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "Email already exists" });
      }

      const hash = await bcrypt.hash(password, 10);
      const result = await db.collection("users").insertOne({
        username: name,
        email,
        password: hash,
        avatar: avatar || "",
        isOnline: false,
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const token = generateToken({ _id: result.insertedId, username: name });
      res.json({ token, user: { _id: result.insertedId, username: name, email } });
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      let user = await db.collection("users").findOne({ $or: [{ email }, { username: email }] });

      if (!user) {
        // Auto-signup logic
        const hash = await bcrypt.hash(password, 10);
        const result = await db.collection("users").insertOne({
          username: email, // Temporary username, will be updated in next step
          email,
          password: hash,
          avatar: "",
          isOnline: false,
          lastSeen: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        });

        const newUser = { _id: result.insertedId, username: email, email };
        const token = generateToken(newUser);
        return res.json({ 
          token, 
          user: newUser, 
          isNewUser: true 
        });
      }

      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(400).json({ error: "Invalid password" });

      const token = generateToken(user);
      res.json({ 
        token, 
        user: { _id: user._id, username: user.username, email: user.email, avatar: user.avatar }, 
        isNewUser: false 
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
});
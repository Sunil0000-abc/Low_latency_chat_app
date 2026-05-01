import { ObjectId } from "mongodb";
import { generateToken } from "../utils/jwt.js";

export default (db) => ({
  searchUsers: async (req, res) => {
    const { q } = req.query;

    const users = await db.collection("users")
      .find({
        username: { $regex: q, $options: "i" }
      }, {
        projection: { username: 1, avatar: 1, isOnline: 1, lastSeen: 1 }
      })
      .limit(10)
      .toArray();

    res.json(users);
  },

  updateProfile: async (req, res) => {
    try {
      const { username ,avatar  } = req.body;
      if (!username) {
        return res.status(400).json({ error: "Username is required" });
      }

      const userId = req.user._id;

      const updateFields = {};

     if (username) updateFields.username = username;
     if (avatar) updateFields.avatar = avatar;

     updateFields.updatedAt = new Date();


      await db.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        { 
          $set:updateFields
        } 
      );

      const updatedUser = await db.collection("users").findOne({ _id: new ObjectId(userId) });
      const token = generateToken(updatedUser);

      res.json({ success: true, token, user: updatedUser });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  }
});
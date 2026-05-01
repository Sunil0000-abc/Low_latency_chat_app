import { ObjectId } from "mongodb";

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
      const { username } = req.body;
      if (!username) {
        return res.status(400).json({ error: "Username is required" });
      }

      const userId = req.user._id;
      await db.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        { 
          $set: { 
            username,
            updatedAt: new Date()
          } 
        }
      );

      res.json({ success: true, username });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  }
});
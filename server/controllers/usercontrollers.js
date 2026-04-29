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
  }
});
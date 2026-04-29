import { ObjectId } from "mongodb";
import { getReceiverSocketId } from "../sockets/socket.js";

export default (db) => ({
  createOrGet: async (req, res) => {
    const userA = req.user._id || req.user.userId;
    const { userB } = req.body;

    let convo = await db.collection("conversations").findOne({
      participants: { $all: [userA, userB] }
    });

    if (!convo) {
      const result = await db.collection("conversations").insertOne({
        participants: [userA, userB],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      convo = {
        _id: result.insertedId,
        participants: [userA, userB]
      };
    }

    res.json(convo);
  },

  getUserConversations: async (req, res) => {
      try {
    const userId = req.user._id || req.user.userId;

    const limit = parseInt(req.query.limit) || 10;
    const skip = parseInt(req.query.skip) || 0;

    // 1️⃣ Get conversations (paginated)
    const conversations = await db.collection("conversations")
      .find({ participants: userId })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    if (conversations.length === 0) {
      return res.json([]);
    }

    const convoIds = conversations.map(c => c._id.toString());

    // 2️⃣ Get other users (ONE query)
    const otherUserIds = conversations.map(c =>
      c.participants.find(p => p !== userId)
    );

    const users = await db.collection("users")
      .find(
        { _id: { $in: otherUserIds.map(id => new ObjectId(id)) } },
        { projection: { username: 1, avatar: 1, isOnline: 1, lastSeen: 1 } }
      )
      .toArray();

    const userMap = {};
    users.forEach(u => {
      userMap[u._id.toString()] = u;
    });

    // 3️⃣ Aggregation: last message + unread count
    const messageStats = await db.collection("messages").aggregate([
      {
        $match: {
          conversationId: { $in: convoIds }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: "$conversationId",
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$to", userId] },
                    { $in: ["$status", ["sent", "delivered"]] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]).toArray();

    const statsMap = {};
    messageStats.forEach(s => {
      statsMap[s._id] = s;
    });

    // 4️⃣ Merge everything
    const result = conversations.map(c => {
      const otherId = c.participants.find(p => p !== userId);

      return {
        ...c,
        otherUser: userMap[otherId],
        lastMessage: statsMap[c._id.toString()]?.lastMessage || null,
        unreadCount: statsMap[c._id.toString()]?.unreadCount || 0
      };
    });

    res.json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
  },

  getMessages: async (req, res) => {
    try {
      const { id } = req.params;
      const messages = await db.collection("messages")
        .find({ conversationId: id })
        .sort({ createdAt: 1 })
        .toArray();
      
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  },
  
  deleteConversation: async (req,res)=>{
    try {
      const convoId = req.params.conversationId;
      const userId = req.user._id || req.user.userId;

      const convo = await db.collection("conversations").findOne({
        _id: new ObjectId(convoId),
        participants: userId
      });

      if (!convo) {
      return res.status(403).json({ error: "Not allowed" });
    }

    await db.collection("messages").deleteMany({
      conversationId: convoId
    })
      
    await db.collection("conversations").deleteOne({
      _id: new ObjectId(convoId)
    })

    res.json({ message: "Conversation deleted" });

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  },

  deleteMessage: async (req,res) =>{
      try {
        const messageId = req.params.messageId;
        const userId = req.user._id || req.user.userId;

        const message = await db.collection("messages").findOne({
          _id: new ObjectId(messageId)
        });

        if(!message) return res.status(404).json({error:"message not found"});

        if(message.from !== userId){
          return res.status(403).json({ error: "Not allowed" });
        }

        await db.collection("messages").deleteOne({
          _id: new ObjectId(messageId)
        });
        
        const receiverSocketId = getReceiverSocketId(message.to);
        if (receiverSocketId) {
          req.app.get("io").to(receiverSocketId).emit("messageDeleted",{
            messageId,
            conversationId: message.conversationId
          });
        }
        res.json({message:"Message deleted"})
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete message" });
      }
  }
});
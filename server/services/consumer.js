import { kafka } from "../config/kafka.js";
import { connectDB } from "../config/db.js";

export async function startConsumer() {
  const db = await connectDB();
  const consumer = kafka.consumer({ groupId: "chat-group" });

  await consumer.connect();
  await consumer.subscribe({ topic: "messages" });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const data = JSON.parse(message.value.toString());

      //  Store message
      const dbStart = Date.now();
      await db.collection("messages").insertOne({
        ...data,
        createdAt: new Date(data.createdAt),
      });

      const dbLatency = Date.now() - dbStart;


      console.log("🗄️ DB Latency:", dbLatency, "ms");

      //  UPDATE CONVERSATION HERE (THIS IS YOUR CODE)
      await db.collection("conversations").updateOne(
        { _id: data.conversationId },
        {
          $set: {
            lastMessage: data.text,
            updatedAt: new Date(),
          },
        }
      );

      console.log("✅ Message + Conversation updated");
    },
  });
}
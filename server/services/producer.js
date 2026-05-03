
import { kafka } from "../config/kafka.js";

const producer = kafka.producer();

export async function initProducer() {
  await producer.connect();
}

export async function sendToKafka(msg) {
  await producer.send({
    topic: "messages",
    messages: [
      {
        key: msg.conversationId,
        value: JSON.stringify(msg),
      },
    ],
  });
}
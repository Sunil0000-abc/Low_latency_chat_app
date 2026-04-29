import {Kafka} from 'kafkajs'
import 'dotenv/config'



export const kafka = new Kafka({
    clientId:"chat-app",
    brokers:[process.env.KAFKA_BROKER]
});
import { Queue } from "bullmq";
import { redisConnection } from "../redis.connection";

export const cleanupQueue = new Queue("cleanup", {
  connection: redisConnection,
});
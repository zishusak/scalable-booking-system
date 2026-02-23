import { Worker } from "bullmq";
import { redisConnection } from "../redis.connection";
import { prisma } from "../prisma";

export const cleanupWorker = new Worker(
  "cleanup",
  async () => {
    const result = await prisma.idempotencyKey.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    return { deleted: result.count };
  },
  {
    connection: redisConnection,
  }
);

cleanupWorker.on("completed", (job, result) => {
  console.log(`[cleanup] job=${job.id} deleted=${result.deleted}`);
});

cleanupWorker.on("failed", (job, err) => {
  console.error(`[cleanup] job=${job?.id} failed`, err);
});
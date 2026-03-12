import { defineScript } from "rwsdk/worker";
import { db, setupDb } from "@/db";
import bcrypt from "bcryptjs";

export default defineScript(async ({ env }) => {
  setupDb(env);

  const hashedPassword = await bcrypt.hash("password123", 10);

  await db.$executeRawUnsafe(`\
    DELETE FROM User;
    DELETE FROM sqlite_sequence;
  `);

  await db.user.create({
    data: {
      id: "1",
      username: "testuser",
      password: hashedPassword,
      email: "testuser@example.com",
      verified: true,
    },
  });

  console.log("🌱 Finished seeding");
});

import { defineScript } from "rwsdk/worker";
import { db, setupDb } from "@/db";
import bcrypt from "bcryptjs";

export default defineScript(async ({ env }) => {
  setupDb(env);

  const hashedPassword = await bcrypt.hash("password123", 10);

  // Clean existing data
  await db.auditLog.deleteMany();
  await db.user.deleteMany();

  // Create admin user
  await db.user.create({
    data: {
      id: crypto.randomUUID(),
      username: "adminuser",
      password: hashedPassword,
      email: "admin@example.com",
      verified: true,
      role: "ADMIN",
    },
  });

  // Create regular user
  await db.user.create({
    data: {
      id: crypto.randomUUID(),
      username: "testuser",
      password: hashedPassword,
      email: "testuser@example.com",
      verified: true,
      role: "USER",
    },
  });

  console.log("Seeded: 2 users (adminuser / testuser), password: password123");
});

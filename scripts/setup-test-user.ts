import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function setupTestUser() {
  console.log("Setting up test user...\n");

  // Test user credentials
  const testEmail = "omsable55426@gmail.com";
  const testPassword = "orgobloom2025";
  const testName = "Admin User";

  try {
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: { email: testEmail },
    });

    if (existingUser) {
      console.log("✅ Test user already exists!");
      console.log(`Email: ${existingUser.email}`);
      console.log(`Password: ${testPassword}`);
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(testPassword, 12);

    // Create new user with email/password
    const newUser = await prisma.user.create({
      data: {
        email: testEmail,
        name: testName,
        password: hashedPassword,
        provider: "email",
        emailVerified: new Date(),
        role: "ADMIN",
      },
    });

    console.log("✅ Test user created successfully!");
    console.log("\nLogin Credentials:");
    console.log("─".repeat(40));
    console.log(`Email:    ${testEmail}`);
    console.log(`Password: ${testPassword}`);
    console.log("─".repeat(40));
    console.log("\nYou can now log in with these credentials.");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error setting up test user:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupTestUser();

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function createAdminUser() {
  try {
    const adminEmail = "omsable5426@gmail.com";
    const adminPassword = "orgobloom2025";

    console.log("Creating admin user...");
    console.log("Email:", adminEmail);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingUser) {
      console.log("User already exists. Updating to admin...");
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          role: "ADMIN",
          password: await bcrypt.hash(adminPassword, 12),
        },
      });
      console.log("✅ User updated to admin successfully!");
      console.log(`Email: ${updatedUser.email}`);
      console.log(`Role: ${updatedUser.role}`);
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Create new admin user
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Admin",
        password: hashedPassword,
        role: "ADMIN",
        provider: "CREDENTIALS",
        emailVerified: new Date(),
      },
    });

    console.log("✅ Admin user created successfully!");
    console.log(`Email: ${adminUser.email}`);
    console.log(`Name: ${adminUser.name}`);
    console.log(`Role: ${adminUser.role}`);
    console.log(`Provider: ${adminUser.provider}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    process.exit(1);
  }
}

createAdminUser();

import { prisma } from "@/lib/prisma";

/**
 * Create admin user via Google OAuth
 * This script is provided for reference only.
 *
 * To create an admin user:
 * 1. Sign in with Google on /login
 * 2. Run this script with your Google email to make them admin
 */
async function createAdminUser() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "omsable5426@gmail.com";

    console.log("Looking for user with email:", adminEmail);

    // Find existing user
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!existingUser) {
      console.error(
        "❌ User not found. Please sign in with Google first at /login",
      );
      process.exit(1);
    }

    // Update user role to ADMIN
    const adminUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: { role: "ADMIN" },
    });

    console.log("✅ User promoted to admin successfully!");
    console.log(`Email: ${adminUser.email}`);
    console.log(`Name: ${adminUser.name}`);
    console.log(`Role: ${adminUser.role}`);
    console.log(`Provider: ${adminUser.provider}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error updating user:", error);
    process.exit(1);
  }
}

createAdminUser();

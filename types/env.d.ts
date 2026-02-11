declare namespace NodeJS {
  interface ProcessEnv {
    // Database
    DATABASE_URL: string;
    DIRECT_URL: string;

    // OAuth - Google
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    NEXTAUTH_SECRET: string;
    NEXTAUTH_URL: string;

    // Legacy JWT (if still used)
    JWT_SECRET?: string;
    JWT_EXPIRES_IN?: string;

    // Payment
    RAZORPAY_KEY_ID: string;
    RAZORPAY_KEY_SECRET: string;
    NEXT_PUBLIC_RAZORPAY_KEY_ID: string;

    // Email
    SMTP_HOST: string;
    SMTP_PORT: string;
    SMTP_USER: string;
    SMTP_PASSWORD: string;
    SMTP_FROM: string;
    SMTP_FROM_NAME: string;

    // App
    NEXT_PUBLIC_APP_URL: string;
    PORT?: string;
    NODE_ENV?: "development" | "production" | "test";

    // Admin (for initialization)
    ADMIN_EMAIL?: string;
    ADMIN_PASSWORD?: string;
  }
}

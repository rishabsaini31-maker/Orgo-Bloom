declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    RAZORPAY_KEY_ID: string;
    RAZORPAY_KEY_SECRET: string;
    NEXT_PUBLIC_APP_URL: string;
    NEXT_PUBLIC_RAZORPAY_KEY_ID: string;
    ADMIN_EMAIL: string;
    ADMIN_PASSWORD: string;
  }
}

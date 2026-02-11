import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { AuthSessionProvider } from "@/components/SessionProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Orgobloom - Organic Fertilizers",
  description:
    "Premium organic cow manure fertilizers for healthy gardens and farms",
  keywords:
    "organic fertilizer, cow manure, organic farming, natural fertilizer",
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthSessionProvider>
          {children}
          <Toaster position="top-right" />
        </AuthSessionProvider>
      </body>
    </html>
  );
}

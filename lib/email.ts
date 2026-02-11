import nodemailer from "nodemailer";

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Orgobloom" <noreply@orgobloom.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    return true;
  } catch (error) {
    console.error("Email sending failed:", error);
    return false;
  }
}

// Email templates
export function generateVerificationEmail(
  name: string,
  verificationLink: string,
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 30px; text-align: center; }
        .content { background: #f9fafb; padding: 30px; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Orgobloom!</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          <p>Thank you for registering with Orgobloom - your trusted source for organic fertilizers.</p>
          <p>Please verify your email address by clicking the button below:</p>
          <p style="text-align: center;">
            <a href="${verificationLink}" class="button">Verify Email Address</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationLink}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Orgobloom. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generatePasswordResetEmail(
  name: string,
  resetLink: string,
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ef4444; color: white; padding: 30px; text-align: center; }
        .content { background: #f9fafb; padding: 30px; }
        .button { display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          <p>We received a request to reset your password for your Orgobloom account.</p>
          <p>Click the button below to reset your password:</p>
          <p style="text-align: center;">
            <a href="${resetLink}" class="button">Reset Password</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetLink}</p>
          <p>This link will expire in 1 hour.</p>
          <p><strong>If you didn't request a password reset, please ignore this email or contact support if you're concerned.</strong></p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Orgobloom. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateOrderConfirmationEmail(
  name: string,
  orderNumber: string,
  total: number,
  items: any[],
): string {
  const itemsList = items
    .map(
      (item) =>
        `<li>${item.product.name} (${item.weight}) x ${item.quantity} - ₹${(item.price * item.quantity).toFixed(2)}</li>`,
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 30px; text-align: center; }
        .content { background: #f9fafb; padding: 30px; }
        .order-details { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmed!</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          <p>Thank you for your order! We're processing it now.</p>
          <div class="order-details">
            <h3>Order #${orderNumber}</h3>
            <ul>${itemsList}</ul>
            <p><strong>Total: ₹${total.toFixed(2)}</strong></p>
          </div>
          <p>You'll receive another email when your order ships.</p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Orgobloom. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateOrderStatusEmail(
  name: string,
  orderNumber: string,
  status: string,
  trackingNumber?: string,
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 30px; text-align: center; }
        .content { background: #f9fafb; padding: 30px; }
        .status { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; text-align: center; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Update</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          <p>Your order #${orderNumber} has been updated.</p>
          <div class="status">
            <h3>Status: ${status}</h3>
            ${trackingNumber ? `<p>Tracking Number: <strong>${trackingNumber}</strong></p>` : ""}
          </div>
        </div>
        <div class="footer">
          <p>&copy; 2026 Orgobloom. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

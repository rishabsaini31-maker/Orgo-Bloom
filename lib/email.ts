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

export function generateShippingNotificationEmail(
  name: string,
  orderNumber: string,
  trackingNumber: string,
  estimatedDelivery: string,
  courierName?: string,
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px; text-align: center; }
        .content { background: #f9fafb; padding: 30px; }
        .shipping-info { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #10b981; }
        .tracking { font-size: 16px; font-weight: bold; color: #10b981; font-family: monospace; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📦 Your Order is on the Way!</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          <p>Great news! Your order has been shipped and is on its way to you.</p>
          
          <div class="shipping-info">
            <h3>Shipment Details</h3>
            <p><strong>Order Number:</strong> #${orderNumber}</p>
            <p><strong>Tracking Number:</strong> <span class="tracking">${trackingNumber}</span></p>
            ${courierName ? `<p><strong>Courier:</strong> ${courierName}</p>` : ""}
            <p><strong>Estimated Delivery:</strong> ${estimatedDelivery}</p>
          </div>

          <p>You can track your order using the tracking number above on the courier's website or in your account dashboard.</p>
          
          <p style="text-align: center;">
            <a href="https://orgobloom.com/dashboard/orders" class="button">Track Order</a>
          </p>

          <p><strong>Need help?</strong> Contact us if you have any questions about your shipment.</p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Orgobloom. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateRefundConfirmationEmail(
  name: string,
  orderNumber: string,
  refundAmount: number,
  refundReason: string,
  status: string,
): string {
  const statusColor =
    {
      APPROVED: "#10b981",
      REJECTED: "#ef4444",
      COMPLETED: "#06b6d4",
      PENDING: "#f59e0b",
    }[status] || "#6b7280";

  const statusMessage =
    {
      APPROVED:
        "Your refund has been approved and will be processed within 5-7 business days.",
      REJECTED:
        "Your refund request has been reviewed and unfortunately, it does not meet our return policy. Please contact support for more information.",
      COMPLETED:
        "Your refund has been completed. The amount should appear in your bank account shortly.",
      PENDING:
        "Your refund request is being reviewed. We will update you shortly.",
    }[status] || "Your refund request is being processed.";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 40px; text-align: center; }
        .content { background: #f9fafb; padding: 30px; }
        .refund-info { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid ${statusColor}; }
        .refund-amount { font-size: 28px; font-weight: bold; color: ${statusColor}; margin: 10px 0; }
        .status-badge { display: inline-block; background: ${statusColor}; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Refund Status Update</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          
          <div class="refund-info">
            <h3>Refund Details</h3>
            <p><strong>Order Number:</strong> #${orderNumber}</p>
            <p><strong>Refund Amount:</strong> <span class="refund-amount">₹${refundAmount.toFixed(2)}</span></p>
            <p><strong>Reason:</strong> ${refundReason}</p>
            <p><span class="status-badge">${status}</span></p>
          </div>

          <p>${statusMessage}</p>

          <p>If you have any questions or need further assistance, please don't hesitate to reach out to our support team.</p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Orgobloom. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateReturnRequestReceivedEmail(
  name: string,
  orderNumber: string,
  reason: string,
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 40px; text-align: center; }
        .content { background: #f9fafb; padding: 30px; }
        .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #f59e0b; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Return Request Received</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          <p>Thank you for submitting your return request. We have received it and will review it shortly.</p>
          
          <div class="info-box">
            <h3>Return Details</h3>
            <p><strong>Order Number:</strong> #${orderNumber}</p>
            <p><strong>Return Reason:</strong> ${reason}</p>
            <p><strong>Status:</strong> Under Review</p>
            <p><strong>Next Steps:</strong> Our team will review your return request within 24-48 hours and send you an update with further instructions.</p>
          </div>

          <p><strong>What to expect:</strong></p>
          <ul>
            <li>We'll verify your return request</li>
            <li>Provide return shipping instructions if approved</li>
            <li>Process your refund once item is received</li>
          </ul>

          <p>If you have any questions, please contact our customer support team.</p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Orgobloom. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

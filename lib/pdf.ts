import PDFDocument from "pdfkit";
import { formatPrice, formatDate } from "./utils";

interface InvoiceData {
  order: any;
  user: any;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      // Header
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("ORGOBLOOM", 50, 50)
        .fontSize(10)
        .font("Helvetica")
        .text("Organic Fertilizers", 50, 75)
        .text("www.orgobloom.com", 50, 90)
        .moveDown();

      // Invoice Title
      doc
        .fontSize(24)
        .font("Helvetica-Bold")
        .text("INVOICE", 400, 50, { align: "right" });

      // Order Details
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Order Number: ${data.order.orderNumber}`, 400, 80, {
          align: "right",
        })
        .text(`Date: ${formatDate(data.order.createdAt)}`, 400, 95, {
          align: "right",
        })
        .text(`Status: ${data.order.status}`, 400, 110, { align: "right" });

      doc.moveDown(2);

      // Bill To Section
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Bill To:", 50, 150)
        .fontSize(10)
        .font("Helvetica")
        .text(data.user.name, 50, 170)
        .text(data.user.email, 50, 185);

      // Shipping Address
      const address = data.order.shippingAddress;
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Ship To:", 300, 150)
        .fontSize(10)
        .font("Helvetica")
        .text(address.fullName, 300, 170)
        .text(address.addressLine1, 300, 185)
        .text(`${address.city}, ${address.state} ${address.pincode}`, 300, 200)
        .text(address.phone, 300, 215);

      doc.moveDown(3);

      // Table Header
      const tableTop = 280;
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Item", 50, tableTop)
        .text("Quantity", 250, tableTop, { width: 70, align: "center" })
        .text("Price", 350, tableTop, { width: 80, align: "right" })
        .text("Total", 460, tableTop, { width: 80, align: "right" });

      // Draw line
      doc
        .moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();

      // Table Items
      let y = tableTop + 25;
      data.order.items.forEach((item: any) => {
        const itemTotal = item.price * item.quantity;

        doc
          .fontSize(9)
          .font("Helvetica")
          .text(`${item.product.name} (${item.weight})`, 50, y, { width: 180 })
          .text(item.quantity.toString(), 250, y, {
            width: 70,
            align: "center",
          })
          .text(formatPrice(item.price), 350, y, { width: 80, align: "right" })
          .text(formatPrice(itemTotal), 460, y, { width: 80, align: "right" });

        y += 25;
      });

      // Draw line before totals
      y += 10;
      doc.moveTo(350, y).lineTo(550, y).stroke();

      // Totals
      y += 15;
      doc
        .fontSize(10)
        .font("Helvetica")
        .text("Subtotal:", 350, y)
        .text(formatPrice(data.order.subtotal), 460, y, {
          width: 80,
          align: "right",
        });

      y += 20;
      doc
        .text("Shipping:", 350, y)
        .text(formatPrice(data.order.shippingCost), 460, y, {
          width: 80,
          align: "right",
        });

      y += 20;
      doc.text("Tax:", 350, y).text(formatPrice(data.order.tax), 460, y, {
        width: 80,
        align: "right",
      });

      // Draw line before grand total
      y += 10;
      doc.moveTo(350, y).lineTo(550, y).stroke();

      // Grand Total
      y += 15;
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Total:", 350, y)
        .text(formatPrice(data.order.total), 460, y, {
          width: 80,
          align: "right",
        });

      // Footer
      doc
        .fontSize(8)
        .font("Helvetica")
        .text("Thank you for your business!", 50, doc.page.height - 80, {
          align: "center",
          width: 500,
        })
        .text(
          "For any queries, contact us at support@orgobloom.com",
          50,
          doc.page.height - 65,
          { align: "center", width: 500 },
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

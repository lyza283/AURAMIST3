const nodemailer = require("nodemailer");
const puppeteer = require('puppeteer');

const sendEmail = async ({ email, subject, message, attachPdf = false, pdfFilename = 'Receipt.pdf' }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: '"AURAMIST PERFUME" <noreply@auramist.com>',
      to: email,
      subject: subject,
      html: message
    };

    if (attachPdf) {
      const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();
      await page.setContent(message, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({ format: 'A4', margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' } });
      await browser.close();

      mailOptions.attachments = [{
        filename: pdfFilename,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }];
    }

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

module.exports = sendEmail;
// send-email.js
// ================= Secure contact form handler =================

const fetch = require("node-fetch"); // for reCAPTCHA verification
const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY); // Your SendGrid API key stored securely in Netlify env

exports.handler = async (event) => {
  try {
    // Only allow POST requests
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { name, email, subject, message, recaptchaToken } = JSON.parse(event.body);

    // ================= Verify reCAPTCHA =================
    const secret = process.env.RECAPTCHA_SECRET; // Hidden secret in Netlify env
    const recaptchaRes = await fetch(
      `https://www.google.com/recaptcha/api/siteverify`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${secret}&response=${recaptchaToken}`,
      }
    );

    const recaptchaJson = await recaptchaRes.json();
    if (!recaptchaJson.success || recaptchaJson.score < 0.5) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: "Failed reCAPTCHA check" }),
      };
    }

    // ================= Send Email via SendGrid =================
    const msg = {
      to: "YOUR_EMAIL@gmail.com", // Your email to receive messages
      from: "noreply@fincop.com", // Must be verified sender in SendGrid
      subject: subject || "New Contact Form Message",
      text: `Name: ${name}\nEmail: ${email}\nMessage:\n${message}`,
    };

    await sgMail.send(msg);

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: "Server error" }),
    };
  }
};

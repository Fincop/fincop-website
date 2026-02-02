import fetch from "node-fetch";
import sgMail from "@sendgrid/mail";

const fetch = require('node-fetch'); // make sure node-fetch is installed
const sgMail = require('@sendgrid/mail');

// ================= SECRET KEYS =================
// reCAPTCHA secret key comes from Netlify environment variable
const secretKey = process.env.RECAPTCHA_SECRET_KEY;

// SendGrid API key comes from Netlify environment variable
sgMail.setApiKey(process.env.SENDGRID_API_KEY);


export async function handler(event, context) {
  try {
    const { name, email, subject, message, recaptchaToken } = JSON.parse(event.body);

    // Verify reCAPTCHA
    const recaptchaRes = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`
    });

    const recaptchaData = await recaptchaRes.json();
    if(!recaptchaData.success || recaptchaData.score < 0.5) {
      return { statusCode: 400, body: JSON.stringify({ ok:false, error: "Failed reCAPTCHA verification" }) };
    }

    // Send email
    const msg = {
      to: "pjpatrician@gmail.com",
      from: "jrxerx@gmail.com",
      subject: subject || "New Quote Request",
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
    };

    await sgMail.send(msg);
    return { statusCode: 200, body: JSON.stringify({ ok:true }) };

  } catch(err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ ok:false, error: err.message }) };
  }
}

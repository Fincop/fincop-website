import sgMail from "@sendgrid/mail";

/**
 * SendGrid API key
 * MUST be added in Netlify Dashboard → Environment Variables
 * Key name: SENDGRID_API_KEY
 */
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function handler(event) {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ ok: false, error: "Method Not Allowed" }),
    };
  }

  try {
    // Parse incoming form data
    const data = JSON.parse(event.body);

    /**
     * Google reCAPTCHA secret key
     * MUST be added in Netlify Dashboard → Environment Variables
     * Key name: RECAPTCHA_SECRET_KEY
     */
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    // =============================
    // Verify Google reCAPTCHA v3
    // =============================
    const recaptchaResponse = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `secret=${secretKey}&response=${data.recaptchaToken}`,
      }
    );

    const recaptchaResult = await recaptchaResponse.json();

    if (!recaptchaResult.success || recaptchaResult.score < 0.5) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          ok: false,
          error: "Failed reCAPTCHA verification",
        }),
      };
    }

    // =============================
    // Send email via SendGrid
    // =============================
    const msg = {
      to: "jrxerx@gmail.com",              // ✅ your email (receiver)
      from: "no-reply@fincop.co.za",       // ✅ verified sender domain
      subject: data.subject || "New Contact Form Submission",
      text: `
Name: ${data.name}
Email: ${data.email}

Message:
${data.message}
      `,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Message:</strong></p>
        <p>${data.message}</p>
      `,
    };

    await sgMail.send(msg);

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };

  } catch (error) {
    console.error("Send email error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: "Internal Server Error",
      }),
    };
  }
}

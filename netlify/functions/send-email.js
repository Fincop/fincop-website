import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const data = JSON.parse(event.body);

    // Verify reCAPTCHA
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const recaptchaRes = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: secretKey,
          response: data.recaptchaToken
        })
      }
    );

    const recaptchaJson = await recaptchaRes.json();

    if (!recaptchaJson.success || recaptchaJson.score < 0.5) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: "Failed reCAPTCHA verification" })
      };
    }

    // Send email
    await sgMail.send({
      to: "jrxerx@gmail.com",
      from: "no-reply@fincop.co.za",
      subject: data.subject || "New Contact Form Submission",
      text: `Name: ${data.name}\nEmail: ${data.email}\nMessage: ${data.message}`,
      html: `
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Message:</strong> ${data.message}</p>
      `
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true })
    };

  } catch (err) {
    console.error("Function error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: "Server error" })
    };
  }
}

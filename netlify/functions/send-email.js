import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function handler(event, context) {
  try {
    const data = JSON.parse(event.body);
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    // Verify reCAPTCHA
    const recaptchaRes = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${data.recaptchaToken}`,
      { method: "POST" }
    );
    const recaptchaJson = await recaptchaRes.json();
    if (!recaptchaJson.success || recaptchaJson.score < 0.5) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: "Failed reCAPTCHA verification" }) };
    }

    // Send email
    const msg = {
      to: "jrxerx@gmail.com",       // <-- Replace with your email
      from: "no-reply@fincop.co.za",      // Leave as is
      subject: data.subject || "New Contact Form Submission",
      text: `Name: ${data.name}\nEmail: ${data.email}\nMessage: ${data.message}`,
      html: `<p><strong>Name:</strong> ${data.name}</p>
             <p><strong>Email:</strong> ${data.email}</p>
             <p><strong>Message:</strong> ${data.message}</p>`
    };

    await sgMail.send(msg);

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: err.message }) };
  }
}

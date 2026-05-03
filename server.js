require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Nodemailer transporter ───────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendDownloadEmail(toEmail, toName) {
  const downloadUrl = process.env.EBOOK_DOWNLOAD_URL;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: "🎉 Il tuo ebook Patente Facile è pronto!",
    html: `
      <!DOCTYPE html>
      <html lang="it">
      <head>
        <meta charset="UTF-8"/>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
          .wrapper { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #0A0E1A 0%, #1a2744 100%); padding: 40px 30px; text-align: center; }
          .header h1 { color: #F5C518; margin: 0; font-size: 26px; letter-spacing: -0.5px; }
          .header p { color: rgba(255,255,255,0.7); margin: 8px 0 0; font-size: 14px; }
          .body { padding: 40px 30px; }
          .body h2 { color: #0A0E1A; font-size: 22px; margin-top: 0; }
          .body p { color: #555; line-height: 1.7; }
          .btn { display: inline-block; background: #F5C518; color: #0A0E1A; font-weight: 700; font-size: 16px; padding: 16px 36px; border-radius: 8px; text-decoration: none; margin: 20px 0; }
          .note { background: #f8f9fa; border-left: 4px solid #F5C518; padding: 16px 20px; border-radius: 4px; margin: 24px 0; }
          .note p { margin: 0; color: #555; font-size: 14px; }
          .footer { background: #f4f4f4; padding: 24px 30px; text-align: center; }
          .footer p { color: #999; font-size: 12px; margin: 0; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="header">
            <h1>🚗 Patente Facile</h1>
            <p>Grazie per il tuo acquisto!</p>
          </div>
          <div class="body">
            <h2>Ciao ${toName || ""}! Il tuo ebook ti aspetta 👇</h2>
            <p>Ottima scelta! Hai appena fatto il primo passo per passare l'esame della patente <strong>al primo tentativo</strong>. Il tuo ebook è pronto da scaricare.</p>
            <div style="text-align:center;">
              <a href="${downloadUrl}" class="btn">📥 Scarica il tuo Ebook ora</a>
            </div>
            <div class="note">
              <p>⚠️ <strong>Conserva questa email</strong> — il link potrebbe scadere. Scarica subito il PDF e salvalo sul tuo telefono o computer.</p>
            </div>
            <p>Hai domande o problemi? Rispondi direttamente a questa email, ti aiutiamo entro 24 ore.</p>
            <p>In bocca al lupo per l'esame! 🍀</p>
            <p style="color:#0A0E1A; font-weight:600;">Il team di Patente Facile</p>
          </div>
          <div class="footer">
            <p>© 2024 Patente Facile · Hai ricevuto questa email perché hai acquistato il nostro ebook.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

// ─── Stripe webhook (raw body necessario) ────────────────────────────────────
app.post(
  "/webhook/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const email = session.customer_details?.email;
      const name = session.customer_details?.name;
      if (email) {
        await sendDownloadEmail(email, name);
      }
    }
    res.json({ received: true });
  }
);

// ─── JSON body parser (dopo il webhook) ──────────────────────────────────────
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// ─── Stripe: crea sessione checkout ──────────────────────────────────────────
app.post("/create-stripe-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Patente Facile — Ebook",
              description: "I top trucchi per passare l'esame della patente",
              images: [`${process.env.APP_URL}/assets/cover-preview.jpg`],
            },
            unit_amount: parseInt(process.env.EBOOK_PRICE_EUR) || 699,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.APP_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/cancel.html`,
      billing_address_collection: "auto",
      locale: "it",
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: "Errore nella creazione del pagamento." });
  }
});

// ─── PayPal: crea ordine ──────────────────────────────────────────────────────
app.post("/paypal/create-order", async (req, res) => {
  try {
    const accessToken = await getPayPalAccessToken();
    const response = await fetch(
      `${paypalBaseUrl()}/v2/checkout/orders`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              amount: {
                currency_code: "EUR",
                value: "6.99",
              },
              description: "Patente Facile — Ebook",
            },
          ],
          application_context: {
            brand_name: "Patente Facile",
            locale: "it-IT",
            shipping_preference: "NO_SHIPPING",
            user_action: "PAY_NOW",
            return_url: `${process.env.APP_URL}/success.html`,
            cancel_url: `${process.env.APP_URL}/cancel.html`,
          },
        }),
      }
    );
    const order = await response.json();
    res.json({ id: order.id });
  } catch (err) {
    console.error("PayPal create error:", err);
    res.status(500).json({ error: "Errore PayPal." });
  }
});

// ─── PayPal: cattura pagamento ────────────────────────────────────────────────
app.post("/paypal/capture-order", async (req, res) => {
  const { orderID } = req.body;
  try {
    const accessToken = await getPayPalAccessToken();
    const response = await fetch(
      `${paypalBaseUrl()}/v2/checkout/orders/${orderID}/capture`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const capture = await response.json();

    if (capture.status === "COMPLETED") {
      const payer = capture.payer;
      const email = payer?.email_address;
      const name = `${payer?.name?.given_name || ""} ${payer?.name?.surname || ""}`.trim();
      if (email) {
        await sendDownloadEmail(email, name);
      }
      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Pagamento non completato." });
    }
  } catch (err) {
    console.error("PayPal capture error:", err);
    res.status(500).json({ error: "Errore nella cattura del pagamento." });
  }
});

// ─── PayPal helpers ───────────────────────────────────────────────────────────
function paypalBaseUrl() {
  return process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

async function getPayPalAccessToken() {
  const credentials = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");
  const response = await fetch(`${paypalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await response.json();
  return data.access_token;
}

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Server avviato su http://localhost:${PORT}`);
});

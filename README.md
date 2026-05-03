# 🚗 Patente Facile — Sito Vendita Ebook

## Struttura del progetto

```
patente-ebook/
├── public/
│   ├── index.html        ← Landing page principale
│   ├── success.html      ← Pagina dopo pagamento riuscito
│   ├── cancel.html       ← Pagina pagamento annullato
│   └── assets/
│       ├── style.css
│       └── script.js
├── downloads/            ← Metti qui il tuo ebook PDF
├── server.js             ← Server Node.js (Stripe + PayPal + Email)
├── .env.example          ← Template variabili d'ambiente
└── package.json
```

---

## ⚙️ Setup iniziale

### 1. Installa le dipendenze
```bash
cd patente-ebook
npm install
```

### 2. Crea il file .env
```bash
cp .env.example .env
```
Poi apri `.env` e compila tutti i valori (vedi sotto).

### 3. Aggiungi il tuo ebook
Metti il file PDF nella cartella `downloads/` e aggiorna `EBOOK_DOWNLOAD_URL` nel `.env`.

### 4. Avvia il server
```bash
npm run dev    # sviluppo (con auto-reload)
npm start      # produzione
```

Il sito sarà disponibile su `http://localhost:3000`

---

## 🔑 Variabili d'ambiente (.env)

### Stripe
1. Vai su [dashboard.stripe.com](https://dashboard.stripe.com)
2. Crea un account (se non ce l'hai)
3. Copia **Secret Key** (`sk_live_...`) e **Publishable Key** (`pk_live_...`)
4. Per i webhook: Stripe Dashboard → Developers → Webhooks → Add endpoint
   - URL: `https://tuodominio.it/webhook/stripe`
   - Evento: `checkout.session.completed`
   - Copia il **Webhook Secret** (`whsec_...`)

### PayPal
1. Vai su [developer.paypal.com](https://developer.paypal.com)
2. Crea un'app in "My Apps & Credentials"
3. Copia **Client ID** e **Client Secret**
4. Cambia `PAYPAL_MODE=live` quando sei pronto per la produzione
5. Nel file `index.html` sostituisci `YOUR_PAYPAL_CLIENT_ID` con il tuo vero Client ID

### Email (Gmail)
1. Vai su [myaccount.google.com](https://myaccount.google.com) → Sicurezza → Verifica in due passaggi (attivala)
2. Poi → Sicurezza → Password per le app → Genera una password
3. Usa quella password come `EMAIL_PASS` nel .env

---

## 🌐 Deploy (hosting gratuito su Render)

1. Crea un account su [render.com](https://render.com)
2. Clicca **New → Web Service**
3. Collega il tuo repository GitHub
4. Impostazioni:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Nella sezione **Environment Variables**, inserisci tutte le variabili del tuo `.env`
6. Clicca Deploy

Alternativa gratis: **Railway** ([railway.app](https://railway.app))

---

## 📝 Todo lista prima del lancio

- [ ] Inserire il PDF dell'ebook in `downloads/`
- [ ] Compilare il file `.env` con tutte le chiavi reali
- [ ] Sostituire `YOUR_PAYPAL_CLIENT_ID` in `index.html`
- [ ] Aggiornare `APP_URL` nel `.env` con il dominio reale
- [ ] Aggiornare l'email in `info@patentefacile.it` nel footer e pagine
- [ ] Testare pagamento Stripe in modalità test prima del live
- [ ] Testare pagamento PayPal in sandbox prima del live
- [ ] Aggiungere Privacy Policy e Termini e Condizioni (obbligatori per legge)
- [ ] Configurare il dominio (es. su Namecheap, GoDaddy, Aruba)

---

## 💶 Costi stimati

| Servizio | Costo |
|----------|-------|
| Hosting (Render free tier) | Gratis |
| Dominio .it | ~10€/anno |
| Stripe commissioni | 1.5% + 0.25€ per transazione |
| PayPal commissioni | ~3.4% + 0.35€ per transazione |
| Nodemailer (Gmail) | Gratis fino a 500 email/giorno |

---

Buone vendite! 🚀

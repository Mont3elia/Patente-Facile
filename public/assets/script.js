/* ═══════════════════════════════════════════════════════
   PATENTE FACILE — JS
   ═══════════════════════════════════════════════════════ */

// ─── Modal ────────────────────────────────────────────────
const modal   = document.getElementById("paymentModal");
const overlay = modal;

function openModal() {
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  overlay.classList.remove("open");
  document.body.style.overflow = "";
}

document.getElementById("modalClose").addEventListener("click", closeModal);
overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

["buyBtn","buyBtn2","buyBtn3","buyBtn4"].forEach((id) => {
  document.getElementById(id)?.addEventListener("click", openModal);
});

// ─── Stripe ───────────────────────────────────────────────
document.getElementById("stripePayBtn").addEventListener("click", async () => {
  const btn = document.getElementById("stripePayBtn");
  btn.style.opacity = "0.6";
  btn.style.pointerEvents = "none";
  try {
    const res = await fetch("/create-stripe-session", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Errore nel pagamento. Riprova.");
    }
  } catch {
    alert("Errore di connessione. Riprova.");
  } finally {
    btn.style.opacity = "";
    btn.style.pointerEvents = "";
  }
});

// ─── PayPal ───────────────────────────────────────────────
if (typeof paypal !== "undefined") {
  paypal.Buttons({
    style: {
      layout: "horizontal",
      color:  "gold",
      shape:  "rect",
      label:  "pay",
      height: 48,
    },
    createOrder: async () => {
      const res  = await fetch("/paypal/create-order", { method: "POST" });
      const data = await res.json();
      if (!data.id) {
        console.error("PayPal create-order error:", data.error);
        throw new Error(data.error || "PayPal order creation failed");
      }
      return data.id;
    },
    onApprove: async (data) => {
      const res  = await fetch("/paypal/capture-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderID: data.orderID }),
      });
      const result = await res.json();
      if (result.success) {
        window.location.href = "/success.html";
      } else {
        alert("Pagamento non completato. Riprova.");
      }
    },
    onError: () => {
      alert("Si è verificato un errore con PayPal. Riprova o usa la carta.");
    },
  }).render("#paypal-modal-btn-container");
}

// ─── FAQ accordion ────────────────────────────────────────
document.querySelectorAll(".faq-q").forEach((btn) => {
  btn.addEventListener("click", () => {
    const item = btn.closest(".faq-item");
    const isOpen = item.classList.contains("open");
    document.querySelectorAll(".faq-item").forEach((i) => i.classList.remove("open"));
    if (!isOpen) item.classList.add("open");
  });
});

// ─── Smooth-scroll per il link ancora #acquista ───────────
document.querySelectorAll('a[href="#acquista"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("acquista")?.scrollIntoView({ behavior: "smooth" });
  });
});

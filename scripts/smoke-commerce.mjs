const base = "http://127.0.0.1:3000";
const jar = new Map();

function cookieHeader() {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

function absorb(res) {
  const raw = res.headers.getSetCookie?.() || [];
  for (const c of raw) {
    const [kv] = c.split(";");
    const i = kv.indexOf("=");
    if (i > 0) jar.set(kv.slice(0, i), kv.slice(i + 1));
  }
}

async function readJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON ${res.status}: ${text.slice(0, 200)}`);
  }
}

async function main() {
  const csrfRes = await fetch(`${base}/api/csrf`);
  absorb(csrfRes);
  let { csrfToken } = await readJson(csrfRes);
  jar.set("pb_csrf", csrfToken);

  const email = `test_${Date.now()}@example.com`;
  const reg = await fetch(`${base}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": csrfToken,
      Cookie: cookieHeader(),
    },
    body: JSON.stringify({
      name: "Test User",
      email,
      phone: "03001234567",
      password: "Password123!",
    }),
  });
  absorb(reg);
  const regBody = await readJson(reg);
  console.log("register", reg.status, regBody.ok || regBody.error);

  const csrf2 = await fetch(`${base}/api/csrf`, { headers: { Cookie: cookieHeader() } });
  absorb(csrf2);
  ({ csrfToken } = await readJson(csrf2));
  jar.set("pb_csrf", csrfToken);

  const me = await fetch(`${base}/api/auth/me`, { headers: { Cookie: cookieHeader() } });
  const meBody = await readJson(me);
  console.log("me", me.status, Boolean(meBody.user));

  const { getAllProducts } = await import("../content/products.ts");
  const product = getAllProducts().find((p) => p.available && p.pricing?.price != null);
  if (!product) throw new Error("No priced product");

  const val = await fetch(`${base}/api/cart/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: [
        {
          productId: product.id,
          quantity: 1,
          claimedUnitPrice: product.pricing.price + 999,
        },
      ],
    }),
  });
  const valBody = await readJson(val);
  console.log("tamper", valBody.tamperDetected, valBody.ok);

  const idem = `idem-${Date.now()}`;
  const payload = {
    fullName: "Test User",
    email,
    phone: "03001234567",
    line1: "P-47 St 1",
    city: "Faisalabad",
    province: "Punjab",
    paymentMethod: "order_request",
    idempotencyKey: idem,
    items: [
      {
        productId: product.id,
        quantity: 1,
        claimedUnitPrice: product.pricing.price,
      },
    ],
  };

  const checkout = await fetch(`${base}/api/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": csrfToken,
      Cookie: cookieHeader(),
    },
    body: JSON.stringify(payload),
  });
  const order = await readJson(checkout);
  console.log("checkout", checkout.status, order.order?.reference || order.error);

  const checkout2 = await fetch(`${base}/api/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": csrfToken,
      Cookie: cookieHeader(),
    },
    body: JSON.stringify(payload),
  });
  const order2 = await readJson(checkout2);
  console.log(
    "idempotent",
    order.order?.reference === order2.order?.reference,
    order.order?.reference,
  );

  const track = await fetch(`${base}/api/orders/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reference: order.order.reference, identity: email }),
  });
  const trackBody = await readJson(track);
  console.log("track", track.status, trackBody.order?.reference);

  const bad = await fetch(`${base}/api/orders/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reference: order.order.reference,
      identity: "someoneelse@example.com",
    }),
  });
  console.log("track-deny", bad.status);

  for (const path of [
    "/",
    "/search",
    "/category/feeding-bottles",
    "/checkout",
    "/account",
    "/about",
    "/delivery",
    "/sale",
  ]) {
    const r = await fetch(`${base}${path}`);
    console.log("page", path, r.status);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

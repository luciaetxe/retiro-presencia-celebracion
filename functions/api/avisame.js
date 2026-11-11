// Formulario público «Avísame del próximo retiro» (sección de contacto de la portada).
// Guarda a cada persona en KV como "persona:<id>" (ver personas.js). Si el correo ya estaba apuntado,
// actualiza sus datos sin duplicar (y si estaba de baja, vuelve a «interesada»).
// Antispam: trampa oculta "web" (debe ir vacía), tiempo mínimo desde que se abrió el formulario (campo "t")
// y Turnstile si el proyecto tiene el secreto TURNSTILE_SECRET (sin secreto se deja pasar y se avisa en logs).
// POST (JSON o formulario) → { ok: true, ya: <bool> }. Sin JS (formulario normal) → 303 a /gracias.
import { PREFIJO, buscaPorCorreo, limpia, metadatos } from "./personas.js";

const CABECERAS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const EPOCAS = ["", "primavera", "verano", "otono", "invierno", "cualquiera"];
const MIN_MS = 3000;

function json(obj, status = 200) { return new Response(JSON.stringify(obj), { status, headers: CABECERAS }); }
function correoOk(s) { return /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/i.test(s); }

async function leeCampos(request) {
  const tipo = (request.headers.get("content-type") || "").toLowerCase();
  if (tipo.includes("application/json")) {
    const j = await request.json();
    return { campos: j && typeof j === "object" ? j : {}, html: false };
  }
  const fd = await request.formData();
  const campos = {};
  for (const [k, v] of fd.entries()) campos[k] = typeof v === "string" ? v : "";
  return { campos, html: true };
}

async function turnstileOk(token, env, ip) {
  if (!env.TURNSTILE_SECRET) { console.log("avisame: sin TURNSTILE_SECRET, se deja pasar sin comprobar"); return true; }
  if (!token) return false;
  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret: env.TURNSTILE_SECRET, response: token, remoteip: ip }),
    });
    const j = await r.json();
    return !!j.success;
  } catch (e) { console.log("avisame: siteverify falló", String(e)); return false; }
}

export async function onRequestPost({ request, env }) {
  let campos, html;
  try { ({ campos, html } = await leeCampos(request)); } catch (e) { return json({ error: "formato" }, 400); }
  const s = k => limpia(campos[k], 200);
  const nombre = s("nombre"), correo = s("correo").toLowerCase(), whatsapp = limpia(campos.whatsapp, 40);
  const epoca = EPOCAS.includes(s("epoca")) ? s("epoca") : "";
  const c = campos.consiente;
  const consiente = c === true || c === "on" || c === "1" || c === "true";
  const bien = obj => html
    ? new Response(null, { status: 303, headers: { location: "/gracias", "cache-control": "no-store" } })
    : json(obj, 200);

  // bots: trampa rellena o envío demasiado rápido → «ok» sin guardar nada
  const t = Number(campos.t || 0);
  if (s("web") || !t || Date.now() - t < MIN_MS) return bien({ ok: true, ya: false });
  if (!await turnstileOk(s("cf-turnstile-response"), env, request.headers.get("cf-connecting-ip") || "")) return json({ error: "turnstile" }, 403);

  if (nombre.length < 2) return json({ error: "nombre" }, 400);
  if (!correoOk(correo)) return json({ error: "correo" }, 400);
  if (!consiente) return json({ error: "consiente" }, 400);

  const ahora = new Date().toISOString();
  const previa = await buscaPorCorreo(env, correo);
  let p;
  if (previa) {
    p = previa;
    p.nombre = nombre;
    if (whatsapp) p.whatsapp = whatsapp;
    if (epoca) p.epoca = epoca;
    p.otra = ahora;
    if (p.estado === "baja") p.estado = "interesada";
  } else {
    p = { id: crypto.randomUUID().replace(/-/g, "").slice(0, 16), nombre, correo, whatsapp, epoca, cuando: ahora, estado: "interesada", nota: "", origen: "web" };
  }
  await env.TAREAS.put(PREFIJO + p.id, JSON.stringify(p), { metadata: metadatos(p) });
  return bien({ ok: true, ya: !!previa });
}

export function onRequestGet() { return json({ error: "método" }, 405); }

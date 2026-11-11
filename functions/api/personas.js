// Personas interesadas en retiros futuros (y, más adelante, reservas). Solo con la cookie de /tareas.
// Cada persona en "persona:<id>" (JSON) con metadatos { correo, nombre, cuando, estado }, para poder
// buscar por correo listando claves sin leer cada una.
// Campos: nombre, correo (obligatorio, único), whatsapp (opcional, tal como se escribió), cuando, estado, nota,
// origen ("web" = formulario de la portada, "interno" = apuntada a mano por Lucía o Marga desde /interno).
// Estados: interesada → contactada → reservada → confirmada → baja.
// GET → { items: [...] } ordenadas de la más reciente a la más antigua.
// POST { nombre, correo, whatsapp? } (desde /interno) → { items } con la nueva; 409 { error: "ya" } si el correo ya estaba.
import { tieneAcceso } from "../../lib/acceso.js";

export const PREFIJO = "persona:";
export const ESTADOS = ["interesada", "contactada", "reservada", "confirmada", "baja"];
const CABECERAS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

export function json(obj, status = 200) { return new Response(JSON.stringify(obj), { status, headers: CABECERAS }); }
export function limpia(v, max) { return String(v == null ? "" : v).replace(/[\u0000-\u001f]+/g, " ").trim().slice(0, max); }

export function metadatos(p) { return { correo: p.correo, nombre: p.nombre, cuando: p.cuando, estado: p.estado }; }
export function correoOk(s) { return /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/i.test(s); }
// WhatsApp: se guarda como se escribió (con espacios, +, guiones), pero debe tener entre 7 y 15 cifras.
export function whatsappOk(s) { return /^\+?[\d\s().-]*$/.test(s) && /^\d{7,15}$/.test(s.replace(/\D/g, "")); }
export function nuevaPersona(nombre, correo, whatsapp, origen) {
  return { id: crypto.randomUUID().replace(/-/g, "").slice(0, 16), nombre, correo, whatsapp: whatsapp || "", cuando: new Date().toISOString(), estado: "interesada", nota: "", origen };
}

export async function claves(env) {
  const todas = [];
  let cursor;
  do {
    const r = await env.TAREAS.list({ prefix: PREFIJO, cursor });
    todas.push(...r.keys);
    cursor = r.list_complete ? undefined : r.cursor;
  } while (cursor);
  return todas;
}

export async function buscaPorCorreo(env, correo) {
  const k = (await claves(env)).find(x => x.metadata && x.metadata.correo === correo);
  if (!k) return null;
  const raw = await env.TAREAS.get(k.name);
  try { return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
}

export async function todas(env) {
  const ks = await claves(env);
  const items = await Promise.all(ks.map(async k => {
    const raw = await env.TAREAS.get(k.name);
    try { return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }));
  return items.filter(Boolean).sort((a, b) => (b.cuando || "").localeCompare(a.cuando || ""));
}

export async function onRequestGet({ request, env }) {
  if (!await tieneAcceso(request, env)) return json({ error: "acceso" }, 401);
  return json({ items: await todas(env) });
}

// Alta a mano desde /interno (alguien que lo pidió por WhatsApp, en persona…). Mismo correo = misma persona: no se duplica.
export async function onRequestPost({ request, env }) {
  if (!await tieneAcceso(request, env)) return json({ error: "acceso" }, 401);
  let body;
  try { body = await request.json(); } catch (e) { return json({ error: "json" }, 400); }
  if (!body || typeof body !== "object") return json({ error: "json" }, 400);
  const nombre = limpia(body.nombre, 120), correo = limpia(body.correo, 200).toLowerCase(), whatsapp = limpia(body.whatsapp, 30);
  if (nombre.length < 2) return json({ error: "nombre" }, 400);
  if (!correoOk(correo)) return json({ error: "correo" }, 400);
  if (whatsapp && !whatsappOk(whatsapp)) return json({ error: "whatsapp" }, 400);
  const previa = await buscaPorCorreo(env, correo);
  if (previa) return json({ error: "ya", nombre: previa.nombre }, 409);
  const p = nuevaPersona(nombre, correo, whatsapp, "interno");
  await env.TAREAS.put(PREFIJO + p.id, JSON.stringify(p), { metadata: metadatos(p) });
  return json({ items: await todas(env) });
}

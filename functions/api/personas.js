// Personas interesadas en retiros futuros (y, más adelante, reservas). Solo con la cookie de /tareas.
// Cada persona en "persona:<id>" (JSON) con metadatos { correo, nombre, cuando, estado }, para poder
// buscar por correo listando claves sin leer cada una.
// Estados: interesada → contactada → reservada → confirmada → baja.
// GET → { items: [...] } ordenadas de la más reciente a la más antigua.
import { tieneAcceso } from "../../lib/acceso.js";

export const PREFIJO = "persona:";
export const ESTADOS = ["interesada", "contactada", "reservada", "confirmada", "baja"];
const CABECERAS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

export function json(obj, status = 200) { return new Response(JSON.stringify(obj), { status, headers: CABECERAS }); }
export function limpia(v, max) { return String(v == null ? "" : v).replace(/[\u0000-\u001f]+/g, " ").trim().slice(0, max); }

export function metadatos(p) { return { correo: p.correo, nombre: p.nombre, cuando: p.cuando, estado: p.estado }; }

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

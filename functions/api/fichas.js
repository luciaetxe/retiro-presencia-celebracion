// Fichas (documentos) de Lucía y Marga en /tareas: PDF e imágenes guardados en KV.
// Índice en la clave "fichas-indice": { items: [{ id, nombre, archivo, tipo, tam, cuando }] }.
// Cada archivo en la clave "ficha:<id>" (bytes). Solo con la cookie de acceso (lib/acceso.js).
// GET → índice.  POST multipart (archivo, nombre opcional) → guarda y devuelve el índice.
import { tieneAcceso } from "../../lib/acceso.js";

export const INDICE = "fichas-indice";
const MAX = 20 * 1024 * 1024;
const TIPOS = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const CABECERAS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

export function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: CABECERAS });
}

export async function indice(env) {
  const raw = await env.TAREAS.get(INDICE);
  if (!raw) return { items: [] };
  try { const j = JSON.parse(raw); return Array.isArray(j.items) ? j : { items: [] }; } catch (e) { return { items: [] }; }
}

export async function onRequestGet({ request, env }) {
  if (!await tieneAcceso(request, env)) return json({ error: "acceso" }, 401);
  return json(await indice(env));
}

export async function onRequestPost({ request, env }) {
  if (!await tieneAcceso(request, env)) return json({ error: "acceso" }, 401);
  let fd;
  try { fd = await request.formData(); } catch (e) { return json({ error: "formato" }, 400); }
  const f = fd.get("archivo");
  if (!f || typeof f === "string" || !f.size) return json({ error: "sin archivo" }, 400);
  if (f.size > MAX) return json({ error: "grande" }, 413);
  const tipo = (f.type || "").toLowerCase();
  if (!TIPOS[tipo]) return json({ error: "tipo" }, 415);
  const archivo = String(f.name || "ficha").slice(0, 160);
  let nombre = String(fd.get("nombre") || "").trim().slice(0, 120);
  if (!nombre) nombre = archivo.replace(/\.[a-z0-9]+$/i, "") || "Ficha";
  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  await env.TAREAS.put("ficha:" + id, await f.arrayBuffer());
  const idx = await indice(env);
  idx.items.push({ id, nombre, archivo, tipo, tam: f.size, cuando: new Date().toISOString() });
  await env.TAREAS.put(INDICE, JSON.stringify(idx));
  return json(idx);
}

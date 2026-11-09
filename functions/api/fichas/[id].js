// Una ficha concreta: GET sirve el archivo (para abrirlo o descargarlo), PATCH { nombre } la renombra, DELETE la quita.
// Solo con la cookie de acceso (lib/acceso.js).
import { tieneAcceso } from "../../../lib/acceso.js";
import { INDICE, indice, json } from "../fichas.js";

const EXT = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

function limpio(s) { return s.replace(/[\\/:*?"<>|\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 100) || "ficha"; }

export async function onRequestGet({ request, env, params }) {
  if (!await tieneAcceso(request, env)) return json({ error: "acceso" }, 401);
  const idx = await indice(env);
  const m = idx.items.find(x => x.id === params.id);
  if (!m) return json({ error: "no existe" }, 404);
  const bytes = await env.TAREAS.get("ficha:" + m.id, { type: "arrayBuffer" });
  if (!bytes) return json({ error: "no existe" }, 404);
  const nombre = limpio(m.nombre) + "." + (EXT[m.tipo] || "bin");
  const url = new URL(request.url);
  const modo = url.searchParams.get("bajar") ? "attachment" : "inline";
  return new Response(bytes, {
    headers: {
      "content-type": m.tipo,
      "content-length": String(bytes.byteLength),
      "content-disposition": `${modo}; filename="${nombre.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(nombre)}`,
      "cache-control": "private, no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}

export async function onRequestPatch({ request, env, params }) {
  if (!await tieneAcceso(request, env)) return json({ error: "acceso" }, 401);
  let body;
  try { body = await request.json(); } catch (e) { return json({ error: "json" }, 400); }
  const nombre = String(body && body.nombre || "").trim().slice(0, 120);
  if (!nombre) return json({ error: "nombre" }, 400);
  const idx = await indice(env);
  const m = idx.items.find(x => x.id === params.id);
  if (!m) return json({ error: "no existe" }, 404);
  m.nombre = nombre;
  await env.TAREAS.put(INDICE, JSON.stringify(idx));
  return json(idx);
}

export async function onRequestDelete({ request, env, params }) {
  if (!await tieneAcceso(request, env)) return json({ error: "acceso" }, 401);
  const idx = await indice(env);
  const n = idx.items.length;
  idx.items = idx.items.filter(x => x.id !== params.id);
  if (idx.items.length === n) return json({ error: "no existe" }, 404);
  await env.TAREAS.delete("ficha:" + params.id);
  await env.TAREAS.put(INDICE, JSON.stringify(idx));
  return json(idx);
}

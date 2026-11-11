// Una persona: PATCH { estado?, nota? } la cambia; DELETE la quita. Solo con la cookie de /tareas.
import { tieneAcceso } from "../../../lib/acceso.js";
import { PREFIJO, ESTADOS, json, limpia, metadatos, todas } from "../personas.js";

export async function onRequestPatch({ request, env, params }) {
  if (!await tieneAcceso(request, env)) return json({ error: "acceso" }, 401);
  let body;
  try { body = await request.json(); } catch (e) { return json({ error: "json" }, 400); }
  if (!body || typeof body !== "object") return json({ error: "json" }, 400);
  const raw = await env.TAREAS.get(PREFIJO + params.id);
  if (!raw) return json({ error: "no existe" }, 404);
  const p = JSON.parse(raw);
  if (body.estado !== undefined) { if (!ESTADOS.includes(body.estado)) return json({ error: "estado" }, 400); p.estado = body.estado; }
  if (body.nota !== undefined) p.nota = limpia(body.nota, 500);
  await env.TAREAS.put(PREFIJO + p.id, JSON.stringify(p), { metadata: metadatos(p) });
  return json({ items: await todas(env) });
}

export async function onRequestDelete({ request, env, params }) {
  if (!await tieneAcceso(request, env)) return json({ error: "acceso" }, 401);
  if (!await env.TAREAS.get(PREFIJO + params.id)) return json({ error: "no existe" }, 404);
  await env.TAREAS.delete(PREFIJO + params.id);
  return json({ items: await todas(env) });
}

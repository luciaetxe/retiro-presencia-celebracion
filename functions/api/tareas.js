// Estado compartido de la lista de tareas de Lucía y Margarita (/tareas).
// Un solo documento JSON en KV: { v: <versión>, items: [...] }.
// Solo con la cookie de acceso de /tareas (lib/acceso.js); sin ella, 401.
// GET  → devuelve el estado.  PUT { base, items } → guarda si base === v actual (si no, 409 con el estado vigente).
import { tieneAcceso } from "../../lib/acceso.js";

const KEY = "estado-nov-2026";
const CABECERAS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: CABECERAS });
}

async function leer(env) {
  const raw = await env.TAREAS.get(KEY);
  if (!raw) return { v: 0, items: [] };
  try { return JSON.parse(raw); } catch (e) { return { v: 0, items: [] }; }
}

// Listas: "tareas" (fecha y quién), "llevar" (solo texto) y "comida" (cantidad, unidad, precio por unidad, quién pagó).
function numOk(v, max) { return typeof v === "number" && isFinite(v) && v >= 0 && v <= max; }
function itemValido(t) {
  if (!(t && typeof t.id === "string" && t.id.length <= 40
    && typeof t.texto === "string" && t.texto.length <= 300
    && (t.lista === "tareas" || t.lista === "llevar" || t.lista === "comida")
    && (t.fecha === undefined || t.fecha === "" || /^\d{4}-\d{2}-\d{2}$/.test(t.fecha))
    && (t.quien === undefined || t.quien === "" || t.quien === "lucia" || t.quien === "marga" || t.quien === "dos")
    && (t.nota === undefined || (typeof t.nota === "string" && t.nota.length <= 300))
    && typeof t.hecho === "boolean")) return false;
  if (t.lista !== "comida") return true;
  return numOk(t.cantidad, 99999)
    && typeof t.unidad === "string" && t.unidad.length <= 8
    && (t.precio === null || numOk(t.precio, 99999))
    && (t.pagado === "" || t.pagado === "lucia" || t.pagado === "marga");
}

export async function onRequestGet({ request, env }) {
  if (!await tieneAcceso(request, env)) return json({ error: "acceso" }, 401);
  return json(await leer(env));
}

export async function onRequestPut({ request, env }) {
  if (!await tieneAcceso(request, env)) return json({ error: "acceso" }, 401);
  let body;
  try { body = await request.json(); } catch (e) { return json({ error: "json" }, 400); }
  if (!body || !Array.isArray(body.items) || body.items.length > 300 || !body.items.every(itemValido)) {
    return json({ error: "formato" }, 400);
  }
  const actual = await leer(env);
  if (body.base !== actual.v) return json({ error: "conflicto", estado: actual }, 409);
  const nuevo = { v: actual.v + 1, items: body.items, cuando: new Date().toISOString() };
  await env.TAREAS.put(KEY, JSON.stringify(nuevo));
  return json(nuevo);
}

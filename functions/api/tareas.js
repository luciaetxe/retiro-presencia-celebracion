// Estado compartido de la lista de tareas de Lucía y Margarita (/tareas).
// Un solo documento JSON en KV: { v: <versión>, items: [...] }.
// GET  → devuelve el estado.  PUT { base, items } → guarda si base === v actual (si no, 409 con el estado vigente).
const KEY = "estado-nov-2026";
const CLAVE = "bellver-2026";
const CABECERAS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: CABECERAS });
}

async function leer(env) {
  const raw = await env.TAREAS.get(KEY);
  if (!raw) return { v: 0, items: [] };
  try { return JSON.parse(raw); } catch (e) { return { v: 0, items: [] }; }
}

function itemValido(t) {
  return t && typeof t.id === "string" && t.id.length <= 40
    && typeof t.texto === "string" && t.texto.length <= 300
    && (t.lista === "tareas" || t.lista === "llevar")
    && (t.fecha === "" || /^\d{4}-\d{2}-\d{2}$/.test(t.fecha))
    && (t.quien === "" || t.quien === "lucia" || t.quien === "marga" || t.quien === "dos")
    && (t.nota === undefined || (typeof t.nota === "string" && t.nota.length <= 300))
    && typeof t.hecho === "boolean";
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (url.searchParams.get("k") !== CLAVE) return json({ error: "clave" }, 403);
  return json(await leer(env));
}

export async function onRequestPut({ request, env }) {
  const url = new URL(request.url);
  if (url.searchParams.get("k") !== CLAVE) return json({ error: "clave" }, 403);
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

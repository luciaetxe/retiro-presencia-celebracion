// /tareas era la dirección antigua de la zona interna: ahora vive en /interno.
export function onRequest() {
  return new Response(null, { status: 302, headers: { location: "/interno", "cache-control": "no-store" } });
}

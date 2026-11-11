// /avisame: dirección corta para Instagram; lleva al formulario del próximo retiro en la portada.
export function onRequest() {
  return new Response(null, { status: 302, headers: { location: "/#contacto", "cache-control": "no-store" } });
}

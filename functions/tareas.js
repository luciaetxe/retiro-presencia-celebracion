// Puerta de /tareas: con la cookie de acceso sirve la página (dist/tareas.html); sin ella, pide la contraseña.
// La puerta no dice qué hay detrás (petición de Lucía, 2026-11-09): solo la hoguera, la casilla y Entrar.
import { tieneAcceso, entrar } from "../lib/acceso.js";

function pagina(error) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>Presencia y Celebración</title>
<meta name="robots" content="noindex, nofollow">
<link rel="icon" href="favicon.svg?v=hoguera" type="image/svg+xml">
<link rel="apple-touch-icon" sizes="180x180" href="favicon-180.png?v=hoguera">
<meta name="theme-color" content="#FFFFFF">
<style>
@font-face{font-family:'Work Sans';font-style:normal;font-weight:300;font-display:block;src:url(fonts/work-sans-300.woff2) format('woff2')}
@font-face{font-family:'Work Sans';font-style:normal;font-weight:400;font-display:block;src:url(fonts/work-sans-400.woff2) format('woff2')}
:root{--fondo:#FFFFFF;--tinta:#141414;--tinta-2:#4F4F4F;--plata:#8C8C8C;--acento:#D9418C;--rojo:#C8402E;--line:rgba(20,20,20,.14);color-scheme:light}
*{box-sizing:border-box}
body{margin:0;background:var(--fondo);color:var(--tinta);font-family:'Work Sans',system-ui,sans-serif;font-weight:300;font-size:18px;line-height:1.55;-webkit-font-smoothing:antialiased}
.hoja{max-width:600px;margin-inline:auto;padding:clamp(4rem,14vh,8rem) clamp(20px,6vw,40px) 3rem}
.cab{display:grid;justify-items:center;text-align:center;gap:.4rem;margin-bottom:clamp(1.8rem,5vw,2.6rem)}
.cab .marca{width:58px;height:65px;color:var(--tinta)}
form{display:grid;gap:1rem;max-width:300px;margin:1.5rem auto 0;justify-items:center}
input{all:unset;display:block;width:100%;text-align:center;font-weight:300;font-size:1.15rem;line-height:1.4;padding:.45rem 0;border-bottom:1px solid var(--tinta);color:var(--tinta)}
input::placeholder{color:var(--plata)}
input:focus-visible{border-bottom-color:var(--acento)}
button{all:unset;cursor:pointer;font-weight:400;font-size:.9rem;letter-spacing:.06em;color:var(--tinta);border-bottom:1px solid currentColor;line-height:1.3;padding-bottom:.1em;margin-top:.4rem}
button:focus-visible{outline:2px solid var(--acento);outline-offset:4px}
.error{color:var(--rojo);font-size:.9rem;margin:0}
</style>
</head>
<body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<filter id="pulso" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="3" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" xChannelSelector="R" yChannelSelector="G"/></filter>
<g id="hoguera" filter="url(#pulso)" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M62,138 L140,120 M60,122 L138,140 M100,144 L100,128" stroke="currentColor" stroke-width="7"/><path d="M100,112 C84,100 82,84 92,70 C92,82 98,86 100,92 C104,80 100,66 110,54 C112,74 124,80 124,98 C124,108 114,118 100,118 C92,118 86,112 86,104" style="stroke:var(--acento)" stroke-width="7"/><circle cx="120" cy="44" r="4" style="fill:var(--acento)"/><circle cx="84" cy="52" r="3.2" style="fill:var(--acento)"/><circle cx="130" cy="62" r="3" style="fill:var(--acento)"/></g>
</defs></svg>
<main class="hoja">
  <header class="cab">
    <svg class="marca" viewBox="50 36 100 112" aria-hidden="true"><use href="#hoguera"/></svg>
  </header>
  <form method="post" action="tareas" autocomplete="off">
    <input type="password" id="clave" name="clave" placeholder="Contraseña" aria-label="Contraseña" autofocus autocapitalize="off" autocomplete="current-password" required>
    ${error ? '<p class="error">No es esa.</p>' : ''}
    <button type="submit">Entrar</button>
  </form>
</main>
</body>
</html>
`;
}

const SIN_CACHE = { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" };

export async function onRequestGet({ request, env }) {
  if (await tieneAcceso(request, env)) {
    const r = await env.ASSETS.fetch(request);
    const h = new Headers(r.headers);
    h.set("cache-control", "no-store");
    h.set("x-robots-tag", "noindex, nofollow");
    return new Response(r.body, { status: r.status, headers: h });
  }
  return new Response(pagina(false), { status: 401, headers: SIN_CACHE });
}

export async function onRequestPost({ request, env }) {
  let intento = "";
  try { intento = String((await request.formData()).get("clave") || ""); } catch (e) {}
  const cookie = await entrar(intento, env);
  if (!cookie) {
    await new Promise(r => setTimeout(r, 600)); // que probar a lo loco sea lento
    return new Response(pagina(true), { status: 401, headers: SIN_CACHE });
  }
  return new Response(null, { status: 303, headers: { location: "tareas", "set-cookie": cookie, "cache-control": "no-store" } });
}

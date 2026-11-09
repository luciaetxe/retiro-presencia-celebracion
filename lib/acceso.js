// Acceso privado a /tareas y a su API (Lucía y Marga).
// Una sola contraseña compartida, guardada como secreto CLAVE_TAREAS en el proyecto de Pages
// (npx wrangler pages secret put CLAVE_TAREAS --project-name tribuconecta; en local, .dev.vars).
// Al acertarla se deja una cookie con una firma HMAC derivada de la contraseña, válida un año.
// Cambiar la contraseña invalida todas las cookies.
const COOKIE = "tribu";
const SELLO = "acceso-tareas-v1";
const UN_ANO = 60 * 60 * 24 * 365;

async function firma(clave) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(clave), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(SELLO));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function iguales(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

function cookieDe(request) {
  const h = request.headers.get("cookie") || "";
  for (const parte of h.split(";")) {
    const [n, ...v] = parte.trim().split("=");
    if (n === COOKIE) return v.join("=");
  }
  return "";
}

// ¿Lleva la petición una cookie válida? Sin secreto configurado, nadie entra.
export async function tieneAcceso(request, env) {
  if (!env.CLAVE_TAREAS) return false;
  return iguales(cookieDe(request), await firma(env.CLAVE_TAREAS));
}

// ¿Es esta la contraseña? Devuelve la cabecera Set-Cookie, o null si no lo es.
export async function entrar(intento, env) {
  if (!env.CLAVE_TAREAS || !iguales(intento.trim(), env.CLAVE_TAREAS)) return null;
  return `${COOKIE}=${await firma(env.CLAVE_TAREAS)}; Path=/; Max-Age=${UN_ANO}; HttpOnly; Secure; SameSite=Lax`;
}

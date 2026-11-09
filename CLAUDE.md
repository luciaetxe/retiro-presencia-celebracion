# Tribu Conecta — reglas del proyecto

Web de los retiros de mujeres de Margarita Margenat y Lucía Echenique.
En producción: https://www.tribuconecta.site (Cloudflare Pages, proyecto `tribuconecta`, rama de producción `master`, subida directa con wrangler).

## Cómo se construye y se sube (desde el 2026-10-26)

- La fuente de verdad del diseño es `_lab/boceto-marca/camino.html` (carpeta `_lab*` ignorada en git). Lleva barras de prueba de tono y acento que NO van a producción.
- `python _lab/boceto-marca/build.py` genera `dist/` (index.html con head completo, fuentes en `fonts/`, fotos en `img/`, vídeo, favicons, og.jpg, `_headers`). `dist/` está ignorado.
- Vista previa: `npx wrangler pages deploy dist --project-name tribuconecta --branch preview --commit-dirty=true` → https://preview.tribuconecta.pages.dev
- Producción: `npx wrangler pages deploy dist --project-name tribuconecta --branch master --commit-dirty=true` (la lanza Lucía: el clasificador de Claude Code la bloquea).
- Tras construir, copiar `dist/index.html` a la raíz del repo y las fotos nuevas a `img/`, y hacer commit.
- **Documentos para las participantes (desde el 2026-11-07):** `maleta.html` en la raíz es la fuente de verdad de la lista "Qué llevar" (URL `/maleta`, casillas guardadas en localStorage, `@media print` = una hoja A4 a dos columnas). `build.py` la copia a `dist/`. El PDF y la imagen para WhatsApp se generan con Chrome headless `--print-to-pdf` y se rasteriza la página con pymupdf a 200 dpi → `documentos/que-llevar.{pdf,png}`. Capturas fiables con CDP (`Emulation.setDeviceMetricsOverride`), no con `--window-size`.
- **Hoja de información y compromiso (2026-11-09):** `documentos/fuente/hoja-de-compromiso.html` (solo para imprimir, no se publica; fuentes vía `../../fonts/`) → `python documentos/fuente/pdf.py hoja-de-compromiso` genera `documentos/hoja-de-compromiso.{pdf,png}` (Chrome headless + pymupdf). Se firma en papel el viernes al llegar; una por participante. No es una exoneración: informa, recoge compromisos en primera persona, contacto de emergencia, salud, fotos y nota de datos (se guarda 3 años y se destruye).
- **Horario para la casa (2026-11-09):** `documentos/fuente/horario.html` → `python documentos/fuente/pdf.py horario` → `documentos/horario.pdf` (3 páginas: Viernes, Sábado, Domingo; PNG por página `horario-N.png`). Plano VACÍO a propósito: Lucía no quiere revelar las actividades y las escribirán a mano allí; 8 filas de Hora / Qué / Dónde por día, pie con wifi, teléfonos de las dos (en blanco) y 112. Las tres hojas se generan con JS desde un `<template>`.
- **Lista de tareas de Lucía y Marga (desde el 2026-11-07):** `tareas.html` en la raíz (URL `/tareas`, noindex; pestañas Tareas / Para llevar, agrupadas por fecha; tocar la fecha la cambia, tocar el nombre cambia quién, tocar el texto muestra «Sin fecha» y «Quitar»). Tercera pestaña **Calendario** (desde el 2026-11-08): solo la lista Tareas, en rejilla semanal de 7 columnas a ≥760 px (la hoja se ensancha a 1120 px) y en columna de días en móvil, del día de hoy al 22 de noviembre, con bandejas «Sin fecha» (zona de destino) y «Atrasadas» (solo si hay). Mover: tocar la tarea y luego el día (o arrastrar: ratón al moverse, dedo tras mantener pulsado 380 ms, con `touchmove` no pasivo para frenar el scroll); al seleccionar una, la línea de ayuda permite cambiar quién la hace (Lucía / Marga / Las dos). Iniciales en cada ficha: L, M, L+M. Prueba automática de referencia: CDP con `websocket-client` (clics y arrastre con `Input.dispatchMouseEvent`); no cambiar las métricas del dispositivo a mitad de un arrastre porque dispara `pointercancel`. El estado es COMPARTIDO entre las dos: un JSON en KV (`wrangler.toml`, binding `TAREAS`, namespace `dfa219e96df14ffb98d513923342a4cf`, clave `estado-nov-2026`) servido por la Pages Function `functions/api/tareas.js` (GET/PUT con la cookie de acceso, versión `v` y 409 en conflicto). `wrangler pages deploy` sube `functions/` solo; `build.py` copia `tareas.html` a `dist/`. Para probar en local: `npx wrangler pages dev dist` (KV local vacío). Para cambiar la lista desde aquí: `wrangler kv key get/put --remote`.
- **Pestaña «Para llevar» (rehecha el 2026-11-09):** dos apartados, sin fecha ni persona. **Comida** (`lista: "comida"`): cada línea con `texto`, `cantidad` (número), `unidad` (ud/kg/g/l/paq), `precio` por unidad (número o `null` = sin precio), `pagado` (''/lucia/marga; al ponerlo se marca también comprada) y `hecho` = comprado; el total de la línea se calcula (cantidad × precio) y arriba va un resumen: Presupuesto (`PRESUPUESTO = 400` € en el JS), Previsto (con «N sin precio»), Queda / Se pasa (en rojo), Ha pagado Lucía / Marga (a devolver), Comprado hasta ahora. Tocar el nombre o la cantidad abre un formulario en línea (nombre, cantidad, unidad, precio; Guardar / Cancelar / Quitar; Esc cancela); tocar «Sin pagar / Pagó Lucía / Pagó Marga» lo rota. **Otras cosas para llevar** (`lista: "llevar"`): solo texto y casilla. En Tareas y Otras cosas, tocar el texto muestra «Cambiar el texto» (casilla en línea: Intro guarda, Esc deja el de antes, salir de la casilla guarda) junto a Sin fecha / Quitar. El refresco automático no pisa una casilla abierta. La API valida por lista (`itemValido`). Números: se escriben con coma, se guardan como número. Prueba de referencia: `scratchpad/prueba_llevar.py` (CDP; para entrar, `form.requestSubmit()`, porque la tecla Intro simulada no envía el formulario).
- **Pestaña «Fichas» (desde el 2026-11-09):** documentos de Lucía y Marga (consentimiento informado, horario…) guardados en el MISMO KV: índice en la clave `fichas-indice` (`{items:[{id,nombre,archivo,tipo,tam,cuando}]}`) y cada archivo en `ficha:<id>` (bytes; máx. 20 MB; solo PDF, JPG, PNG, WebP). API: `functions/api/fichas.js` (GET índice, POST multipart `archivo` + `nombre`) y `functions/api/fichas/[id].js` (GET sirve el archivo con `Content-Disposition: inline`, o `attachment` con `?bajar=1`; PATCH `{nombre}`; DELETE). Todo tras la cookie de acceso. En la página: tocar el nombre abre en pestaña nueva, «Descargar» guarda, «Cambiar el nombre» edita en línea, «Quitar» pide confirmación («Sí, quitar «…»» / No). El formulario de subida va por su cuenta (no tiene campo `texto`; el manejador genérico de `.anadir form` lo salta). Con cuatro pestañas, a ≤420 px se reparten en dos filas y la raya va bajo la palabra. Pruebas: `scratchpad/prueba_fichas.py` (CDP con `DOM.setFileInputFiles`) y curl; OJO: el curl de Windows necesita rutas Windows en `-F archivo=@…` (con rutas /tmp devuelve 000).
- **Acceso privado a /tareas (desde el 2026-11-09):** `functions/tareas.js` es la puerta: sin cookie devuelve una página que pide la contraseña (401; solo la hoguera, la casilla y «Entrar», sin decir qué hay detrás: es interno, petición de Lucía) y con la cookie sirve `dist/tareas.html` vía `env.ASSETS`. La API `functions/api/tareas.js` exige la misma cookie (401 sin ella; la página vuelve a la puerta). Lógica común en `lib/acceso.js`: una sola contraseña compartida en el secreto `CLAVE_TAREAS` del proyecto de Pages (producción Y preview por separado), cookie `tribu` = HMAC-SHA256 derivada de la contraseña, un año, HttpOnly/Secure. Cambiar la contraseña echa a todo el mundo. El repo es PÚBLICO: la contraseña nunca va en el código ni en wrangler.toml. Ponerla: `echo -n "<palabra>" | npx wrangler pages secret put CLAVE_TAREAS --project-name tribuconecta` (y lo mismo con `--env preview`); **el clasificador bloquea a Claude las escrituras de secretos**, lo lanza Lucía con `!`. En local, `.dev.vars` (ignorado) con `CLAVE_TAREAS=…`. Sin secreto configurado nadie entra. `/maleta` sigue siendo pública (es para las participantes).

## Sistema de diseño (v10, 2026-10-26; sustituye a la paleta lavanda de septiembre)

- Fondo blanco puro `#FFFFFF` (alterno `#F6F5F2`), tinta `#141414`, texto secundario `#4F4F4F`, acento **fucsia `#D9418C`** (solo llama de la hoguera, "tribu.", 50€), rojo `#C8402E` solo en "Quedan N plazas" (a propósito: chirría), noche `#0A0F22` → `#223055` (portada y reserva, con estrellas en canvas).
- Tipografía (autoalojada en `fonts/`, `font-display: block`): **Young Serif** (títulos, frases, horas), **Work Sans 300** (párrafos, listas), **Homemade Apple** solo en portada, nombres y "tribu.".
- Dibujos a tinta (filtro feTurbulence/feDisplacementMap): hoguera (marca; palitos en tinta, llama en acento) y ermita en tinta sólida junto al título de El lugar. Estrellas de palitos pequeñas solo en Precio.
- Esquema de bloque: texto a la izquierda, columna derecha fija de 320 px con foto cuadrada (1:1), vídeo cuadrado o dibujo. Sin títulos mini, sin títulos sticky, sin efectos salvo las estrellas y el fundido de la portada.
- Orden: portada (noche) · La intención · Actividades (desplegable, a todo el ancho; el vídeo de lavanda se quitó el 2026-11-04) · cita "tribu." (sin estrellitas desde el 2026-11-04; mismo orden en móvil) · Programa (centrado en desktop, dos columnas) · Nosotras · El lugar (Cristo románico) · Alojamiento y comida (una sección) · Cómo se sostiene · Próximas fechas (destacada) · Reserva (noche) · Cómo llegar.
- Gustos de Lucía: fotos nunca recortando caras, su foto solo en Nosotras, manuscrita en 2-3 gestos, acento en pocos sitios, coherencia antes que novedad. Criterio propio y proponer, no obedecer orden a orden.


## Innegociables

1. **El texto no se toca.** Ni reescribir, ni acortar, ni "mejorar", ni corregir
   estilo. Se puede cambiar cómo se compone (tamaño, columna, jerarquía, saltos
   de línea), nunca qué dice. Si hay una errata evidente, señalarla en un
   comentario; no corregirla.
2. **Sin enlaces a las webs personales** de Margarita ni Lucía hasta que avisen.
   Dejar el marcado preparado en "Nosotras" (`<span>` que luego será `<a>`).
3. **Nada de banco de imágenes.** Solo material propio: el vídeo de lavanda y
   mariposa y las fotos de la ermita, la casa y ellas dos.
4. **Sin emojis, sin iconos genéricos, sin degradados de botón, sin tarjetas con
   sombra idénticas.**
5. **Capturas a 375, 768 y 1440 px antes de cerrar cada fase.** Nada de cambios
   grandes sin proponerlos antes.
6. Tras cada fase, comparar el `innerText` antes/después: debe ser idéntico.

## Por qué la web anterior parecía generada

No era el texto ni la paleta: era el ritmo. Secciones de la misma altura, todo
centrado, título-párrafo-título-párrafo, imágenes como rectángulos alineados.
Antídotos: asimetría, escala variable, alguna foto a sangre, una sección casi
vacía ("El programa"), listas compuestas tipográficamente en vez de rejillas.

## Paleta anterior (2026-09-16, SUSTITUIDA el 2026-10-26; se conserva como historia)

Elegida por Lucía sobre su moodboard. No reabrir. Sin granate ni fucsia.

```css
--bg:           #F1EEF2;  /* bruma lavanda: fondo base */
--bg-alt:       #E3DCE7;  /* lila arena: secciones alternas */
--dark-2:       #3F4A39;  /* salvia profundo: velo del hero */
--accent:       #6C5A7B;  /* lavanda oscura: etiquetas, cursivas, detalles */
--dark-lav:     #4B4058;  /* lavanda profunda: "El programa" y "Reserva tu plaza" */
--light:        #F3EFE6;  /* crema: texto sobre fondos oscuros */
--accent-light: #D9CCE3;  /* lavanda clara: "Celebración" en el hero */
```

Tipografía: Fraunces (títulos, con peso) + Karla (texto). Botones rectangulares, nunca píldora.
Rechazado: fondo crema (igual al de su web de masaje), "La intención" en oscuro, Playfair en títulos.
## Tipografía

Fraunces (títulos) y Karla (cuerpo) desde 2026-09-16. Ojo: **sí están cargadas**, vía `@import`
en la línea 4 de `styles.css` — el brief dice que no, y es incorrecto. Lo que sí
conviene es moverlas a `<link>` con `preconnect` en el `<head>`, porque el
`@import` serializa la descarga y penaliza el LCP.

Columna de lectura 60-65 caracteres, alineada a la izquierda. Nunca párrafos
centrados anchos.

## El vídeo

Original: `IMG_2323.MOV` (HEVC, 55 s, 94 MB). **Es vertical**: el stream es
1920x1080 con `rotation=-90`, así que se muestra 1080x1920. Tenerlo en cuenta
antes de asumir un hero horizontal.

## Estado del rediseño

- Fase 1 (vídeo + hero) hecha el 2026-09-14.
- Fase 2 del brief probada y DESCARTADA por Lucía el 2026-09-15 (le pareció caótica; prefiere la estructura actual). No reabrir. De ella solo se publicó: cuadrícula de fotos ampliable en El lugar, "Reserva tu plaza" en granate con botón crema, favicon círculo fucsia.
- Pendientes: Fase 3 (OG, JSON-LD, legales, WebP/srcset, Lighthouse), Fase 4 (enlaces a webs personales, Instagram).
- Favicon: círculo fucsia (decidido 2026-09-15).
- Capturas: el panel del navegador reduce los viewports mayores de ~800 px; para escritorio legible usar 1024 px y comprobar 1440 solo por métricas.

## Datos que faltan

- Instagram de las dos (para el pie).
- Datos legales: nombre completo, NIF o datos de contacto, email (aviso legal y
  política de privacidad son obligatorios porque el formulario recoge datos).

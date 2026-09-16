# Tribu Conecta — reglas del proyecto

Web de los retiros de mujeres de Margarita Margenat y Lucía Echenique.
En producción: https://www.tribuconecta.site (Vercel, deploy automático al push).

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

## Paleta (definitiva, 2026-09-16)

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

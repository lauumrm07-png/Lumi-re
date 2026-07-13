# LUMINA — Guía para abrirla al público

*Cómo pasar de "página cerrada" a un sitio real donde la gente pueda entrar, registrarse y subir su arte. Explicado sin tecnicismos.*

---

## La idea en una imagen

Abrir LUMINA online es como abrir una tienda física. Necesitas cinco cosas:

1. **Una copia maestra de la tienda** guardada a salvo → *GitHub*
2. **Una bodega donde se guarda todo** (usuarios, obras) → *MongoDB Atlas*
3. **Un álbum de fotos** para que las imágenes no se pierdan → *Cloudinary* (✅ ya lo tienes)
4. **El local con dirección pública** donde la gente entra → *Render*
5. **Una caja registradora** para cobrar → *Stripe* (⏳ esto es para después)

La buena noticia: todo esto se puede empezar **gratis**, y no tienes que hacerlo sola. Yo puedo preparar el código y la configuración; tú solo creas las cuentas (que van a tu nombre).

---

## Paso 1 — Guardar una copia maestra (GitHub)

**Qué es:** GitHub es como una caja fuerte en la nube donde vive la versión oficial de tu código. El "local" (Render) lee de ahí para saber qué mostrar.

**Por qué:** sin esto, tu página solo existe en tu computador. Si se daña, se pierde todo.

**Qué haces tú:** crear una cuenta gratis en github.com.
**Qué hago yo:** subir tu proyecto ahí y dejar afuera las cosas secretas (tus contraseñas y llaves nunca deben quedar públicas).

> ⚠️ Importante: tu archivo `.env` tiene llaves secretas (Cloudinary, base de datos). Ese archivo **nunca** se sube público. Yo me encargo de que quede protegido.

---

## Paso 2 — La bodega de datos (MongoDB Atlas)

**Qué es:** el lugar donde se guardan de forma permanente los usuarios, las obras, las mentorías. Se llama base de datos.

**Por qué:** ahora mismo, si el servidor se reinicia, los datos se borran (usa una bodega "temporal"). Para algo real necesitas una bodega de verdad.

**Qué haces tú:** crear cuenta gratis en mongodb.com/atlas y crear un "cluster" gratuito (el plan **M0**, gratis para siempre, 512 MB — suficiente para arrancar).
**Qué hago yo:** te digo exactamente dónde hacer clic, y conecto ese dato con tu app.

---

## Paso 3 — El álbum de fotos (Cloudinary) ✅ ya lo tienes

**Qué es:** donde viven las imágenes que la gente sube.

**Por qué importa:** los servidores baratos "olvidan" los archivos cada vez que se actualizan. Cloudinary guarda las fotos aparte para que no desaparezcan.

**Estado:** tu proyecto ya tiene una cuenta de Cloudinary configurada. Solo hay que confirmar que sigue activa. **Nada que hacer por ahora.**

---

## Paso 4 — Abrir el local al público (Render)

**Qué es:** Render toma tu código de GitHub y lo pone online con una dirección web pública (algo como `lumina.onrender.com`) que cualquiera puede visitar.

**Por qué:** este es *el* paso que hace que LUMINA deje de estar cerrada. Aquí nace la puerta.

**Qué haces tú:** crear cuenta gratis en render.com y conectarla a tu GitHub.
**Qué hago yo:** dejar el proyecto listo para que Render lo entienda, y guiarte para pegar las llaves secretas en su lugar seguro.

> 💡 El plan gratis de Render "se duerme" si nadie entra en un rato: la primera visita después puede tardar ~1 minuto en cargar. Para empezar está perfecto; se puede mejorar por unos pocos dólares al mes cuando haya movimiento.

---

## Paso 5 — Conectar tu landing bonita con la app

Ahora mismo tienes dos "puertas" separadas: la **landing elegante** (tu cara pública) y la **app funcional**. Hay que unirlas: que el botón *"Únete"* de la landing lleve a la gente a registrarse en la app.

**Qué hago yo:** esto es puro código, lo dejo conectado por ti.

---

## Paso 6 — La caja registradora (Stripe) — para después

**Cuándo:** solo cuando quieras empezar a cobrar mentorías o vender productos. **No es necesario para abrir la comunidad.**

Esto encaja con tu filosofía: **primero la comunidad, el dinero después.** Puedes lanzar LUMINA, dejar que la gente se registre y suba obra, y activar los pagos más adelante sin rehacer nada.

---

## Paso 7 — Tu nombre propio (dominio) — opcional

En vez de `lumina.onrender.com`, puedes tener `lumina.art` o `lumina.com` (si está libre). Cuesta unos ~10–15 USD al año. Lo dejamos para cuando quieras darle imagen seria.

---

## El orden recomendado

**Para abrir la comunidad (sin cobrar todavía):**
Paso 1 (GitHub) → Paso 2 (base de datos) → Paso 3 (confirmar Cloudinary) → Paso 4 (Render) → Paso 5 (conectar landing).

Con eso, LUMINA está **viva y abierta**. Los pasos 6 y 7 (pagos y dominio) llegan cuando estés lista.

---

## Qué necesito de ti para arrancar

Nada técnico. Solo tu decisión de crear las cuentas (GitHub, MongoDB Atlas, Render) — las tres gratis y a tu nombre. Cuando quieras, empezamos por la primera y te llevo de la mano, clic por clic.

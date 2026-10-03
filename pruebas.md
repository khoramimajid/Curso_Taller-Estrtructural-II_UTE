# Pruebas del sitio

**Sitio:** Taller estructural II: Estructuras metálicas (UTE, 2026-II)
**Versión de datos:** `silabo.json` 5.0.0 (sílabo versión 3; clases lunes y miércoles, de 16:00 a 18:00, Aula A03)
**Pruebas locales:** 29 de septiembre de 2026 (repetidas con la versión 3 del sílabo), navegador Chromium automatizado, sitio servido por HTTP local

Para probar el sitio como si fuera otro día, agregue `?hoy=AAAA-MM-DD` a la dirección, por ejemplo `index.html?hoy=2026-11-26`. El pie de página avisa cuando la vista usa una fecha de prueba.

## Pruebas de aceptación

| Prueba | Resultado esperado | Resultado | Estado |
|---|---|---|---|
| Teléfono de 375 px | Cronograma legible sin desplazamiento lateral; tres tareas en dos toques | Ancho de página = 375 px. Los tres accesos (Cronograma, Lecturas, Contacto) se ven sin desplazarse, en una sola línea | Pasa |
| Otras anchuras | Sin desplazamiento lateral | 320, 768 y 1280 px: el ancho de página es igual al de la ventana | Pasa |
| Solo teclado | Todo alcanzable en orden lógico | Orden: Saltar al contenido → Cronograma → Lecturas → Contacto → Ver la sesión → Ver la evaluación → Niveles de IA → Unidades. Enter abre y cierra cada unidad. El foco es visible (contorno azul de 3 px) | Pasa |
| Texto al 200 % | Sin solapamientos | Con todas las unidades y políticas abiertas: ancho = 375 px y ningún elemento sale de la pantalla (la tabla de ponderación tiene su propio desplazamiento) | Pasa |
| Enlaces internos | Llevan al destino y abren la unidad plegada | «Ver qué entra en la sesión 6» abre la Unidad 2, que estaba cerrada, y deja la sesión arriba de la pantalla | Pasa |
| Enlaces externos | Ninguno roto | La Biblioteca UTE y WhatsApp no se pudieron comprobar desde el entorno de pruebas (red bloqueada) | **Pendiente**: comprobar a mano tras publicar |
| Etiqueta de acceso | Cada lectura con su etiqueta | 6 de 6 recursos con etiqueta (3 «Biblioteca UTE», 2 «Acceso abierto», 1 «Acceso por confirmar»); ningún enlace vencido publicado | Pasa, con observación O2 |
| Revisión contra el sílabo | Ninguna política parafraseada ni fecha distinta | Ver `revision_silabo.md`: 32/32 fechas, 141 de 149 textos literales y los demás explicados | Pasa, con 1 decisión pendiente |
| Lista de tareas | Aviso visible de que no equivale a entregar | Aviso encima de la lista. Marcas guardadas tras recargar; «Borrar mis marcas» pide confirmación y deja 0 de 31 | Pasa |
| Abrir con doble clic (`file://`) | Mensaje claro, no una página vacía | Aparece el aviso que explica cómo abrir el sitio desde GitHub Pages | Pasa |
| Modo oscuro | Legible | Colores redefinidos; el acento minio se aclara para mantener el contraste | Pasa |
| Publicación | Dirección pública comprobada desde otro dispositivo, con imágenes | Aún no publicado | **Pendiente** (paso 5) |

## Próxima actividad según la fecha

| Fecha simulada | Próxima actividad mostrada | Próxima evaluación mostrada |
|---|---|---|
| 01/10/2026 (antes del curso) | Lunes, 5 de octubre de 2026: sesión 1 | Miércoles, 21 de octubre: prueba de la Unidad 1 |
| 21/10/2026 a las 14:30 | Sesión 6, «Empieza en 1 h 30 min» | «Es hoy»: prueba de la Unidad 1 |
| 21/10/2026 a las 17:00 | Sesión 6, «En curso hasta las 18:00» | (igual) |
| 21/10/2026 a las 18:30 | La clase de hoy terminó: muestra el lunes 26 de octubre (sesión 7) | Lunes, 9 de noviembre: prueba de la Unidad 2 |
| 20/02/2027 (después del semestre) | «Cierre del período: el semestre terminó» | «No quedan evaluaciones en el cronograma» |

## Registro de asistencia (versión 3.1)

Probado en Chromium, con la lista del curso (22 estudiantes, cargada solo en el navegador de prueba) y una cámara simulada. Este archivo no incluye nombres de estudiantes.

| Prueba | Resultado |
|---|---|
| Pegar la lista tal como la envió el docente (número, tabulador, «APELLIDO/APELLIDO, NOMBRES») | 22 estudiantes; «/» convertido en espacio; orden por número |
| Orden en pantalla (laptop) | 1 a 11 en la columna izquierda y 12 a 22 en la derecha |
| Tocar un nombre | Presente y hora; otro toque, falta |
| Marcar por número | «7» y Enter marca al estudiante número 7; «99» avisa que no existe; el cursor queda listo |
| QR con el nombre incompleto y sin tildes (solo un nombre y un apellido) | Reconocidos como los estudiantes 1 y 5 de la lista |
| QR ambiguo (un apellido que comparten dos estudiantes) | Ofrece elegir entre el 20 y el 21; queda en «Por resolver» si llega otro estudiante |
| QR de alguien que no está en la lista | Queda en «Por resolver», con opción de asignarlo o quitarlo |
| El mismo estudiante con otro nombre en el QR pero el mismo código | Reconocido por el código aprendido: «Ya estaba presente» |
| Excel de la sesión | Nombre `Asistencia_PROF00820_S06_2026-10-22.xlsx`; hojas «Sesión 6» y «Semestre»; los presentes coinciden con la pantalla |
| Fórmulas del Excel | 70 fórmulas recalculadas por LibreOffice: cero errores y cero diferencias con los valores del sitio; todo en Arial |
| Porcentaje | Calculado sobre los 22 de la lista; los que no están en la lista aparecen aparte |
| Enviar con Compartir (Windows) | Se comparte el archivo .xlsx real (27 KB) con asunto y resumen |
| Enviar sin Compartir | Se descarga el Excel y se abre un correo a majid.khorami@ute.edu.ec con asunto y resumen |
| Aviso de envío | «Aún no envió…» antes; «Excel enviado… a las…» después; vuelve a avisar si hay cambios |
| Modo clase en otra pestaña | El botón abre `registro.html?sesion=6` en una pestaña nueva; el contador se actualiza solo al marcar en el registro |
| Persistencia | Tras recargar, la asistencia sigue |
| Anchos de 320 a 1280 px, texto al 200 % | Sin desplazamiento lateral, incluso con «Más opciones» abierto |

## Diseño y tutorías (versión 4.0)

| Prueba | Resultado |
|---|---|
| Fechas de las 32 sesiones | Iguales, una por una, al sílabo aprobado (15 lunes y 17 miércoles) |
| Franja de imágenes | Cambia cada segundo; «Pausar imágenes» la detiene; con «reducir movimiento» del sistema empieza en pausa |
| Fecha y hora de la barra superior | En hora de Ecuador; se actualizan solas |
| Contraste | Texto blanco sobre azul #2B63A2: 6,2:1. Sobre verde #3B984A: 3,6:1, por eso los botones verdes usan texto grande y en negrita (cumple el nivel AA para texto grande) |
| Colores con significado | Falta en rojo, presente en verde, evaluaciones en ámbar, acciones principales en azul |
| Contacto | WhatsApp abre `wa.me/593992690055` con un saludo listo; Llamar abre `tel:+593992690055`; Correo abre el correo institucional |
| Formulario de tutoría | Valida nombre, apellidos, correo, tema (mínimo 10 caracteres) y turno; los errores desaparecen al corregir |
| Fechas de tutoría | Solo viernes con 2 días de anticipación; el 9/10, el 27/11, el 25/12 y el 01/01 aparecen bloqueados |
| Correo de solicitud | Dirigido al docente, con copia al estudiante, con asunto y cuerpo completos |
| Google Calendar | 10:15 a 10:30 de Ecuador (15:15 a 15:30 UTC); invitados: docente y estudiante |
| Archivo .ics | Hora correcta, el docente como asistente, recordatorios a 1 día y a 30 minutos; líneas con fin CRLF, como exige el formato |
| Ponderación | Barra 35/35/30 y tres tarjetas con anillo; la tabla original sigue disponible en «Ver como tabla» |
| Anchos de 320 a 1280 px y texto al 200 % | Sin desplazamiento lateral |

## Versión 5.0

| Prueba | Resultado |
|---|---|
| Franja de fotos | Tres paneles en pantallas anchas (fotos 1-2-3, que pasan a 4-5-6 a los 3 segundos); un panel en el celular; «Pausar fotos» funciona |
| Logo, fecha y hora | Logo de la UTE más grande; fecha y hora en una pastilla verde |
| Botón de Moodle | Abre https://lms.ute.edu.ec/login/ en una pestaña nueva |
| Botón de evaluaciones | Muestra las 10 evaluaciones con su fecha y los días que faltan |
| Entregas | La tarea de la sesión 2 vence el lunes 12/10 a las 15:00 (antes de la sesión 3); la de la sesión 32, «sin fecha (fin del período)»; estados «Vence hoy» y «Plazo vencido» correctos |
| Contacto | WhatsApp y el chat grupal en verde con el logo de WhatsApp enviado por el docente; «Correo (Outlook)» abre `outlook.office.com/mail/deeplink/compose` |
| Descripción y evaluación | La sección se titula «Descripción y objetivo del curso»; la ponderación, «EVALUACIÓN DE LA ASIGNATURA O MÓDULO»; ACD, APE y AA con la sigla en un recuadro y el nombre en negrita |
| QR del estudiante | Solo nombres y apellidos; el QR lleva también la fecha y la hora; la imagen guardada incluye los datos; leído de vuelta, idéntico |
| Registro con el QR nuevo | Reconoce por nombre a los estudiantes 1, 5 y 21; avisa en amarillo un QR de otro día; quien no está en la lista queda «Por resolver»; el QR del formato anterior se sigue leyendo |
| Anchos de 320 a 1280 px y texto al 200 % | Sin desplazamiento lateral |

## Versión 5.1

| Prueba | Resultado |
|---|---|
| «Ver/Ocultar fechas de evaluaciones» | Abre y cierra (antes no se cerraba: el estilo de la lista anulaba el atributo `hidden`; corregido para todo el sitio) |
| Descripción y objetivo | Mismo tamaño que el resto del texto (título 25 px, texto 17 px); descripción en cuadro azul y objetivo en cuadro verde |
| ACD, APE y AA | La sigla queda en su recuadro y al lado solo el nombre en negrita |
| Registro | Sin «Marcar por número»; cada fila muestra número, nombres, apellidos y ✓ verde o ✗ roja |
| Tomar foto del QR | Una foto del QR generado por el estudiante lo marca presente; una foto sin QR muestra un aviso claro |
| Lista en la página privada del docente | Ya cargada con los 22 estudiantes; no aparece en la página de estudiantes ni en el sitio de GitHub |

## Pruebas manuales tras publicar

- [ ] Abrir la dirección pública desde un teléfono con datos móviles (no con el wifi de la UTE) y hacer una captura.
- [ ] Tocar «Buscar en la Biblioteca UTE», el enlace de la NEC en el portal del MIDUVI y el de WhatsApp, y confirmar que abren.
- [ ] Prueba del colega: pedirle que encuentre el código de biblioteca del libro de McCormac, la fecha del Examen Parcial 1 y cómo reservar tutoría. Meta: menos de un minuto para las tres.
- [ ] Asistencia real: con dos estudiantes, crear el QR desde asistencia.html en sus teléfonos y escanearlo con la cámara de la laptop (la luz del aula y la cámara real son distintas de la prueba simulada).
- [ ] En la laptop de clase, pulsar «Enviar Excel a mi correo» y confirmar que el panel Compartir de Windows ofrece Outlook o Correo con el archivo adjunto.
- [ ] Con el lector de pantalla del teléfono (VoiceOver o TalkBack), recorrer el rótulo de «Próxima actividad».

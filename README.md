# Taller estructural II: Estructuras metálicas

Todos los archivos van juntos en la raíz del repositorio, sin carpetas.

Sitio del curso PROF00820 (Universidad UTE, período 2026-II). Tiene tres páginas:

| Página | Para quién | Qué hace |
|---|---|---|
| `index.html` | Estudiantes | Logo de la UTE, fecha y hora, franja con tres ilustraciones que cambian cada segundo, próxima actividad (con «empieza en…» o «en curso»), línea del semestre, cronograma, lecturas, contacto con el docente (WhatsApp, teléfono y correo), **reserva de tutorías**, ponderación de la evaluación y lista personal de tareas |
| `asistencia.html` | Estudiantes | Cada estudiante escribe sus **nombres y apellidos completos** y genera su QR de asistencia, que lleva también la **fecha y la hora** en que lo generó; esos datos se ven debajo del código |
| `clase.html` | Docente | **Modo clase** en la laptop o el proyector: sesión del día, temporizador y avance del semestre |
| `registro.html` | Docente | **Registro de asistencia** en una pestaña aparte: la lista con número, nombres y apellidos (✓ verde presente, ✗ roja falta), marcar tocando o escaneando QR (cámara en vivo o foto) y enviar el Excel de cada sesión a su correo |

Este sitio **complementa** el Aula Virtual (Moodle). No recibe entregas ni registra calificaciones, y el registro oficial de asistencia sigue siendo el de la Universidad UTE.

## Cómo registrar la asistencia

**Una sola vez, al inicio del semestre**

1. Abra `registro.html` en la laptop que usará en clase (Chrome o Edge, desde la dirección https de GitHub Pages).
2. Pegue la lista del curso, un estudiante por línea con su número (por ejemplo `1	PÉREZ/LÓPEZ, ANA MARÍA`, con nombres ficticios en este ejemplo), o cargue el archivo `lista_PROF00820_2026-2.csv`. Pulse **Guardar la lista**. La lista queda **solo en ese navegador**: no se sube a internet ni va en este repositorio.
3. Si usará QR, envíe por WhatsApp el enlace `https://SU-USUARIO.github.io/taller-estructural-ii/asistencia.html`. En cada clase, el estudiante pulsa «Generar mi código»: sus nombres quedan guardados en el teléfono y el QR lleva la fecha y la hora del momento.

**En cada clase**

1. En el modo clase, pulse **Registrar asistencia**: se abre el registro de la sesión del día en una pestaña nueva.
2. Marque a los presentes de cualquiera de estas formas (se pueden combinar):
   - **Tocando al estudiante:** ✓ verde es presente; otro toque lo quita (✗ roja, falta).
   - **Marcar todos presentes** y luego tocar a quien no vino.
   - **Escanear QR:** se abre la cámara en vivo (en GitHub Pages). Si la cámara no se enciende, como ocurre dentro del visor de Claude, use **Tomar foto del QR**: en el celular abre la cámara del teléfono y el registro lee la foto. Con la cámara en vivo, cada estudiante acerca su teléfono y aparece su número y nombre con un tono. El sitio reconoce el nombre aunque el estudiante lo haya escrito incompleto o sin tildes, y **le avisa en amarillo si el código no se generó hoy** (por ejemplo, la captura de un compañero). Si hay dudas (por ejemplo, dos estudiantes con el mismo apellido), le pregunta a usted, y el caso queda en **Por resolver** para decidir después, sin frenar la fila. Después de la primera vez, cada QR se reconoce solo por su código.
3. Compare el nombre de la pantalla con la persona que tiene delante.
4. **Al terminar, pulse «Enviar Excel a mi correo».**
   - En Windows se abre el panel **Compartir** con el Excel ya adjunto: elija Outlook o Correo y envíelo a su dirección.
   - Si su navegador no tiene esa opción, el Excel se descarga y se abre un correo listo, dirigido a majid.khorami@ute.edu.ec: solo arrastre el archivo descargado al correo.
   - El registro muestra «Aún no envió el Excel de esta sesión» hasta que lo haga, y lo avisa de nuevo si cambia algo después.

Una página web publicada en GitHub Pages no puede enviar correos por sí sola sin un servidor; por eso el envío pasa por su programa de correo, en un solo paso.

**El Excel de cada sesión** (`Asistencia_PROF00820_S06_2026-10-22.xlsx`) tiene dos hojas:
- **Sesión:** los 22 estudiantes en orden de lista, con Presente o Falta, hora y forma de registro (QR o manual), más presentes, faltas y porcentaje calculados con fórmulas de Excel.
- **Semestre:** una columna P/F por cada sesión registrada, con asistencias, sesiones y porcentaje de cada estudiante, y los presentes por sesión.

**Importante sobre los datos**

- La lista y la asistencia se guardan **solo en el navegador de la laptop** donde se registran. Si se borran los datos de ese navegador, se pierde lo no enviado.
- Para cambiar de computadora, use **Más opciones → Descargar respaldo completo** y luego **Restaurar un respaldo** en la nueva. Restaurar no duplica registros.
- La asistencia es un dato personal de los estudiantes: guarde los Excel según la normativa de la UTE y no los suba a este repositorio. El registro oficial de asistencia sigue siendo el de la Universidad UTE.

## Fotos, entregas y enlaces

- **Franja de fotos:** `foto-1.jpg` a `foto-7.jpg` (fotos del docente, recortadas y comprimidas). Se muestran tres a la vez en pantallas anchas y una en el celular, y cambian cada 3 segundos; el botón «Pausar fotos» las detiene. Para cambiar una foto, reemplace el archivo con el mismo nombre.
- **Entrega del trabajo autónomo:** siempre en la siguiente clase, una hora antes de que empiece (15:00). Se calcula sola con el cronograma; cada tarea muestra «Vence hoy», «Faltan N días» o «Plazo vencido».
- **Aula Virtual (Moodle):** botón azul debajo de «Mi código QR de asistencia», que abre https://lms.ute.edu.ec/login/.
- **Correo:** el botón «Correo (Outlook)» y el envío de solicitudes de tutoría abren Outlook en la web (correo UTE) con el mensaje listo.

## Reserva de tutorías

En **Contacto y tutorías**, el botón **Reservar una tutoría** abre un formulario: nombres, apellidos, correo, tema de consulta, fecha (los viernes disponibles, con al menos 2 días de anticipación; los feriados y el 27/11 aparecen bloqueados) y turno de 15 minutos entre las 10:00 y las 11:00.

Al continuar, el estudiante:
1. **Envía la solicitud por correo** al docente, con copia para él, y el mensaje ya redactado.
2. **Agrega la cita a su calendario** con Outlook, Google Calendar o un archivo .ics. En Google y en el .ics el docente va como invitado, con recordatorios un día antes y 30 minutos antes.
3. Si es urgente, **avisa por WhatsApp** con un mensaje listo.

La página no puede enviar correos ni ver la agenda del docente por sí sola (no tiene servidor): la tutoría queda confirmada cuando el docente responde. Si dos estudiantes eligen el mismo turno, el docente lo resuelve al confirmar. Para cambiar días u horarios, edite `tutorias` en `silabo.json` (`inicio`, `fin`, `turno_minutos`, `anticipacion_dias`, `no_disponible`).

## Cómo actualizar una fecha, un tema o un enlace

Todo el contenido del curso está en `silabo.json`. El diseño (los archivos `.html`, `.css` y `.js`) no se toca durante el semestre.

1. En GitHub, abra `silabo.json` y pulse el ícono del lápiz (Edit this file).
2. Cambie solo el texto entre comillas. Por ejemplo, para mover la visita de obra, busque `"2026-11-27"` en la sección `eventos` y escriba la nueva fecha con el mismo formato (año-mes-día).
3. Actualice también `"actualizado"` con la fecha de hoy.
4. Pulse **Commit changes**. El sitio se actualiza solo en uno o dos minutos.

Si la página dice que no pudo leer el cronograma, probablemente falta una coma o unas comillas en el último cambio.

## Probar otra fecha

Agregue `?hoy=AAAA-MM-DD` a la dirección de `index.html`, `clase.html` o `registro.html`, por ejemplo `registro.html?hoy=2026-11-19`.

## Privacidad

El repositorio es público: todo lo que se sube aquí, incluido su historial, lo puede ver cualquiera. El sitio no envía datos a ningún servidor. Las bibliotecas de QR están incluidas en `` (ver `LICENCIAS.md`) y no se cargan de internet. El Excel se genera en el propio navegador con `xlsx-mini.js`, sin servicios externos.

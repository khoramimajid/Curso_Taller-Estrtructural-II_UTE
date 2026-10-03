/* Página del estudiante: genera su QR con nombres, apellidos, fecha y hora. Todo ocurre en el teléfono. */
(function () {
  "use strict";
  var Q = window.QRAsistencia;
  var CLAVE = "te2-2026-2:mi-codigo";
  var ZONA = "America/Guayaquil";
  var st = Q.almacen();
  var $ = function (id) { return document.getElementById(id); };

  if (typeof window.qrcode !== "function") {
    $("error-qr").hidden = false;
    $("error-qr").textContent = "No se pudo cargar el generador de códigos. Recarga la página; si sigue igual, avisa al docente.";
    return;
  }
  window.qrcode.stringToBytes = window.qrcode.stringToBytesFuncs["UTF-8"];

  function leer() { if (!st) return null; try { return JSON.parse(st.getItem(CLAVE) || "null"); } catch (e) { return null; } }
  function guardar(d) { if (!st) return; try { st.setItem(CLAVE, JSON.stringify(d)); } catch (e) {} }
  function textoFecha(iso) {
    var d = new Date(iso);
    var f = new Intl.DateTimeFormat("es-EC", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: ZONA }).format(d);
    var h = new Intl.DateTimeFormat("es-EC", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: ZONA }).format(d);
    return f.charAt(0).toUpperCase() + f.slice(1) + ", " + h;
  }
  function esDeHoy(iso) {
    var f = function (d) { return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA }).format(d); };
    return iso && f(new Date(iso)) === f(new Date());
  }

  // Dibuja el QR y, debajo, los datos (así la imagen guardada también los muestra)
  function dibujar(canvas, d, conTexto) {
    var q = window.qrcode(0, "M");
    q.addData(Q.codificar(d.nombres, d.apellidos, d.generado), "Byte"); q.make();
    var n = q.getModuleCount(), margen = 4, esc = window.devicePixelRatio || 1;
    var lado = Math.min(window.innerWidth - 48, 340);
    var celda = Math.max(2, Math.floor((lado * esc) / (n + margen * 2)));
    var ancho = celda * (n + margen * 2);
    var lineas = conTexto ? [d.apellidos.toUpperCase(), d.nombres, textoFecha(d.generado)] : [];
    var fs = Math.round(ancho * 0.052), alto = ancho + (lineas.length ? Math.round(fs * 1.5) * lineas.length + fs : 0);
    canvas.width = ancho; canvas.height = alto;
    canvas.style.width = Math.round(ancho / esc) + "px"; canvas.style.height = Math.round(alto / esc) + "px";
    var c = canvas.getContext("2d");
    c.fillStyle = "#ffffff"; c.fillRect(0, 0, ancho, alto);
    c.fillStyle = "#000000";
    for (var r = 0; r < n; r++) for (var k = 0; k < n; k++) if (q.isDark(r, k)) c.fillRect((k + margen) * celda, (r + margen) * celda, celda, celda);
    c.textAlign = "center"; c.fillStyle = "#1d2830";
    lineas.forEach(function (t, i) {
      c.font = (i === 0 ? "700 " : i === 2 ? "600 " : "400 ") + Math.round(fs * (i === 2 ? 0.85 : 1)) + "px Arial, sans-serif";
      if (i === 2) c.fillStyle = "#2B63A2";
      c.fillText(t, ancho / 2, ancho - celda * 2 + Math.round(fs * 1.5) * (i + 1), ancho - celda * 4);
    });
  }

  function mostrarQR(d) {
    $("paso-datos").hidden = true; $("paso-qr").hidden = false;
    $("qr-apellidos").textContent = d.apellidos; $("qr-nombres").textContent = d.nombres;
    $("qr-generado").textContent = textoFecha(d.generado) + (esDeHoy(d.generado) ? " (hoy)" : " (no es de hoy: genera uno nuevo)");
    $("qr-generado").className = esDeHoy(d.generado) ? "" : "qr-viejo";
    $("qr").setAttribute("aria-label", "Código QR de asistencia de " + d.nombres + " " + d.apellidos + ", generado el " + textoFecha(d.generado));
    dibujar($("qr"), d);
  }
  function mostrarForm(d) {
    $("paso-qr").hidden = true; $("paso-datos").hidden = false;
    if (d) { $("nombres").value = d.nombres || (d.nombre ? d.nombre : ""); $("apellidos").value = d.apellidos || ""; }
    (d && d.nombres ? $("form-datos").querySelector("button[type=submit]") : $("nombres")).focus();
  }
  function generar(nombres, apellidos) {
    var d = { nombres: nombres, apellidos: apellidos, generado: Q.ahoraEcuador() };
    guardar(d); mostrarQR(d);
  }

  $("form-datos").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var v = Q.validar($("nombres").value, $("apellidos").value);
    $("nombres-error").textContent = v.errores.nombres || "";
    $("apellidos-error").textContent = v.errores.apellidos || "";
    $("nombres").setAttribute("aria-invalid", v.errores.nombres ? "true" : "false");
    $("apellidos").setAttribute("aria-invalid", v.errores.apellidos ? "true" : "false");
    if (!v.ok) { (v.errores.nombres ? $("nombres") : $("apellidos")).focus(); return; }
    generar(v.nombres, v.apellidos);
  });
  ["nombres", "apellidos"].forEach(function (k) { $(k).addEventListener("input", function () { $(k + "-error").textContent = ""; $(k).setAttribute("aria-invalid", "false"); }); });
  $("regenerar").addEventListener("click", function () { var d = leer(); if (d && d.nombres) generar(d.nombres, d.apellidos); });
  $("cambiar").addEventListener("click", function () { mostrarForm(leer()); });
  $("descargar").addEventListener("click", function () {
    var d = leer() || {};
    var nombre = "asistencia-" + Q.normal((d.apellidos || "") + " " + (d.nombres || "")).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".png";
    var lienzo = document.createElement("canvas");
    dibujar(lienzo, d, true);
    lienzo.toBlob(function (blob) { if (blob) window.guardarArchivo(nombre, blob); }, "image/png");
  });
  var redibujo;
  window.addEventListener("resize", function () { clearTimeout(redibujo); redibujo = setTimeout(function () { var d = leer(); if (d && d.nombres && !$("paso-qr").hidden) mostrarQR(d); }, 200); });

  var d = leer();
  if (d && d.nombres && d.generado && esDeHoy(d.generado)) mostrarQR(d);
  else mostrarForm(d);
})();

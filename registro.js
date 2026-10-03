/* Registro de asistencia (pestaña aparte).
   La lista del curso y la asistencia se guardan SOLO en este navegador.
   Para probar otra fecha: registro.html?hoy=2026-10-22   Para abrir una sesión: registro.html?sesion=6 */
(function () {
  "use strict";
  var ZONA = "America/Guayaquil";
  var CLAVE = "te2-2026-2:asistencia-docente";
  var Q = window.QRAsistencia;
  var st = Q.almacen();
  var $ = function (id) { return document.getElementById(id); };
  var D = null, sel = null, hoy = null;

  // ---------- utilidades ----------
  function h(tag, attrs, hijos) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "class") n.className = v; else if (k === "text") n.textContent = v;
      else n.setAttribute(k, v === true ? "" : v);
    });
    (hijos || []).forEach(function (c) { if (c !== null && c !== undefined && c !== false) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }
  function hoyISO() {
    var p = new URLSearchParams(location.search).get("hoy");
    if (p && /^\d{4}-\d{2}-\d{2}$/.test(p)) return p;
    return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  }
  function aFecha(iso) { return new Date(iso + "T12:00:00-05:00"); }
  function fecha(iso, corta, enFrase) {
    var o = corta ? { weekday: "short", day: "numeric", month: "short", timeZone: ZONA } : { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: ZONA };
    var t = new Intl.DateTimeFormat("es-EC", o).format(aFecha(iso));
    return enFrase ? t : t.charAt(0).toUpperCase() + t.slice(1);
  }
  function hora(iso) { return new Intl.DateTimeFormat("es-EC", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: ZONA }).format(new Date(iso)); }
  function ahoraTexto() {
    var d = new Date();
    return new Intl.DateTimeFormat("es-EC", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: ZONA }).format(d) + " a las " + hora(d.toISOString());
  }
  function pad2(n) { return String(n).padStart(2, "0"); }
  function titulo(s) { return String(s || "").toLocaleLowerCase("es").replace(/(^|[\s-])(\p{L})/gu, function (m, a, b) { return a + b.toLocaleUpperCase("es"); }); }
  function partesNombre(n) {
    var p = String(n || "").split(",");
    return p.length > 1 ? { apellidos: titulo(p[0].trim()), nombres: titulo(p.slice(1).join(",").trim()) } : { apellidos: "", nombres: titulo(n) };
  }
  function fichas(s) { return Q.normal(s).replace(/[^a-z0-9ñ ]/g, " ").split(" ").filter(function (x) { return x.length > 1; }); }

  // ---------- sonido ----------
  var audio = null;
  function tono(frecs, dur) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      var t = audio.currentTime;
      frecs.forEach(function (f, i) {
        var o = audio.createOscillator(), g = audio.createGain();
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t + i * dur);
        g.gain.exponentialRampToValueAtTime(0.25, t + i * dur + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + (i + 1) * dur);
        o.connect(g); g.connect(audio.destination); o.start(t + i * dur); o.stop(t + (i + 1) * dur + 0.02);
      });
    } catch (e) {}
  }
  var SONIDO = { ok: function () { tono([880, 1320], 0.09); }, repetido: function () { tono([660], 0.12); }, error: function () { tono([300, 220], 0.14); } };

  // ---------- almacenamiento ----------
  function vacio() { return { version: 2, lista: [], sesiones: {}, correo: null, ultimoCambio: null }; }
  function leer() {
    if (!st) return vacio();
    try { var d = JSON.parse(st.getItem(CLAVE) || "null"); if (!d || !d.sesiones) return vacio(); d.version = 2; d.lista = d.lista || []; return d; }
    catch (e) { return vacio(); }
  }
  var A = leer();
  if (!A.lista.length && Array.isArray(window.LISTA_PREDETERMINADA) && window.LISTA_PREDETERMINADA.length) {
    A.lista = window.LISTA_PREDETERMINADA.map(function (e) { return { numero: e.numero, nombre: Q.limpiarNombre(String(e.nombre).replace(/\//g, " ")), codigo: null }; });
  }
  function guardar(cambio) {
    if (cambio) { A.ultimoCambio = new Date().toISOString(); var s = A.sesiones[String(sel.n)]; if (s) s.modificado = A.ultimoCambio; }
    if (!st) return;
    try { st.setItem(CLAVE, JSON.stringify(A)); } catch (e) { alert("No se pudo guardar en este navegador. Descargue el Excel ahora para no perder la asistencia."); }
  }
  // Si el modo clase u otra pestaña cambia los datos, recargar
  window.addEventListener("storage", function (e) { if (e.key === CLAVE) { A = leer(); pintar(); } });

  function ses(n) { var k = String(n); if (!A.sesiones[k]) A.sesiones[k] = { fecha: sesionPorN(n).fecha, registros: [] }; return A.sesiones[k]; }
  function regs(n) { var s = A.sesiones[String(n)]; return s ? s.registros : []; }
  function sesionPorN(n) { for (var i = 0; i < D.sesiones.length; i++) if (D.sesiones[i].n === n) return D.sesiones[i]; return null; }
  function regDe(n, e) { var r = regs(n); for (var i = 0; i < r.length; i++) if (r[i].numero === e.numero) return r[i]; return null; }
  function fueraDeLista(n) { return regs(n).filter(function (r) { return r.numero === null || r.numero === undefined; }); }

  function marcar(e, modo, codigo, nombreQR) {
    var s = ses(sel.n);
    if (regDe(sel.n, e)) return { estado: "repetido", reg: regDe(sel.n, e) };
    var r = { numero: e.numero, codigo: codigo || e.codigo || null, nombre: e.nombre, nombreQR: nombreQR || null, hora: new Date().toISOString(), modo: modo };
    s.registros.push(r); guardar(true);
    return { estado: "nuevo", reg: r };
  }
  function desmarcar(e) {
    var s = A.sesiones[String(sel.n)]; if (!s) return;
    s.registros = s.registros.filter(function (r) { return r.numero !== e.numero; }); guardar(true);
  }

  // ---------- lista del curso ----------
  function limpiarNombreLista(s) { return Q.limpiarNombre(String(s || "").replace(/\//g, " ")); }
  function leerTextoLista(texto) {
    texto = String(texto || "").replace(/^\uFEFF/, "");
    var lineas = texto.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
    if (!lineas.length) return { error: "No hay ningún nombre." };
    var sep = /;/.test(lineas[0]) ? ";" : null;
    var cab = sep ? lineas[0].split(sep).map(Q.normal) : [];
    var lista = [], sig = 1;
    if (sep && cab.some(function (c) { return /nombre|estudiante|apellido/.test(c); })) {
      var iN = cab.findIndex(function (c) { return /^(n|n\.?º|no\.?|num|numero|nro)$/.test(c.replace(/\s/g, "")) || /^numero$/.test(c); });
      var iNom = cab.findIndex(function (c) { return /nombre|estudiante/.test(c); });
      var iApe = cab.findIndex(function (c) { return /apellido/.test(c); });
      var iCod = cab.findIndex(function (c) { return /codigo|numero de id/.test(c); });
      lineas.slice(1).forEach(function (l) {
        var p = l.split(sep);
        var nombre = limpiarNombreLista([iApe !== -1 ? p[iApe] : "", iNom !== -1 ? p[iNom] : ""].join(iApe !== -1 ? ", " : " ").replace(/^, |, $/g, ""));
        if (!nombre) return;
        var num = iN !== -1 ? parseInt(p[iN], 10) : NaN;
        lista.push({ numero: isFinite(num) ? num : sig, nombre: nombre, codigo: iCod !== -1 ? (Q.limpiarCodigo(p[iCod]) || null) : null });
        sig = (isFinite(num) ? num : sig) + 1;
      });
    } else {
      lineas.forEach(function (l) {
        var m = l.match(/^(\d{1,3})[\s.)\-:;,]+(.+)$/);
        var num = m ? parseInt(m[1], 10) : sig;
        var nombre = limpiarNombreLista(m ? m[2] : l);
        if (!nombre || /^(n\.?º|no\.?|numero)\b/i.test(nombre)) return;
        lista.push({ numero: num, nombre: nombre, codigo: null });
        sig = num + 1;
      });
    }
    var vistos = {};
    for (var i = 0; i < lista.length; i++) {
      if (vistos[lista[i].numero]) return { error: "El número " + lista[i].numero + " aparece dos veces en la lista." };
      vistos[lista[i].numero] = 1;
    }
    lista.sort(function (a, b) { return a.numero - b.numero; });
    return { lista: lista };
  }
  function guardarLista(texto) {
    var r = leerTextoLista(texto);
    if (r.error) { alert(r.error); return false; }
    var hay = Object.keys(A.sesiones).some(function (k) { return A.sesiones[k].registros.length; });
    if (A.lista.length && hay && !confirm("Ya hay asistencia registrada con la lista actual. Si los números cambian, las marcas anteriores quedarán asociadas al número antiguo. ¿Reemplazar la lista por la nueva de " + r.lista.length + " estudiantes?")) return false;
    // conservar los códigos QR ya aprendidos
    r.lista.forEach(function (e) { var viejo = A.lista.filter(function (x) { return Q.normal(x.nombre) === Q.normal(e.nombre); })[0]; if (viejo && viejo.codigo && !e.codigo) e.codigo = viejo.codigo; });
    A.lista = r.lista; guardar(false); pintar();
    return true;
  }
  $("guardar-lista").addEventListener("click", function () { if (guardarLista($("pegar-lista").value)) $("pegar-lista").value = ""; });
  $("archivo-lista").addEventListener("change", function (ev) {
    var f = ev.target.files && ev.target.files[0]; if (!f) return;
    var lr = new FileReader(); lr.onload = function () { ev.target.value = ""; guardarLista(String(lr.result)); }; lr.readAsText(f, "utf-8");
  });
  $("cambiar-lista").addEventListener("click", function () { $("sin-lista").hidden = false; $("pegar-lista").focus(); $("sin-lista").scrollIntoView({ block: "start" }); });

  // ---------- pintar ----------
  function pintar() {
    if (!D || !sel) return;
    var r = regs(sel.n);
    var dentro = A.lista.filter(function (e) { return regDe(sel.n, e); }).length;
    var total = A.lista.length;
    $("reg-fecha").textContent = "Sesión " + sel.n + ", " + fecha(sel.fecha, false, true) + (sel.fecha === hoy ? " (hoy)" : "");
    $("cuenta").textContent = String(dentro);
    $("cuenta-de").textContent = total ? " de " + total + " presentes" : " presentes";
    var pct = total ? Math.round(100 * dentro / total) : 0;
    $("barra").setAttribute("aria-valuenow", String(pct)); $("barra").firstElementChild.style.width = pct + "%";
    var s = A.sesiones[String(sel.n)];
    var env = $("estado-envio");
    if (s && s.enviado && (!s.modificado || s.modificado <= s.enviado)) { env.className = "reg__envio reg__envio--ok"; env.textContent = "Excel enviado o descargado a las " + hora(s.enviado) + "."; }
    else if (r.length) { env.className = "reg__envio reg__envio--pendiente"; env.textContent = s && s.enviado ? "Hubo cambios después del último envío: vuelva a enviar el Excel." : "Aún no envió el Excel de esta sesión."; }
    else { env.className = "reg__envio"; env.textContent = ""; }

    $("sin-lista").hidden = !!total;
    var ol = $("lista"); ol.innerHTML = "";
    // en pantallas anchas, dos columnas en orden de lista: 1 a 11 a la izquierda, 12 a 22 a la derecha
    ol.classList.add("alumnos--columnas");
    ol.style.gridTemplateRows = "repeat(" + Math.max(1, Math.ceil(A.lista.length / 2)) + ", auto)";
    A.lista.forEach(function (e) {
      var rg = regDe(sel.n, e);
      var pn = partesNombre(e.nombre);
      var b = h("button", { class: "alumno" + (rg ? " alumno--presente" : ""), type: "button", "aria-pressed": rg ? "true" : "false", id: "al-" + e.numero,
        "aria-label": e.numero + ". " + pn.nombres + " " + pn.apellidos + ": " + (rg ? "presente" : "falta") }, [
        h("span", { class: "alumno__num", text: String(e.numero) }),
        h("span", { class: "alumno__nombres", text: pn.nombres }),
        h("span", { class: "alumno__apellidos", text: pn.apellidos }),
        h("span", { class: "alumno__estado" }, [h("span", { class: "check " + (rg ? "check--si" : "check--no"), "aria-hidden": "true", text: rg ? "✓" : "✗" }),
          h("span", { class: "alumno__hora", text: rg ? hora(rg.hora) + (rg.modo === "qr" ? " QR" : "") : "Falta" })])
      ]);
      b.addEventListener("click", function () {
        if (regDe(sel.n, e)) desmarcar(e); else marcar(e, "manual");
        pintar(); var x = $("al-" + e.numero); if (x) x.focus();
      });
      ol.appendChild(h("li", null, [b]));
    });
    var fu = fueraDeLista(sel.n);
    $("fuera").hidden = !fu.length;
    var lf = $("lista-fuera"); lf.innerHTML = "";
    fu.forEach(function (x) {
      var asignar = h("select", { class: "campo campo--select campo--mini", "aria-label": "Asignar a un estudiante de la lista" }, [h("option", { value: "", text: "Asignar a…" })].concat(A.lista.map(function (e) { return h("option", { value: String(e.numero), text: e.numero + ". " + e.nombre }); })));
      asignar.addEventListener("change", function () { var e = A.lista.filter(function (y) { return String(y.numero) === asignar.value; })[0]; if (e) asignarQR(x, e); });
      var quitar = h("button", { class: "boton boton--texto boton--mini", type: "button", text: "Quitar" });
      quitar.addEventListener("click", function () { var s2 = ses(sel.n); s2.registros = s2.registros.filter(function (y) { return y !== x; }); guardar(true); pintar(); });
      lf.appendChild(h("li", { class: "lista-asis__item" }, [
        h("span", { class: "lista-asis__nombre", text: x.nombre }),
        h("span", { class: "lista-asis__detalle", text: (/^NOM-/.test(x.codigo || "") ? "QR con nombre" : "Código " + x.codigo) + ", " + hora(x.hora) }),
        h("span", { class: "lista-asis__acciones" }, [asignar, quitar])
      ]));
    });
    $("elegir").value = String(sel.n);
    $("anterior").disabled = sel.n === D.sesiones[0].n;
    $("siguiente").disabled = sel.n === D.sesiones[D.sesiones.length - 1].n;
    $("correo").value = A.correo || D.curso.correo;
  }

  function asignarQR(x, e) {
    if (x.codigo) { A.lista.forEach(function (y) { if (y.codigo === x.codigo) y.codigo = null; }); e.codigo = x.codigo; }
    var s = ses(sel.n); s.registros = s.registros.filter(function (y) { return y !== x; });
    if (!regDe(sel.n, e)) s.registros.push({ numero: e.numero, codigo: x.codigo, nombre: e.nombre, nombreQR: x.nombre, hora: x.hora, modo: x.modo });
    guardar(true); pintar();
    mostrarUltimo("ok", e.numero + ". " + e.nombre, "Asignado. La próxima vez su código se reconocerá solo.");
  }

  // ---------- marcar todos ----------
  $("todos").addEventListener("click", function () {
    var faltan = A.lista.filter(function (e) { return !regDe(sel.n, e); });
    if (!faltan.length) { alert("Ya están todos marcados presentes."); return; }
    if (!confirm("¿Marcar presentes a los " + faltan.length + " estudiantes que faltan? Después puede tocar a quien no vino para quitarlo.")) return;
    faltan.forEach(function (e) { marcar(e, "manual"); }); pintar();
  });

  // ---------- escáner ----------
  function buscarEnLista(codigo, nombre) {
    for (var i = 0; i < A.lista.length; i++) if (A.lista[i].codigo && A.lista[i].codigo === codigo) return { unico: A.lista[i] };
    var f = fichas(nombre);
    if (f.length < 2) return { candidatos: [] };
    var c = A.lista.filter(function (e) { var fe = fichas(e.nombre); return f.every(function (x) { return fe.indexOf(x) !== -1; }); });
    if (c.length === 1) return { unico: c[0], porNombre: true };
    if (!c.length) {
      c = A.lista.map(function (e) { var fe = fichas(e.nombre); return { e: e, p: f.filter(function (x) { return fe.indexOf(x) !== -1; }).length }; })
        .filter(function (x) { return x.p >= 2 || (x.p >= 1 && f.length === 2); }).sort(function (a, b) { return b.p - a.p; }).map(function (x) { return x.e; });
    }
    return { candidatos: c.slice(0, 4) };
  }
  function mostrarUltimo(tipo, titulo, detalle, opciones) {
    $("ultimo").className = "ultimo ultimo--" + tipo;
    $("ultimo-nombre").textContent = titulo; $("ultimo-detalle").textContent = detalle || "";
    var op = $("ultimo-opciones"); op.innerHTML = "";
    (opciones || []).forEach(function (o) { var b = h("button", { class: "boton boton--secundario boton--mini", type: "button", text: o.texto }); b.addEventListener("click", o.accion); op.appendChild(b); });
    var v = $("visor"); v.classList.remove("visor--ok", "visor--rep", "visor--error"); void v.offsetWidth;
    v.classList.add(tipo === "ok" ? "visor--ok" : tipo === "rep" ? "visor--rep" : "visor--error");
  }
  var cam = { stream: null, activo: false, ultimoTexto: "", ultimoMs: 0, lienzo: document.createElement("canvas"), ultimaLectura: 0, deviceId: null };
  function procesar(texto) {
    var t = Date.now();
    if (texto === cam.ultimoTexto && t - cam.ultimoMs < 3000) return;
    cam.ultimoTexto = texto; cam.ultimoMs = t;
    var p = Q.decodificar(texto);
    if (!p) { SONIDO.error(); mostrarUltimo("error", "Código no reconocido", "No es un código de asistencia de este curso. Pida al estudiante abrir el enlace de asistencia."); return; }
    if (!A.lista.length) { SONIDO.error(); mostrarUltimo("error", p.nombre, "Primero cargue la lista del curso."); return; }
    var b = buscarEnLista(p.codigo, p.nombre);
    // Fecha y hora en que el estudiante generó su QR (versión 2): avisar si no es de hoy
    var gen = "", genViejo = false;
    if (p.generado) {
      var dg = new Date(p.generado);
      var diaQR = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA }).format(dg);
      genViejo = diaQR !== hoyISO() && !new URLSearchParams(location.search).get("hoy");
      gen = genViejo ? " ¡Atención! El código se generó el " + fecha(diaQR, true, true) + " a las " + hora(dg.toISOString()) + ", no hoy."
                     : " Código generado a las " + hora(dg.toISOString()) + ".";
    }
    if (b.unico) {
      var e = b.unico;
      if (!e.codigo && !A.lista.some(function (x) { return x.codigo === p.codigo; })) { e.codigo = p.codigo; guardar(false); }
      var r = marcar(e, "qr", p.codigo, p.nombre);
      if (r.estado === "repetido") { SONIDO.repetido(); mostrarUltimo("rep", e.numero + ". " + e.nombre, "Ya estaba presente desde las " + hora(r.reg.hora) + "." + gen); }
      else {
        if (p.generado) { r.reg.generado = p.generado; guardar(false); }
        if (genViejo) SONIDO.repetido(); else SONIDO.ok();
        var fq = fichas(p.nombre).sort().join(" "), fl = fichas(e.nombre).sort().join(" ");
        mostrarUltimo(genViejo ? "rep" : "ok", e.numero + ". " + e.nombre, "Presente a las " + hora(r.reg.hora) + (b.porNombre && fq !== fl ? ". En su QR dice «" + p.nombre + "»." : ".") + gen + (genViejo ? " Si no corresponde, toque su nombre en la lista para quitarlo." : ""));
      }
      pintar(); return;
    }
    // Caso dudoso: se guarda de inmediato como «por resolver» para no perderlo si llega otro estudiante
    var previo = fueraDeLista(sel.n).filter(function (y) { return y.codigo === p.codigo; })[0];
    if (previo) { SONIDO.repetido(); mostrarUltimo("rep", p.nombre, "Ya está en «Por resolver» desde las " + hora(previo.hora) + "."); return; }
    var x = { numero: null, codigo: p.codigo, nombre: p.nombre, nombreQR: p.nombre, hora: new Date().toISOString(), modo: "qr", generado: p.generado || null, candidatos: b.candidatos.map(function (e) { return e.numero; }) };
    ses(sel.n).registros.push(x); guardar(true); pintar();
    SONIDO.repetido();
    var ops = b.candidatos.map(function (e) { return { texto: "Es " + e.numero + ". " + e.nombre, accion: function () { asignarQR(x, e); } }; });
    mostrarUltimo("rep", "¿Quién es " + p.nombre + "?",
      (b.candidatos.length ? "Hay " + b.candidatos.length + " posibles en la lista. Elija el correcto, ahora o más tarde en «Por resolver»." : "No encontré ese nombre en la lista. Quedó en «Por resolver»: asígnelo abajo o déjelo fuera de la lista.") + gen, ops);
  }
  function bucle() {
    if (!cam.activo) return;
    var v = $("video"), t = performance.now();
    if (v.readyState >= 2 && t - cam.ultimaLectura > 120) {
      cam.ultimaLectura = t;
      var w = Math.min(v.videoWidth, 800), hh = Math.round(v.videoHeight * (w / v.videoWidth));
      if (w && hh) {
        cam.lienzo.width = w; cam.lienzo.height = hh;
        var c = cam.lienzo.getContext("2d", { willReadFrequently: true }); c.drawImage(v, 0, 0, w, hh);
        var res = window.jsQR(c.getImageData(0, 0, w, hh).data, w, hh, { inversionAttempts: "dontInvert" });
        if (res && res.data) procesar(res.data);
      }
    }
    requestAnimationFrame(bucle);
  }
  function encender() {
    var estado = $("cam-estado");
    if (!window.isSecureContext) { estado.textContent = "La cámara en vivo no está disponible aquí. Use «Tomar foto del QR»."; return; }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { estado.textContent = "La cámara en vivo no está disponible aquí. Use «Tomar foto del QR»."; return; }
    estado.textContent = "Encendiendo la cámara…";
    var tactil = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    var v = { width: { ideal: 1280 }, height: { ideal: 720 } };
    if (cam.deviceId) v.deviceId = { exact: cam.deviceId }; else v.facingMode = tactil ? "environment" : "user";
    navigator.mediaDevices.getUserMedia({ video: v, audio: false }).then(function (s) {
      cam.stream = s; cam.activo = true;
      var vid = $("video"); vid.srcObject = s; vid.play();
      var aj = s.getVideoTracks()[0] && s.getVideoTracks()[0].getSettings ? s.getVideoTracks()[0].getSettings() : {};
      vid.classList.toggle("sin-espejo", aj.facingMode === "environment");
      estado.textContent = "Acerque el código QR al recuadro";
      navigator.mediaDevices.enumerateDevices().then(function (ds) {
        var vs = ds.filter(function (d) { return d.kind === "videoinput"; }), sl = $("cam-lista");
        sl.hidden = vs.length < 2; sl.innerHTML = "";
        vs.forEach(function (d, i) { var o = h("option", { value: d.deviceId, text: d.label || "Cámara " + (i + 1) }); if (d.deviceId === aj.deviceId) o.selected = true; sl.appendChild(o); });
      }).catch(function () {});
      requestAnimationFrame(bucle);
    }).catch(function (e) {
      estado.textContent = e && e.name === "NotAllowedError" ? "La cámara en vivo no está permitida aquí. Use «Tomar foto del QR» (abajo) o abra el registro desde GitHub Pages."
        : e && e.name === "NotFoundError" ? "No se encontró ninguna cámara." : "No se pudo encender la cámara (" + (e && e.name || "error") + ").";
    });
  }
  function apagar() {
    cam.activo = false;
    if (cam.stream) cam.stream.getTracks().forEach(function (t) { t.stop(); });
    cam.stream = null; $("video").srcObject = null; $("cam-estado").textContent = "Cámara apagada";
  }
  $("escanear").addEventListener("click", function () {
    var abrir = $("panel-escaner").hidden;
    $("panel-escaner").hidden = !abrir;
    document.body.classList.toggle("con-escaner", abrir);
    $("escanear").setAttribute("aria-expanded", abrir ? "true" : "false");
    $("escanear").textContent = abrir ? "Cerrar el escáner" : "Escanear QR";
    if (abrir) encender(); else apagar();
  });
  $("cam-lista").addEventListener("change", function () { cam.deviceId = $("cam-lista").value; apagar(); encender(); });
  $("foto-qr").addEventListener("change", function (ev) {
    var f = ev.target.files && ev.target.files[0]; if (!f) return;
    var img = new Image(), url = URL.createObjectURL(f);
    img.onload = function () {
      var max = 1400, k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      var w = Math.round(img.naturalWidth * k), hh = Math.round(img.naturalHeight * k);
      var c = document.createElement("canvas"); c.width = w; c.height = hh;
      var x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(img, 0, 0, w, hh);
      URL.revokeObjectURL(url); ev.target.value = "";
      var res = window.jsQR(x.getImageData(0, 0, w, hh).data, w, hh, { inversionAttempts: "attemptBoth" });
      if (res && res.data) { cam.ultimoTexto = ""; procesar(res.data); }
      else { SONIDO.error(); mostrarUltimo("error", "No encontré un código QR en la foto", "Acérquese más, evite reflejos y que el código ocupe buena parte de la foto."); }
    };
    img.onerror = function () { URL.revokeObjectURL(url); ev.target.value = ""; mostrarUltimo("error", "No se pudo abrir la imagen", "Pruebe con otra foto."); };
    img.src = url;
  });

  // ---------- Excel y correo ----------
  function libroSesion() {
    var conDatos = D.sesiones.filter(function (s) { return regs(s.n).length || s.n === sel.n; });
    return window.AsistenciaExcel.construir({
      curso: D.curso.nombre, codigoCurso: D.curso.codigo, docente: D.curso.docente, generado: ahoraTexto(),
      sesion: { n: sel.n, fecha: sel.fecha, fechaLarga: fecha(sel.fecha, false, true), tema: sel.tema },
      sesiones: conDatos.map(function (s) { return { n: s.n, fecha: s.fecha }; }),
      lista: A.lista,
      estado: function (n, e) { var r = null, rr = regs(n); for (var i = 0; i < rr.length; i++) if (rr[i].numero === e.numero) r = rr[i]; return r ? { presente: true, hora: hora(r.hora), modo: r.modo === "qr" ? "QR" : "Manual" } : null; },
      fuera: function (n) { return fueraDeLista(n).map(function (x) { return { nombre: x.nombre, codigo: /^NOM-/.test(x.codigo || "") ? "QR con nombre" : x.codigo, hora: hora(x.hora), modo: "QR" }; }); }
    });
  }
  function nombreArchivo() { return "Asistencia_PROF00820_S" + pad2(sel.n) + "_" + sel.fecha + ".xlsx"; }
  function descargarBlob(blob, nombre) { return window.guardarArchivo(nombre, blob); }
  function marcarEnviado() { var s = ses(sel.n); s.enviado = new Date().toISOString(); guardar(false); pintar(); }
  function resumenTexto() {
    var dentro = A.lista.filter(function (e) { return regDe(sel.n, e); }).length;
    return "Asistencia de la sesión " + sel.n + " (" + fecha(sel.fecha, false, true) + "): " + dentro + " de " + A.lista.length + " presentes.";
  }
  $("correo").addEventListener("change", function () { var v = $("correo").value.trim(); A.correo = v && v !== D.curso.correo ? v : null; guardar(false); });
  $("descargar").addEventListener("click", function () {
    if (!A.lista.length) { alert("Primero cargue la lista del curso."); return; }
    descargarBlob(libroSesion().blob(), nombreArchivo()).then(function (ok) { if (ok) marcarEnviado(); });
  });
  $("enviar").addEventListener("click", function () {
    if (!A.lista.length) { alert("Primero cargue la lista del curso."); return; }
    var nombre = nombreArchivo(), blob = libroSesion().blob();
    var correo = A.correo || D.curso.correo;
    var asunto = "Asistencia PROF00820, sesión " + sel.n + " (" + sel.fecha + ")";
    var archivo = null;
    try { archivo = new File([blob], nombre, { type: blob.type }); } catch (e) {}
    if (archivo && navigator.canShare && navigator.canShare({ files: [archivo] })) {
      navigator.share({ files: [archivo], title: asunto, text: resumenTexto() + " Enviar a: " + correo })
        .then(marcarEnviado)
        .catch(function (e) { if (e && e.name !== "AbortError") { respaldoCorreo(blob, nombre, correo, asunto); } });
      return;
    }
    respaldoCorreo(blob, nombre, correo, asunto);
  });
  function respaldoCorreo(blob, nombre, correo, asunto) {
    descargarBlob(blob, nombre).then(function (ok) {
    if (!ok) return;
    marcarEnviado();
    var cuerpo = resumenTexto() + "\n\nAdjunte el archivo que se acaba de descargar: " + nombre + "\n(Está en su carpeta de Descargas.)";
    setTimeout(function () { (window.__abrirCorreo || function (u) { location.href = u; })("mailto:" + correo.replace(/[^A-Za-z0-9@._+-]/g, "") + "?subject=" + encodeURIComponent(asunto) + "&body=" + encodeURIComponent(cuerpo)); }, 400);
    });
  }
  $("exp-semestre").addEventListener("click", function () {
    if (!A.lista.length) { alert("Primero cargue la lista del curso."); return; }
    descargarBlob(libroSesion().blob(), "Asistencia_PROF00820_semestre_" + hoy + ".xlsx");
  });
  $("exp-respaldo").addEventListener("click", function () {
    var b = new Blob([JSON.stringify(A, null, 1)], { type: "application/json" });
    descargarBlob(b, "respaldo_asistencia_PROF00820_" + hoy + ".json");
  });
  $("restaurar").addEventListener("change", function (ev) {
    var f = ev.target.files && ev.target.files[0]; if (!f) return;
    var lr = new FileReader();
    lr.onload = function () {
      ev.target.value = "";
      var b; try { b = JSON.parse(String(lr.result)); } catch (e) { alert("El archivo no es un respaldo válido."); return; }
      if (!b || !b.sesiones) { alert("El archivo no es un respaldo de asistencia de este sitio."); return; }
      var nuevos = 0;
      if ((!A.lista.length) && b.lista && b.lista.length) A.lista = b.lista;
      Object.keys(b.sesiones).forEach(function (k) {
        if (!A.sesiones[k]) A.sesiones[k] = { fecha: b.sesiones[k].fecha, registros: [] };
        (b.sesiones[k].registros || []).forEach(function (x) {
          var ya = A.sesiones[k].registros.some(function (y) { return (x.numero !== null && x.numero !== undefined && y.numero === x.numero) || (x.numero == null && y.numero == null && y.codigo === x.codigo); });
          if (!ya) { A.sesiones[k].registros.push(x); nuevos++; }
        });
      });
      guardar(true); pintar();
      alert("Respaldo restaurado: se agregaron " + nuevos + " registros. Los que ya existían no se duplicaron.");
    };
    lr.readAsText(f, "utf-8");
  });
  $("borrar-sesion").addEventListener("click", function () {
    var n = regs(sel.n).length;
    if (!n) { alert("Esta sesión no tiene registros."); return; }
    if (!confirm("¿Borrar los " + n + " registros de la sesión " + sel.n + "? No se puede deshacer (salvo que tenga un respaldo).")) return;
    delete A.sesiones[String(sel.n)]; guardar(true); pintar();
  });

  // ---------- navegación ----------
  function mover(d) { var i = D.sesiones.indexOf(sel) + d; if (i >= 0 && i < D.sesiones.length) { sel = D.sesiones[i]; pintar(); } }
  $("anterior").addEventListener("click", function () { mover(-1); });
  $("siguiente").addEventListener("click", function () { mover(1); });
  $("elegir").addEventListener("change", function () { sel = sesionPorN(+$("elegir").value); pintar(); });
  function reloj() { $("reloj").textContent = hora(new Date().toISOString()); }
  reloj(); setInterval(reloj, 10000);

  // ---------- inicio ----------
  function cargar() {
    if (window.SILABO_EMBEBIDO) return Promise.resolve(window.SILABO_EMBEBIDO);
    return fetch("datos/silabo.json", { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }
  cargar().then(function (d) {
    D = d; hoy = hoyISO();
    D.sesiones.forEach(function (x) { $("elegir").appendChild(h("option", { value: String(x.n), text: "Sesión " + x.n + ", " + fecha(x.fecha, true) })); });
    var pedida = parseInt(new URLSearchParams(location.search).get("sesion"), 10);
    sel = (pedida && sesionPorN(pedida)) || D.sesiones.filter(function (x) { return x.fecha === hoy; })[0] || D.sesiones.filter(function (x) { return x.fecha > hoy; })[0] || D.sesiones[D.sesiones.length - 1];
    if (!st) { $("error-datos").hidden = false; $("error-datos").textContent = "Este navegador no permite guardar datos: la asistencia se perderá al cerrar la página. Descargue el Excel antes de salir."; }
    pintar();
  }).catch(function () {
    $("error-datos").hidden = false;
    $("error-datos").textContent = "No se pudo leer datos/silabo.json. Abra el registro desde la dirección de GitHub Pages, no con doble clic.";
  });
})();

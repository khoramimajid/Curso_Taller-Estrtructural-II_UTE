/* Modo clase: sesión del día, temporizador y asistencia con QR.
   La asistencia se guarda SOLO en este navegador (localStorage) y se exporta a CSV.
   Para probar otra fecha: clase.html?hoy=2026-10-22 */
(function () {
  "use strict";
  var ZONA = "America/Guayaquil";
  var CLAVE = "te2-2026-2:asistencia-docente";
  var CLAVE_HECHO = "te2-2026-2:bloques-hechos";
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
  function fecha(iso, corta) {
    var o = corta ? { weekday: "short", day: "numeric", month: "short", timeZone: ZONA } : { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: ZONA };
    var t = new Intl.DateTimeFormat("es-EC", o).format(aFecha(iso));
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  function hora(isoCompleto) {
    return new Intl.DateTimeFormat("es-EC", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: ZONA }).format(new Date(isoCompleto));
  }
  function dias(a, b) { return Math.round((aFecha(b) - aFecha(a)) / 86400000); }
  function unidad(id) { for (var i = 0; i < D.unidades.length; i++) if (D.unidades[i].id === id) return D.unidades[i]; return null; }
  function nombreUnidad(u) { return !u ? "" : u.id === "C" ? u.titulo : "Unidad " + u.id + ": " + u.titulo; }
  function badge(ia) {
    if (!ia) return h("span", { class: "ia", text: "Nivel de IA no indicado" });
    var n = D.politicas.niveles_ia[ia];
    return h("span", { class: "ia ia--" + ia, text: (n ? n.nombre : ia) + " (" + ia + ")" });
  }

  // ---------- sonido ----------
  var audio = null;
  function tono(frecs, dur) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      var t = audio.currentTime;
      frecs.forEach(function (f, i) {
        var o = audio.createOscillator(), g = audio.createGain();
        o.frequency.value = f; o.type = "sine";
        g.gain.setValueAtTime(0.0001, t + i * dur);
        g.gain.exponentialRampToValueAtTime(0.25, t + i * dur + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + (i + 1) * dur);
        o.connect(g); g.connect(audio.destination);
        o.start(t + i * dur); o.stop(t + (i + 1) * dur + 0.02);
      });
    } catch (e) { /* sin sonido */ }
  }
  var SONIDO = { fin: function () { tono([988, 784, 988, 784], 0.18); } };

  // ---------- datos de asistencia ----------
  function vacio() { return { version: 1, lista: [], sesiones: {}, ultimoCambio: null, ultimaExportacion: null }; }
  function cargarAsis() {
    if (!st) return vacio();
    try { var d = JSON.parse(st.getItem(CLAVE) || "null"); return d && d.sesiones ? d : vacio(); } catch (e) { return vacio(); }
  }
  var A = cargarAsis();
  function regs(n) { var s = A.sesiones[String(n)]; return s ? s.registros : []; }
  function sesionPorN(n) { for (var i = 0; i < D.sesiones.length; i++) if (D.sesiones[i].n === n) return D.sesiones[i]; return null; }

  // ---------- vista de la sesión ----------
  function hechos() { if (!st) return {}; try { return JSON.parse(st.getItem(CLAVE_HECHO) || "{}") || {}; } catch (e) { return {}; } }
  function pintarSesion() {
    var s = sel, c = $("sesion"), u = unidad(s.unidad);
    c.innerHTML = "";
    var dd = dias(hoy, s.fecha);
    var cuando = dd === 0 ? "Hoy" : dd === 1 ? "Mañana" : dd === -1 ? "Ayer" : dd > 0 ? "En " + dd + " días" : "Hace " + (-dd) + " días";
    c.appendChild(h("div", { class: "clase__cabeza" }, [
      h("p", { class: "clase__fecha" }, [fecha(s.fecha), " ", h("span", { class: "marca" + (dd === 0 ? "" : " marca--gris"), text: cuando })]),
      h("p", { class: "clase__meta", text: "Sesión " + s.n + " de " + D.sesiones.length + ". " + nombreUnidad(u) })
    ]));
    var seg = s.tema.split(/\.\s+(?=\d+\.\d+\s|Unidad \d|Evaluación|EXAMEN|REGISTRO|Resolución|Visita)/)
      .map(function (x) { return x.trim().replace(/\.$/, ""); })
      .filter(function (x) { return x && !/^Unidad \d+\./.test(x); });
    var subtemas = seg.filter(function (x) { return /^\d+\.\d+\s/.test(x); });
    var otros = seg.filter(function (x) { return subtemas.indexOf(x) === -1; });
    var titular = otros.length ? otros.join(". ")
      : subtemas.map(function (x) { return x.split(":")[0].replace(/\s*\([^)]*\)\s*$/, ""); }).join(" y ");
    c.appendChild(h("h1", { class: "clase__tema", text: titular }));
    if (subtemas.length) c.appendChild(h("ul", { class: "subtemas" }, subtemas.map(function (x) {
      var m = x.match(/^(\d+\.\d+)\s+(.*)$/);
      return h("li", null, [h("span", { class: "subtemas__num", text: m[1] }), " ", m[2] + "."]);
    })));
    if (s.evaluacion) c.appendChild(h("p", { class: "sesion__eval clase__callout" }, [h("strong", { text: "Evaluación: " }), s.evaluacion]));
    if (s.hito) c.appendChild(h("p", { class: "sesion__hito clase__callout", text: s.hito }));

    var H = hechos();
    var bloques = h("ol", { class: "bloques" });
    function bloque(clave, titulo, a, extra) {
      if (!a) return;
      var id = "b-" + s.n + "-" + clave;
      var caja = h("input", { type: "checkbox", id: id });
      caja.checked = !!H[id];
      caja.addEventListener("change", function () {
        var x = hechos(); if (caja.checked) x[id] = true; else delete x[id];
        try { st && st.setItem(CLAVE_HECHO, JSON.stringify(x)); } catch (e) {}
        li.classList.toggle("bloque--hecho", caja.checked);
      });
      var li = h("li", { class: "bloque" + (caja.checked ? " bloque--hecho" : "") + (extra ? " bloque--" + extra : "") }, [
        h("div", { class: "bloque__cabeza" }, [h("h2", { class: "bloque__titulo", text: titulo }), badge(a.ia),
          h("label", { class: "bloque__hecho", for: id }, [caja, " Hecho"])]),
        h("p", { class: "bloque__texto", text: a.texto })
      ]);
      bloques.appendChild(li);
    }
    bloque("acd", "En clase (ACD)", s.acd);
    bloque("ape", "Práctica (APE)", s.ape);
    (s.aa || []).forEach(function (a, i) { bloque("aa" + i, "Tarea para después de clase (AA)", a, "aa"); });
    c.appendChild(bloques);
    if (s.nota) c.appendChild(h("p", { class: "sesion__nota", text: s.nota }));

    $("elegir").value = String(s.n);
    $("anterior").disabled = s.n === D.sesiones[0].n;
    $("siguiente").disabled = s.n === D.sesiones[D.sesiones.length - 1].n;
    pintarResumenAsis();
    pintarAvance();
  }

  function pintarAvance() {
    var c = $("avance"); c.innerHTML = "";
    var hechas = D.sesiones.filter(function (x) { return x.fecha < hoy; }).length;
    var pct = Math.round(100 * hechas / D.sesiones.length);
    c.appendChild(h("p", { class: "panel__cifra" }, [String(hechas), h("span", { class: "panel__unidad", text: " de " + D.sesiones.length + " sesiones dictadas" })]));
    var barra = h("div", { class: "barra-avance", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": String(pct), "aria-label": "Avance del semestre" }, [h("span", { style: "width:" + pct + "%" })]);
    c.appendChild(barra);
    var ev = D.sesiones.filter(function (x) { return x.evaluacion && x.fecha >= hoy; })[0];
    if (ev) {
      var n = dias(hoy, ev.fecha);
      c.appendChild(h("p", { class: "nota" }, [h("strong", { text: "Próxima evaluación: " }), fecha(ev.fecha, true) + " (" + (n === 0 ? "hoy" : n === 1 ? "mañana" : "en " + n + " días") + "). " + ev.evaluacion.split(",")[0] + "."]));
    }
  }

  function pintarResumenAsis() {
    var sx = A.sesiones[String(sel.n)], r = sx ? sx.registros : [];
    var dentro = r.filter(function (x) { return x.numero !== null && x.numero !== undefined; }).length;
    var total = (A.lista || []).length;
    $("asis-cuenta").textContent = String(dentro);
    $("asis-de").textContent = total ? " de " + total + " presentes" : (dentro === 1 ? " presente" : " presentes");
    var pend = r.length && !(sx.enviado && (!sx.modificado || sx.modificado <= sx.enviado));
    $("asis-pendiente").hidden = !pend;
    if (pend) $("asis-pendiente").textContent = "El Excel de esta sesión aún no se envió.";
    $("asis-envio").textContent = sx && sx.enviado && !pend ? "Excel enviado a las " + hora(sx.enviado) + "." : (!total ? "Cargue la lista del curso en el registro (una sola vez)." : "");
    actualizarEnlaceRegistro();
  }

  // ---------- temporizador ----------
  var T = { total: 600, restante: 600, fin: null, id: null };
  function mmss(s) { s = Math.max(0, Math.round(s)); return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); }
  function pintarTemp() {
    $("temp-pantalla").textContent = mmss(T.restante);
    $("temp-iniciar").textContent = T.id ? "Pausar" : (T.restante < T.total && T.restante > 0 ? "Continuar" : "Iniciar");
    $("temp-pantalla").classList.toggle("temporizador--fin", T.restante <= 0);
    $("temp-pantalla").classList.toggle("temporizador--poco", T.restante > 0 && T.restante <= 60);
  }
  function tic() {
    T.restante = (T.fin - Date.now()) / 1000;
    if (T.restante <= 0) {
      T.restante = 0; clearInterval(T.id); T.id = null; SONIDO.fin();
      $("temp-aviso").textContent = "Terminó el tiempo.";
    }
    pintarTemp();
  }
  function fijar(min) { clearInterval(T.id); T.id = null; T.total = T.restante = min * 60; $("temp-aviso").textContent = ""; pintarTemp(); }
  document.querySelectorAll(".temp-presets .chip").forEach(function (b) { b.addEventListener("click", function () { fijar(+b.dataset.min); }); });
  $("temp-iniciar").addEventListener("click", function () {
    if (T.id) { clearInterval(T.id); T.id = null; pintarTemp(); return; }
    if (T.restante <= 0) T.restante = T.total;
    T.fin = Date.now() + T.restante * 1000; T.id = setInterval(tic, 250); $("temp-aviso").textContent = ""; pintarTemp();
  });
  $("temp-mas").addEventListener("click", function () {
    T.restante += 60; T.total = Math.max(T.total, T.restante);
    if (T.id) T.fin += 60000;
    pintarTemp();
  });
  $("temp-reiniciar").addEventListener("click", function () { fijar(T.total / 60); });

  // ---------- reloj, pantalla completa, teclado ----------
  function reloj() { $("reloj").textContent = new Intl.DateTimeFormat("es-EC", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: ZONA }).format(new Date()); }
  reloj(); setInterval(reloj, 10000);
  $("completa").addEventListener("click", function () {
    if (document.fullscreenElement) document.exitFullscreen(); else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
  });
  document.addEventListener("fullscreenchange", function () { $("completa").textContent = document.fullscreenElement ? "Salir de pantalla completa" : "Pantalla completa"; });
  function mover(delta) {
    var i = D.sesiones.indexOf(sel) + delta;
    if (i >= 0 && i < D.sesiones.length) { sel = D.sesiones[i]; pintarSesion(); }
  }
  $("anterior").addEventListener("click", function () { mover(-1); });
  $("siguiente").addEventListener("click", function () { mover(1); });
  $("elegir").addEventListener("change", function () { sel = sesionPorN(+$("elegir").value); pintarSesion(); });
  document.addEventListener("keydown", function (e) {
    var t = e.target.tagName;
    if (t === "INPUT" || t === "SELECT" || t === "TEXTAREA" || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === "ArrowLeft") mover(-1); else if (e.key === "ArrowRight") mover(1);
  });

  var enlace = new URL("asistencia.html", location.href).href;
  $("enlace-alumnos").href = enlace;
  $("enlace-alumnos").textContent = enlace.replace(/^https?:\/\//, "");
  $("copiar-enlace").addEventListener("click", function () {
    var ok = function () { $("copiar-enlace").textContent = "¡Copiado!"; setTimeout(function () { $("copiar-enlace").textContent = "Copiar enlace"; }, 2000); };
    if (navigator.clipboard) navigator.clipboard.writeText(enlace).then(ok, function () { prompt("Copie el enlace:", enlace); });
    else prompt("Copie el enlace:", enlace);
  });

  // ---------- asistencia: se registra en registro.html (pestaña aparte) ----------
  function actualizarEnlaceRegistro() { $("abrir-asistencia").href = "registro.html?sesion=" + sel.n + (new URLSearchParams(location.search).get("hoy") ? "&hoy=" + hoy : ""); }
  window.addEventListener("storage", function (e) { if (e.key === CLAVE) { A = cargarAsis(); if (sel) pintarResumenAsis(); } });
  window.addEventListener("focus", function () { A = cargarAsis(); if (sel) pintarResumenAsis(); });

  // ---------- inicio ----------
  function cargar() {
    if (window.SILABO_EMBEBIDO) return Promise.resolve(window.SILABO_EMBEBIDO);
    return fetch("silabo.json", { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }
  cargar().then(function (d) {
    D = d; hoy = hoyISO();
    var s = $("elegir");
    D.sesiones.forEach(function (x) { s.appendChild(h("option", { value: String(x.n), text: "Sesión " + x.n + ", " + fecha(x.fecha, true) })); });
    var hoyS = D.sesiones.filter(function (x) { return x.fecha === hoy; })[0];
    var prox = D.sesiones.filter(function (x) { return x.fecha > hoy; })[0];
    sel = hoyS || prox || D.sesiones[D.sesiones.length - 1];
    if (!hoyS) {
      $("aviso-dia").hidden = false;
      $("aviso-dia").textContent = prox ? "Hoy no hay sesión programada. Se muestra la próxima: sesión " + prox.n + ", " + fecha(prox.fecha) + "." : "El semestre terminó. Se muestra la última sesión.";
    }
    if (!st) { $("aviso-dia").hidden = false; $("aviso-dia").textContent = "Este navegador no permite guardar datos: la asistencia se perderá al cerrar la página. Exporte antes de salir."; }
    pintarSesion(); pintarTemp();
  }).catch(function (err) {
    if (window.console) console.error(err);
    $("error-datos").hidden = false;
    $("error-datos").textContent = "No se pudo leer silabo.json. Abra el modo clase desde la dirección de GitHub Pages, no con doble clic.";
  });
})();

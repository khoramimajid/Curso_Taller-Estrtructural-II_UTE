/* Taller estructural II: Estructuras metálicas
   Lee silabo.json y arma la página. No envía datos a ningún lado.
   Para probar otra fecha: index.html?hoy=2026-11-26 */
(function () {
  "use strict";

  var ZONA = "America/Guayaquil";
  var CLAVE_TAREAS = "te2-2026-2:tareas";

  // ---------- utilidades ----------
  function h(tag, attrs, hijos) {
    var n = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === "class") n.className = v;
        else if (k === "text") n.textContent = v;
        else n.setAttribute(k, v === true ? "" : v);
      });
    }
    (hijos || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return n;
  }

  function hoyISO() {
    var p = new URLSearchParams(location.search).get("hoy");
    if (p && /^\d{4}-\d{2}-\d{2}$/.test(p)) return p;
    return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  }

  function aFecha(iso) { return new Date(iso + "T12:00:00-05:00"); }

  function fecha(iso, corta, enFrase) {
    var o = corta
      ? { weekday: "short", day: "numeric", month: "short", timeZone: ZONA }
      : { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: ZONA };
    var t = new Intl.DateTimeFormat("es-EC", o).format(aFecha(iso));
    return enFrase ? t : t.charAt(0).toUpperCase() + t.slice(1);
  }

  // Entrega del trabajo autónomo: la siguiente clase, una hora antes de que empiece
  var DATOS = null;
  function entregaDe(s) {
    if (!DATOS) return null;
    var i = DATOS.sesiones.indexOf(s), sig = DATOS.sesiones[i + 1];
    if (!sig) return null;
    var H = DATOS.curso.horario, antes = (DATOS.entregas && DATOS.entregas.minutos_antes) || 60;
    var m = aMin(H ? H.inicio : "16:00") - antes;
    var hh = String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
    return { fecha: sig.fecha, hora: hh, sesion: sig.n };
  }
  function textoEntrega(e) { return e ? "Entrega: " + fecha(e.fecha, false, true) + ", hasta las " + e.hora + " (antes de la sesión " + e.sesion + ")" : "Sin fecha de entrega (fin del período)"; }
  function estadoEntrega(e) {
    if (!e) return null;
    var hoy = hoyISO(), ahora = minutosAhora(), lim = aMin(e.hora);
    if (e.fecha < hoy || (e.fecha === hoy && ahora >= lim)) return { t: "Plazo vencido", c: "vencida" };
    if (e.fecha === hoy) return { t: "Vence hoy a las " + e.hora, c: "hoy" };
    var n = dias(hoy, e.fecha);
    return { t: n === 1 ? "Vence mañana" : "Faltan " + n + " días", c: n <= 2 ? "pronto" : "" };
  }

  function aMin(hhmm) { var p = hhmm.split(":").map(Number); return p[0] * 60 + p[1]; }
  function minutosAhora() {
    var q = new URLSearchParams(location.search).get("hora");
    if (q && /^\d{1,2}:\d{2}$/.test(q)) return aMin(q);
    var t = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: ZONA }).format(new Date());
    return aMin(t);
  }

  function dias(desde, hasta) { return Math.round((aFecha(hasta) - aFecha(desde)) / 86400000); }

  function faltan(n) {
    if (n === 0) return "Es hoy";
    if (n === 1) return "Es mañana";
    return "Faltan " + n + " días";
  }

  function normal(s) { return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }

  function almacen() {
    try {
      var k = "__prueba__";
      localStorage.setItem(k, "1"); localStorage.removeItem(k);
      return localStorage;
    } catch (e) { return null; }
  }

  // ---------- carga ----------
  function cargar() {
    if (window.SILABO_EMBEBIDO) return Promise.resolve(window.SILABO_EMBEBIDO);
    return fetch("silabo.json", { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }

  function mostrarError() {
    var caja = document.getElementById("error-datos");
    caja.hidden = false;
    caja.appendChild(h("p", { text: "No se pudo leer el archivo silabo.json, así que el cronograma, las lecturas y el contacto no aparecen." }));
    caja.appendChild(h("p", { text: "Si abrió index.html con doble clic desde su computadora, el navegador bloquea esa lectura: abra el sitio desde su dirección de GitHub Pages. Si ya está en GitHub Pages, revise que la carpeta datos y el archivo silabo.json se hayan subido." }));
    document.querySelector(".rotulo__cargando").textContent = "Cronograma no disponible.";
  }

  // ---------- rótulo: próxima actividad y evaluación ----------
  function nivelIA(d, codigo) {
    if (!codigo) return h("span", { class: "ia", text: "Nivel de IA no indicado" });
    var n = d.politicas.niveles_ia[codigo];
    return h("span", { class: "ia ia--" + codigo, text: (n ? n.nombre : codigo) + " (" + codigo + ")" });
  }

  function unidadDe(d, id) {
    for (var i = 0; i < d.unidades.length; i++) if (d.unidades[i].id === id) return d.unidades[i];
    return null;
  }

  function titular(tema) {
    var seg = tema.split(/\.\s+(?=\d+\.\d+\s|Unidad \d|Evaluación|EXAMEN|REGISTRO|Resolución|Visita)/)
      .map(function (x) { return x.trim().replace(/\.$/, ""); })
      .filter(function (x) { return x && !/^Unidad \d+\./.test(x); });
    var sub = seg.filter(function (x) { return /^\d+\.\d+\s/.test(x); });
    var otros = seg.filter(function (x) { return sub.indexOf(x) === -1; });
    var cortos = sub.map(function (x) { return x.split(":")[0].replace(/\s*\([^)]*\)\s*$/, ""); });
    return otros.concat(cortos).join(". ") || tema;
  }

  function docenteConTitulo(d) { return (d.curso.docente_titulo ? d.curso.docente_titulo + " " : "") + d.curso.docente; }

  function nombreUnidad(u) { return u.id === "C" ? u.titulo : "Unidad " + u.id + ": " + u.titulo; }

  function linea(d) {
    var items = d.sesiones.map(function (s) { return { tipo: "sesion", fecha: s.fecha, s: s }; });
    (d.eventos || []).forEach(function (e) { items.push({ tipo: "evento", fecha: e.fecha, e: e }); });
    items.sort(function (a, b) { return a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0; });
    return items;
  }

  function pintarRotulo(d, hoy) {
    var celda = document.getElementById("proxima");
    celda.innerHTML = "";
    var items = linea(d);
    var prox = null, H = d.curso.horario, ahora = minutosAhora();
    var finClase = H ? aMin(H.fin) : 24 * 60;
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (it.fecha > hoy || (it.fecha === hoy && !(it.tipo === "sesion" && ahora >= finClase))) { prox = it; break; }
    }

    celda.appendChild(h("p", { class: "rotulo__etiqueta", text: !prox ? "Cierre del período" : prox.fecha === hoy ? "Hoy" : "Próxima actividad" }));

    if (!prox) {
      celda.appendChild(h("p", { class: "rotulo__fecha", text: "El semestre terminó" }));
      celda.appendChild(h("p", { class: "rotulo__tema", text: "La última sesión fue el " + fecha(items[items.length - 1].fecha, false, true) + ". Las calificaciones oficiales están en el Aula Virtual." }));
    } else if (prox.tipo === "evento") {
      var e = prox.e;
      celda.appendChild(h("p", { class: "rotulo__fecha" + (prox.fecha === hoy ? " rotulo__fecha--hoy" : ""), text: fecha(e.fecha) }));
      celda.appendChild(h("p", { class: "rotulo__tema" }, [h("strong", { text: e.titulo }), e.por_confirmar ? " (fecha por confirmar)" : ""]));
      celda.appendChild(h("p", { class: "rotulo__detalle", text: e.texto }));
      celda.appendChild(h("a", { href: "#evento-" + e.fecha, text: "Ver la visita en el cronograma" }));
    } else {
      var s = prox.s, u = unidadDe(d, s.unidad);
      celda.appendChild(h("p", { class: "rotulo__fecha" + (prox.fecha === hoy ? " rotulo__fecha--hoy" : ""), text: fecha(s.fecha) }));
      celda.appendChild(h("p", { class: "rotulo__detalle", text: "Sesión " + s.n + " de 32. " + (u ? nombreUnidad(u) : "") }));
      if (H) {
        var est = null;
        if (prox.fecha === hoy) {
          var ini = aMin(H.inicio);
          if (ahora < ini) { var faltaM = ini - ahora; est = { t: "Empieza en " + (faltaM >= 60 ? Math.floor(faltaM / 60) + " h" + (faltaM % 60 ? " " : "") : "") + (faltaM % 60 ? (faltaM % 60) + " min" : ""), c: "" }; }
          else if (ahora < finClase) est = { t: "En curso hasta las " + H.fin, c: " rotulo__estado--encurso" };
        }
        celda.appendChild(h("p", { class: "rotulo__horario" }, [H.inicio + " a " + H.fin + ", Aula " + H.aula, est ? h("span", { class: "rotulo__estado" + est.c, text: est.t }) : null]));
      }
      celda.appendChild(h("p", { class: "rotulo__tema rotulo__tema--titular", text: titular(s.tema) }));
      if (s.evaluacion) celda.appendChild(h("p", { class: "sesion__eval" }, [h("strong", { text: "Evaluación: " }), s.evaluacion]));
      else if (s.hito) celda.appendChild(h("p", { class: "sesion__hito", text: s.hito }));
      var ant = null;
      for (var q = 0; q < d.sesiones.length; q++) if (d.sesiones[q].n === s.n - 1) ant = d.sesiones[q];
      if (ant && ant.aa && ant.aa.length && ant.fecha < hoy) {
        celda.appendChild(h("div", { class: "preparar" }, [
          h("strong", { text: "Trabajo autónomo asignado en la sesión " + ant.n + ":" }),
          ant.aa.map(function (a) { return a.texto.split(". ")[0].replace(/\.$/, "") + "."; }).join(" "),
          h("span", { class: "tarea__entrega" }, [textoEntrega(entregaDe(ant)), (function () { var est = estadoEntrega(entregaDe(ant)); return est ? h("span", { class: "estado-entrega estado-entrega--" + (est.c || "normal"), text: est.t }) : null; })()])
        ]));
      }
      celda.appendChild(h("a", { href: "#s-" + s.n, text: "Ver la sesión " + s.n + " con sus actividades" }));
    }

    var ce = document.getElementById("proxima-eval");
    ce.innerHTML = "";
    ce.appendChild(h("p", { class: "rotulo__etiqueta", text: "Próxima evaluación" }));
    var ev = null;
    for (var j = 0; j < d.sesiones.length; j++) {
      if (d.sesiones[j].evaluacion && d.sesiones[j].fecha >= hoy) { ev = d.sesiones[j]; break; }
    }
    if (!ev) {
      ce.appendChild(h("p", { class: "rotulo__tema", text: "No quedan evaluaciones en el cronograma." }));
    } else {
      ce.appendChild(h("p", { class: "rotulo__fecha" + (ev.fecha === hoy ? " rotulo__fecha--hoy" : ""), text: fecha(ev.fecha) }));
      ce.appendChild(h("p", { class: "rotulo__detalle", text: faltan(dias(hoy, ev.fecha)) + ". Sesión " + ev.n + "." }));
      ce.appendChild(h("p", { class: "rotulo__tema", text: ev.evaluacion }));
      ce.appendChild(h("a", { href: "#s-" + ev.n, text: "Ver qué entra en la sesión " + ev.n }));
    }
  }

  // ---------- cronograma ----------
  function tarjetaSesion(d, s, hoy, esProx) {
    var clases = "sesion" + (esProx ? " sesion--proxima" : s.fecha < hoy ? " sesion--pasada" : "");
    var cab = h("div", { class: "sesion__cabeza" }, [
      h("p", { class: "sesion__num" }, [h("a", { class: "pastilla-sesion", href: "#s-" + s.n, text: "Sesión " + s.n })]),
      h("h3", { class: "sesion__fecha", text: fecha(s.fecha) }),
      esProx ? h("span", { class: "marca", text: s.fecha === hoy ? "Hoy" : "Próxima" }) : null
    ]);
    var dl = h("dl", { class: "actividades" });
    function act(tipo, titulo, a, entrega) {
      if (!a) return;
      dl.appendChild(h("div", { class: "actividad actividad--" + tipo }, [
        h("dt", null, [titulo, " ", nivelIA(d, a.ia)]),
        h("dd", { text: a.texto }),
        entrega !== undefined ? h("dd", { class: "actividad__entrega", text: textoEntrega(entrega) }) : null
      ]));
    }
    act("acd", "En clase (ACD)", s.acd);
    act("ape", "Práctica (APE)", s.ape);
    (s.aa || []).forEach(function (a) { act("aa", "Trabajo autónomo (AA)", a, entregaDe(s)); });

    return h("article", { class: clases, id: "s-" + s.n, "aria-labelledby": "s-" + s.n + "-t" }, [
      cab,
      h("p", { class: "sesion__tema", id: "s-" + s.n + "-t", text: s.tema }),
      s.evaluacion ? h("p", { class: "sesion__eval" }, [h("strong", { text: "Evaluación: " }), s.evaluacion]) : null,
      s.hito ? h("p", { class: "sesion__hito", text: s.hito }) : null,
      dl,
      s.nota ? h("p", { class: "sesion__nota", text: s.nota }) : null
    ]);
  }

  function tarjetaEvento(e, hoy, esProx) {
    return h("article", { class: "sesion evento" + (esProx ? " sesion--proxima" : e.fecha < hoy ? " sesion--pasada" : ""), id: "evento-" + e.fecha }, [
      h("div", { class: "sesion__cabeza" }, [
        h("h3", { class: "sesion__fecha", text: fecha(e.fecha) }),
        h("p", { class: "sesion__num", text: e.por_confirmar ? "Fecha por confirmar" : "" }),
        esProx ? h("span", { class: "marca", text: e.fecha === hoy ? "Hoy" : "Próxima" }) : null
      ]),
      h("p", { class: "sesion__tema" }, [h("strong", { text: e.titulo })]),
      h("p", { class: "sesion__hito", text: e.texto })
    ]);
  }

  function pintarCronograma(d, hoy) {
    var cont = document.getElementById("unidades");
    var items = linea(d);
    var proxFecha = null;
    for (var i = 0; i < items.length; i++) if (items[i].fecha >= hoy) { proxFecha = items[i].fecha; break; }
    var proxItem = proxFecha ? items.filter(function (x) { return x.fecha === proxFecha; })[0] : null;
    var unidadActual = proxItem ? (proxItem.s ? proxItem.s.unidad : proxItem.e.unidad) : null;

    d.unidades.forEach(function (u) {
      var suyas = items.filter(function (x) { return (x.s ? x.s.unidad : x.e.unidad) === u.id; });
      if (!suyas.length) return;
      var sesiones = suyas.filter(function (x) { return x.s; });
      var rango = "Sesiones " + sesiones[0].s.n + " a " + sesiones[sesiones.length - 1].s.n + ", del " +
        fecha(suyas[0].fecha, true, true) + " al " + fecha(suyas[suyas.length - 1].fecha, true, true);
      var cuerpo = h("div", { class: "unidad__cuerpo" });
      suyas.forEach(function (x) {
        var esProx = x === proxItem;
        cuerpo.appendChild(x.s ? tarjetaSesion(d, x.s, hoy, esProx) : tarjetaEvento(x.e, hoy, esProx));
      });
      var det = h("details", { class: "unidad" + (u.id === unidadActual ? " unidad--actual" : ""), id: "unidad-" + u.id, open: u.id === unidadActual }, [
        h("summary", null, [
          h("span", { class: "eje", "aria-hidden": "true", text: u.id }),
          h("span", null, [nombreUnidad(u), h("span", { class: "unidad__rango", text: rango })])
        ]),
        cuerpo
      ]);
      cont.appendChild(det);
    });
  }

  // ---------- línea del semestre ----------
  function pintarSemestre(d, hoy) {
    var total = d.sesiones.length;
    var dictadas = d.sesiones.filter(function (s) { return s.fecha < hoy; }).length;
    var pct = Math.round(100 * dictadas / total);
    var barra = document.getElementById("semestre-barra");
    barra.setAttribute("aria-valuenow", String(pct));
    barra.firstElementChild.style.width = pct + "%";
    var evs = d.sesiones.filter(function (s) { return s.evaluacion; });
    var quedan = evs.filter(function (s) { return s.fecha >= hoy; }).length;
    document.getElementById("semestre-dato").textContent = dictadas === 0
      ? "Empieza el " + fecha(d.sesiones[0].fecha, false, true) + ". " + evs.length + " evaluaciones en el período."
      : dictadas >= total ? "Semestre terminado: " + total + " sesiones." : dictadas + " de " + total + " sesiones dictadas (" + pct + " %). Quedan " + quedan + " evaluaciones.";

    var prox = null;
    for (var i = 0; i < d.sesiones.length; i++) if (d.sesiones[i].fecha >= hoy) { prox = d.sesiones[i]; break; }
    var ol = h("ol", { class: "cota__lista" });
    var uPrev = null;
    d.sesiones.forEach(function (s) {
      var u = unidadDe(d, s.unidad);
      var clases = "cota__item" + (s.evaluacion ? " cota__item--eval" : "") + (s.fecha < hoy ? " cota__item--pasada" : "") + (s === prox ? " cota__item--proxima" : "") + (uPrev !== null && s.unidad !== uPrev ? " cota__item--corte" : "");
      var etiqueta = "Sesión " + s.n + ", " + fecha(s.fecha, false, true) + (s.evaluacion ? ". Evaluación: " + s.evaluacion.split(",")[0] : "") + (s === prox ? ". Próxima sesión" : "");
      ol.appendChild(h("li", { class: clases }, [
        s.unidad !== uPrev ? h("span", { class: "cota__unidad", "aria-hidden": "true", text: s.unidad === "C" ? "Cierre" : "U" + s.unidad }) : null,
        h("a", { class: "cota__enlace", href: "#s-" + s.n, "aria-label": etiqueta, title: etiqueta }, [
          h("span", { class: "cota__tick", "aria-hidden": "true" }),
          h("span", { class: "cota__num", "aria-hidden": "true", text: String(s.n) })
        ])
      ]));
      uPrev = s.unidad;
    });
    var cont = document.getElementById("cota");
    cont.appendChild(ol);
    var lista = document.getElementById("lista-evaluaciones"), boton = document.getElementById("ver-evaluaciones");
    if (lista && boton) {
      evs.forEach(function (s) {
        var n = dias(hoy, s.fecha), pasada = s.fecha < hoy;
        lista.appendChild(h("li", { class: "evaluacion" + (pasada ? " evaluacion--pasada" : "") }, [
          h("span", { class: "evaluacion__fecha" }, [h("strong", { text: fecha(s.fecha, true, true).split(",")[1] || "" }), h("span", { text: fecha(s.fecha, true, true).split(",")[0] })]),
          h("span", { class: "evaluacion__texto" }, [h("a", { href: "#s-" + s.n, text: s.evaluacion.split(",")[0].replace(/\.$/, "") }),
            h("span", { class: "evaluacion__cuando", text: pasada ? "Ya pasó" : n === 0 ? "Es hoy" : n === 1 ? "Mañana" : "En " + n + " días" })])
        ]));
      });
      boton.addEventListener("click", function () {
        var abrir = lista.hidden; lista.hidden = !abrir;
        boton.setAttribute("aria-expanded", abrir ? "true" : "false");
        boton.textContent = abrir ? "Ocultar fechas de evaluaciones" : "Ver fechas de evaluaciones";
      });
    }
    var marca = ol.querySelector(".cota__item--proxima");
    if (marca) cont.scrollLeft = Math.max(0, marca.offsetLeft - cont.clientWidth / 2);
  }

  function activarBuscadorTemas() {
    var campo = document.getElementById("buscar-tema"), estado = document.getElementById("buscar-tema-estado");
    var art = Array.prototype.slice.call(document.querySelectorAll("#unidades .sesion"));
    art.forEach(function (a) { a._t = normal(a.textContent); });
    var abiertas = Array.prototype.slice.call(document.querySelectorAll("#unidades details")).map(function (x) { return x.open; });
    campo.addEventListener("input", function () {
      var q = normal(campo.value.trim());
      var dets = Array.prototype.slice.call(document.querySelectorAll("#unidades details"));
      if (!q) {
        art.forEach(function (a) { a.hidden = false; });
        dets.forEach(function (x, i) { x.hidden = false; x.open = abiertas[i]; });
        estado.textContent = ""; return;
      }
      var partes = q.split(/\s+/), n = 0;
      art.forEach(function (a) { var ok = partes.every(function (p) { return a._t.indexOf(p) !== -1; }); a.hidden = !ok; if (ok) n++; });
      dets.forEach(function (x) { var hay = x.querySelector(".sesion:not([hidden])"); x.hidden = !hay; x.open = !!hay; });
      estado.textContent = n ? n + (n === 1 ? " sesión coincide." : " sesiones coinciden.") : "Ninguna sesión coincide. Pruebe con otra palabra.";
    });
  }

  // ---------- lecturas ----------
  var ETIQUETA_ACCESO = {
    "biblioteca": "Biblioteca UTE",
    "abierto": "Acceso abierto",
    "aula": "En el Aula Virtual",
    "por confirmar": "Acceso por confirmar"
  };

  function pintarRecursos(d) {
    var lista = document.getElementById("recursos");
    var estado = document.getElementById("buscar-estado");
    var campo = document.getElementById("buscar");
    var nodos = d.recursos.map(function (r) {
      var datos = h("p", { class: "recurso__datos" }, [
        h("span", { class: "acceso-tag" + (r.acceso === "por confirmar" ? " acceso-tag--pendiente" : ""), text: ETIQUETA_ACCESO[r.acceso] || r.acceso }),
        h("span", { text: r.tipo }),
        r.codigo ? h("span", { text: "Código " + r.codigo }) : null,
        h("span", { text: r.grupo })
      ]);
      var li = h("li", { class: "recurso" }, [
        h("p", { class: "recurso__ref", text: r.referencia }),
        datos,
        r.enlace ? h("p", { class: "recurso__datos" }, [h("a", { href: r.enlace, text: (r.texto_enlace || "Abrir el recurso") + (r.codigo ? " (código " + r.codigo + ")" : "") })]) : null,
        r.nota ? h("p", { class: "recurso__datos", text: r.nota }) : null
      ]);
      li._buscar = normal([r.referencia, r.tipo, r.grupo, r.codigo, ETIQUETA_ACCESO[r.acceso]].join(" "));
      lista.appendChild(li);
      return li;
    });
    function filtrar() {
      var q = normal(campo.value.trim());
      var n = 0;
      nodos.forEach(function (li) {
        var ver = !q || q.split(/\s+/).every(function (p) { return li._buscar.indexOf(p) !== -1; });
        li.hidden = !ver; if (ver) n++;
      });
      estado.textContent = q
        ? (n ? n + " de " + nodos.length + " lecturas coinciden." : "Ninguna lectura coincide. Pruebe con el apellido del autor o una palabra del título.")
        : nodos.length + " lecturas en total.";
    }
    campo.addEventListener("input", filtrar);
    filtrar();
  }

  // ---------- contacto y tutorías ----------
  var ICONOS = {
    chat: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 12a8 8 0 1 1 3.3 6.5L3.5 20l1.4-3.7A7.9 7.9 0 0 1 4 12z"/><path d="M9 10h6M9 13.5h4" stroke-linecap="round"/></svg>',
    telefono: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6.6 3.5l2.6 3.2-1.6 2.4a12 12 0 0 0 7.3 7.3l2.4-1.6 3.2 2.6-1.4 3a2 2 0 0 1-2.2 1.1A18 18 0 0 1 2.4 6.9a2 2 0 0 1 1.1-2.2z"/></svg>',
    correo: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/></svg>',
    grupo: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="8" r="3.2"/><circle cx="17" cy="9.5" r="2.5"/><path d="M3 19c.6-3.3 3-5 6-5s5.4 1.7 6 5M15 14.3c2.6-.4 4.8.9 5.5 3.7"/></svg>'
  };
  function outlook(para, asunto, cuerpo, cc) {
    return "https://outlook.office.com/mail/deeplink/compose?to=" + encodeURIComponent(para) + (cc ? "&cc=" + encodeURIComponent(cc) : "") +
      "&subject=" + encodeURIComponent(asunto || "") + "&body=" + encodeURIComponent(cuerpo || "");
  }
  function botonContacto(tipo, icono, titulo, detalle, enlace, etiqueta) {
    var a = h("a", { class: "boton-contacto boton-contacto--" + tipo, href: enlace, target: /^https?:/.test(enlace) ? "_blank" : null, rel: /^https?:/.test(enlace) ? "noopener" : null, "aria-label": etiqueta || null });
    var ic = h("span", { "aria-hidden": "true", class: "boton-contacto__icono" });
    if (icono === "whatsapp") ic.appendChild(h("img", { src: "whatsapp.png", alt: "", width: "40", height: "40" })); else ic.innerHTML = ICONOS[icono];
    a.appendChild(ic);
    a.appendChild(h("span", { class: "boton-contacto__texto" }, [h("span", { class: "boton-contacto__titulo", text: titulo }), h("span", { class: "boton-contacto__detalle", text: detalle })]));
    return a;
  }
  function pintarContacto(d) {
    var t = d.tutorias, c = document.getElementById("tutorias"), cur = d.curso;
    c.className = "contacto";
    var canal = function (tipo) { return t.canales.filter(function (x) { return x.tipo === tipo; })[0]; };
    var wa = canal("whatsapp-docente"), tel = canal("telefono"), mail = canal("correo"), grupo = canal("whatsapp");
    var docente = h("div", { class: "tarjeta" }, [
      h("h3", { class: "tarjeta__titulo", text: "Contacto con el docente" }),
      h("p", { class: "nota", text: docenteConTitulo(d) + ". Escriba en horario laboral; para dudas del curso, use primero el chat grupal." }),
      h("div", { class: "botones-contacto" }, [
        wa ? botonContacto("whatsapp", "whatsapp", "WhatsApp", wa.detalle, wa.enlace + "?text=" + encodeURIComponent("Hola, profesor. Soy estudiante de " + cur.nombre + "."), "Escribir por WhatsApp al " + wa.detalle) : null,
        tel ? botonContacto("telefono", "telefono", "Llamar", tel.detalle, tel.enlace, "Llamar al " + tel.detalle) : null,
        mail ? botonContacto("correo", "correo", "Correo (Outlook)", mail.detalle, outlook(mail.detalle, cur.nombre + ": consulta", "Estimado " + docenteConTitulo(d).replace(/^Dr\. Majid /, "Dr. ") + ":\n\n"), "Escribir un correo en Outlook a " + mail.detalle) : null,
        grupo ? botonContacto("whatsapp", "whatsapp", "Chat grupal del curso", "Grupo de WhatsApp de la asignatura", grupo.enlace, "Abrir el chat grupal del curso en WhatsApp") : null
      ])
    ]);
    var boton = h("button", { class: "boton boton--verde boton--ancho", type: "button", id: "abrir-tutoria", text: "Reservar una tutoría" });
    var tut = h("div", { class: "tarjeta", id: "tutorias-tarjeta" }, [
      h("h3", { class: "tarjeta__titulo", text: "Horario de tutorías" }),
      h("p", { class: "tutoria-hora", text: t.dia.charAt(0).toUpperCase() + t.dia.slice(1) + ", de " + t.inicio + " a " + t.fin }),
      h("ul", { class: "tutoria-lista" }, [
        h("li", { text: t.modalidad + ". " + t.lugar + "." }),
        h("li", { text: "Turnos de " + t.turno_minutos + " minutos. " + t.reserva }),
        h("li", { text: "Elija fecha y turno; se envía la solicitud al docente y la cita queda en su calendario." })
      ]),
      (t.no_disponible || []).length ? h("p", { class: "nota" }, [h("strong", { text: "Sin tutoría: " }), t.no_disponible.map(function (x) { return fecha(x.fecha, true, true) + " (" + x.texto.replace(/\.$/, "") + ")"; }).join("; ") + "."]) : null,
      boton,
      h("div", { id: "mis-tutorias" })
    ]);
    c.appendChild(docente); c.appendChild(tut);
    boton.addEventListener("click", function () { abrirTutoria(d); });
    pintarMisTutorias(d);
  }

  // ---------- reserva de tutorías ----------
  var CLAVE_TUT = "te2-2026-2:tutorias";
  function leerTut() { try { return JSON.parse(localStorage.getItem(CLAVE_TUT) || "{}") || {}; } catch (e) { return {}; } }
  function guardarTut(x) { try { localStorage.setItem(CLAVE_TUT, JSON.stringify(x)); } catch (e) {} }
  function sumarDias(iso, n) { var f = aFecha(iso); f.setUTCDate(f.getUTCDate() + n); return f.toISOString().slice(0, 10); }
  function viernesPosibles(d, hoy) {
    var t = d.tutorias, desde = sumarDias(hoy, t.anticipacion_dias || 0), hasta = d.sesiones[d.sesiones.length - 1].fecha;
    var nd = {}; (t.no_disponible || []).forEach(function (x) { nd[x.fecha] = x.texto; });
    var f = desde, out = [];
    while (aFecha(f).getUTCDay() !== 5) f = sumarDias(f, 1);
    for (; f <= hasta; f = sumarDias(f, 7)) out.push({ fecha: f, bloqueo: nd[f] || null });
    return out;
  }
  function turnos(t) {
    var a = t.inicio.split(":").map(Number), b = t.fin.split(":").map(Number), out = [];
    for (var m = a[0] * 60 + a[1]; m + t.turno_minutos <= b[0] * 60 + b[1]; m += t.turno_minutos) out.push(String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"));
    return out;
  }
  function masMin(hhmm, n) { var p = hhmm.split(":").map(Number), m = p[0] * 60 + p[1] + n; return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); }
  function utc(fechaIso, hhmm) { var p = hhmm.split(":").map(Number); var dt = new Date(fechaIso + "T00:00:00-05:00"); dt.setUTCMinutes(dt.getUTCMinutes() + p[0] * 60 + p[1]); return dt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); }
  function textoIcs(s) { return String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n"); }

  function abrirTutoria(d) {
    var dlg = document.getElementById("dlg-tutoria"), t = d.tutorias, hoy = hoyISO();
    var $ = function (id) { return document.getElementById(id); };
    $("tut-sub").textContent = t.dia.charAt(0).toUpperCase() + t.dia.slice(1) + ", de " + t.inicio + " a " + t.fin + ", " + t.modalidad.toLowerCase();
    var guardado = leerTut().datos || {};
    if (guardado.nombre && !$("tut-nombre").value) { $("tut-nombre").value = guardado.nombre; $("tut-apellido").value = guardado.apellido || ""; $("tut-correo").value = guardado.correo || ""; }
    var sel = $("tut-fecha"); sel.innerHTML = "";
    var posibles = viernesPosibles(d, hoy), primera = null;
    if (!posibles.length) sel.appendChild(h("option", { value: "", text: "No quedan fechas de tutoría en el semestre" }));
    posibles.forEach(function (v) {
      var o = h("option", { value: v.fecha, text: fecha(v.fecha) + (v.bloqueo ? " (no disponible: " + v.bloqueo.replace(/\.$/, "") + ")" : "") });
      if (v.bloqueo) o.disabled = true; else if (!primera) { primera = v.fecha; o.selected = true; }
      sel.appendChild(o);
    });
    $("tut-fecha-ayuda").textContent = "Se reserva con al menos " + (t.anticipacion_dias || 0) + " días de anticipación.";
    var cont = $("tut-turnos"); cont.innerHTML = "";
    turnos(t).forEach(function (hh, i) {
      cont.appendChild(h("label", { class: "turno" }, [h("input", { type: "radio", name: "tut-turno", value: hh, required: i === 0 }), h("span", { text: hh + " a " + masMin(hh, t.turno_minutos) })]));
    });
    $("form-tutoria").hidden = false; $("tut-listo").hidden = true;
    if (!dlg.open) dlg.showModal();
    $("tut-nombre").focus();
  }

  function activarTutoria(d) {
    var $ = function (id) { return document.getElementById(id); };
    var dlg = $("dlg-tutoria"); if (!dlg) return;
    var t = d.tutorias, cur = d.curso;
    $("tut-cerrar").addEventListener("click", function () { dlg.close(); });
    $("tut-otra").addEventListener("click", function () { abrirTutoria(d); });
    $("tut-tema").addEventListener("input", function () { $("tut-tema-cuenta").textContent = $("tut-tema").value.length + " de 500 caracteres"; });
    ["nombre", "apellido", "correo", "tema"].forEach(function (k) {
      $("tut-" + k).addEventListener("input", function () { $("tut-" + k + "-error").textContent = ""; $("tut-" + k).setAttribute("aria-invalid", "false"); });
    });
    $("tut-turnos").addEventListener("change", function () { $("tut-turno-error").textContent = ""; });
    if (window.claude) $("tut-ics").hidden = true; // el visor de Claude no permite descargar .ics
    $("form-tutoria").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var nombre = $("tut-nombre").value.replace(/\s+/g, " ").trim(), ape = $("tut-apellido").value.replace(/\s+/g, " ").trim();
      var correo = $("tut-correo").value.trim(), tema = $("tut-tema").value.replace(/\s+/g, " ").trim(), f = $("tut-fecha").value;
      var turno = (document.querySelector('input[name="tut-turno"]:checked') || {}).value;
      var err = {
        nombre: nombre.length < 2 ? "Escriba su nombre." : "",
        apellido: ape.length < 2 ? "Escriba sus apellidos." : "",
        correo: !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo) ? "Escriba un correo válido, por ejemplo nombre@ute.edu.ec." : "",
        tema: tema.length < 10 ? "Cuente brevemente el tema (al menos 10 caracteres)." : "",
        turno: !turno ? "Elija un turno." : ""
      };
      ["nombre", "apellido", "correo", "tema", "turno"].forEach(function (k) {
        $("tut-" + k + "-error").textContent = err[k];
        var campo = $("tut-" + k); if (campo) campo.setAttribute("aria-invalid", err[k] ? "true" : "false");
      });
      if (!f) { alert("No hay fechas disponibles."); return; }
      var primero = ["nombre", "apellido", "correo", "tema"].filter(function (k) { return err[k]; })[0];
      if (primero) { $("tut-" + primero).focus(); return; }
      if (err.turno) { var r = document.querySelector('input[name="tut-turno"]'); if (r) r.focus(); return; }

      var fin = masMin(turno, t.turno_minutos), completo = nombre + " " + ape, docenteMail = cur.correo;
      var cuando = fecha(f, false, true) + ", de " + turno + " a " + fin;
      var lugar = t.lugar;
      var asunto = "Solicitud de tutoría: " + cur.nombre + ", " + fecha(f, true, true) + " " + turno;
      var cuerpo = ["Estimado " + docenteConTitulo(d).replace(/^Dr\. Majid /, "Dr. ") + ":", "", "Solicito una tutoría de " + cur.nombre + " (" + cur.codigo + ").", "",
        "Estudiante: " + completo, "Correo: " + correo, "Fecha: " + cuando, "Lugar: " + lugar + " (" + t.modalidad.toLowerCase() + ")", "Tema de consulta: " + tema, "",
        "Quedo atento a su confirmación.", "", "Saludos,", completo, "", "(Solicitud preparada desde el sitio del curso.)"].join("\n");
      $("tut-mail").href = outlook(docenteMail, asunto, cuerpo, correo);
      $("tut-mail-otro").href = "mailto:" + docenteMail + "?cc=" + correo.replace(/[^A-Za-z0-9@._+-]/g, "") + "&subject=" + encodeURIComponent(asunto) + "&body=" + encodeURIComponent(cuerpo);
      var titulo = "Tutoría " + cur.nombre.split(":")[0] + ": " + completo;
      var detalle = "Estudiante: " + completo + " (" + correo + ")\nDocente: " + cur.docente + " (" + docenteMail + ")\nTema: " + tema;
      $("tut-google").href = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent(titulo) +
        "&dates=" + utc(f, turno) + "/" + utc(f, fin) + "&details=" + encodeURIComponent(detalle) + "&location=" + encodeURIComponent(lugar) +
        "&add=" + encodeURIComponent(docenteMail + "," + correo);
      $("tut-outlook").href = "https://outlook.office.com/calendar/0/deeplink/compose?path=%2Fcalendar%2Faction%2Fcompose&rru=addevent&subject=" + encodeURIComponent(titulo) +
        "&startdt=" + encodeURIComponent(f + "T" + turno + ":00-05:00") + "&enddt=" + encodeURIComponent(f + "T" + fin + ":00-05:00") +
        "&location=" + encodeURIComponent(lugar) + "&body=" + encodeURIComponent(detalle) + "&to=" + encodeURIComponent(docenteMail);
      $("tut-whatsapp").href = "https://wa.me/" + cur.telefono_internacional.replace(/\D/g, "") + "?text=" + encodeURIComponent("Hola, profesor. Soy " + completo + ", de " + cur.nombre + ". Le envié por correo una solicitud de tutoría para el " + cuando + ". Tema: " + tema);
      var ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Sitio del curso PROF00820//Tutorias//ES", "METHOD:PUBLISH", "BEGIN:VEVENT",
        "UID:tutoria-" + f + "-" + turno.replace(":", "") + "-" + Math.random().toString(36).slice(2, 10) + "@prof00820",
        "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""), "DTSTART:" + utc(f, turno), "DTEND:" + utc(f, fin),
        "SUMMARY:" + textoIcs(titulo), "LOCATION:" + textoIcs(lugar), "DESCRIPTION:" + textoIcs(detalle),
        "ORGANIZER;CN=" + textoIcs(completo) + ":mailto:" + correo,
        "ATTENDEE;CN=" + textoIcs(cur.docente) + ";ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:" + docenteMail,
        "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Tutoría mañana", "TRIGGER:-P1D", "END:VALARM",
        "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Tutoría en 30 minutos", "TRIGGER:-PT30M", "END:VALARM",
        "END:VEVENT", "END:VCALENDAR"].join("\r\n");
      $("tut-ics").onclick = function () { (window.guardarArchivo || function () {})("tutoria_" + f + "_" + turno.replace(":", "") + ".ics", new Blob([ics], { type: "text/calendar" })); };
      $("tut-resumen").innerHTML = "";
      $("tut-resumen").appendChild(h("p", null, [h("strong", { text: "Revise su solicitud" })]));
      $("tut-resumen").appendChild(h("dl", null, [
        h("dt", { text: "Estudiante" }), h("dd", { text: completo }), h("dt", { text: "Correo" }), h("dd", { text: correo }),
        h("dt", { text: "Fecha" }), h("dd", { text: cuando }), h("dt", { text: "Lugar" }), h("dd", { text: lugar }), h("dt", { text: "Tema" }), h("dd", { text: tema })
      ]));
      var x = leerTut();
      x.datos = $("tut-recordar").checked ? { nombre: nombre, apellido: ape, correo: correo } : null;
      x.solicitudes = (x.solicitudes || []).filter(function (y) { return !(y.fecha === f && y.turno === turno); }).concat([{ fecha: f, turno: turno, tema: tema, creada: new Date().toISOString() }]);
      guardarTut(x);
      pintarMisTutorias(d);
      $("form-tutoria").hidden = true; $("tut-listo").hidden = false; $("tut-resumen").focus();
    });
  }
  function pintarMisTutorias(d) {
    var c = document.getElementById("mis-tutorias"); if (!c) return;
    var hoy = hoyISO(), x = leerTut();
    var futuras = (x.solicitudes || []).filter(function (y) { return y.fecha >= hoy; }).sort(function (a, b) { return (a.fecha + a.turno) < (b.fecha + b.turno) ? -1 : 1; });
    c.innerHTML = "";
    if (!futuras.length) return;
    c.appendChild(h("p", { class: "nota" }, [h("strong", { text: "Sus solicitudes en este dispositivo: " }),
      futuras.map(function (y) { return fecha(y.fecha, true, true) + " a las " + y.turno; }).join("; ") + "."]));
  }

  // ---------- tareas ----------
  function pintarTareas(d) {
    var st = almacen();
    var marcas = {};
    if (st) { try { marcas = JSON.parse(st.getItem(CLAVE_TAREAS) || "{}") || {}; } catch (e) { marcas = {}; } }
    var cont = document.getElementById("lista-tareas");
    var estado = document.getElementById("tareas-estado");
    var total = 0;

    function guardar() {
      if (!st) return;
      try { st.setItem(CLAVE_TAREAS, JSON.stringify(marcas)); } catch (e) { /* sin espacio o bloqueado */ }
    }
    function contar() {
      var n = Object.keys(marcas).filter(function (k) { return marcas[k]; }).length;
      estado.textContent = n + " de " + total + " tareas marcadas en este navegador." +
        (st ? "" : " Este navegador no permite guardar las marcas: se perderán al cerrar la página.");
    }

    d.unidades.forEach(function (u) {
      var ses = d.sesiones.filter(function (s) { return s.unidad === u.id && s.aa && s.aa.length; });
      if (!ses.length) return;
      var g = h("div", { class: "grupo-tareas" }, [h("h3", null, [h("span", { class: "eje eje--mini", "aria-hidden": "true", text: u.id }), " ", nombreUnidad(u)])]);
      ses.forEach(function (s) {
        s.aa.forEach(function (a, i) {
          var id = "t-" + s.n + "-" + i;
          total++;
          var caja = h("input", { type: "checkbox", id: id });
          caja.checked = !!marcas[id];
          caja.addEventListener("change", function () {
            if (caja.checked) marcas[id] = true; else delete marcas[id];
            guardar(); contar();
          });
          g.appendChild(h("label", { class: "tarea", for: id }, [
            caja,
            h("span", { class: "tarea__texto" }, [
              h("span", { class: "tarea__cuando" }, [h("span", { class: "pastilla-sesion pastilla-sesion--mini", text: "Sesión " + s.n }), " " + fecha(s.fecha, true, true)]),
              a.texto,
              (function () {
                var e = entregaDe(s), est = estadoEntrega(e);
                return h("span", { class: "tarea__entrega" }, [textoEntrega(e), est ? h("span", { class: "estado-entrega estado-entrega--" + (est.c || "normal"), text: est.t }) : null]);
              })()
            ])
          ]));
        });
      });
      cont.appendChild(g);
    });

    document.getElementById("borrar-marcas").addEventListener("click", function () {
      if (!window.confirm("¿Borrar todas sus marcas de este navegador? Esto no afecta a nada en el Aula Virtual.")) return;
      marcas = {};
      guardar();
      cont.querySelectorAll("input[type=checkbox]").forEach(function (x) { x.checked = false; });
      contar();
    });
    contar();
  }

  // ---------- políticas ----------
  function pintarPoliticas(d) {
    var p = d.politicas, c = document.getElementById("politicas-contenido");
    var desc = document.getElementById("descripcion");
    if (desc) {
      desc.innerHTML = "";
      if (d.curso.descripcion) desc.appendChild(h("div", { class: "descripcion__caja" }, [h("h3", { text: "Descripción de la asignatura" }), h("p", { class: "descripcion__texto", text: d.curso.descripcion })]));
      if (d.curso.objetivo) desc.appendChild(h("div", { class: "descripcion__objetivo" }, [h("h3", { text: "Objetivo general de aprendizaje" }), h("p", { text: d.curso.objetivo })]));
    }
    var filas = p.evaluacion_tabla.map(function (f) {
      return h("tr", null, [h("th", { scope: "row", text: f.periodo }), h("td", { class: "num", text: f.formativo }), h("td", { class: "num", text: f.sumativo }), h("td", { class: "num", text: f.global })]);
    });
    filas.push(h("tr", null, [h("th", { scope: "row", colspan: "3", text: "TOTAL" }), h("td", { class: "num", text: p.evaluacion_total })]));
    var colores = ["var(--azul)", "var(--verde)", "#1d3557"];
    var pond = h("div", { class: "pond" }, [h("h3", { class: "titulo-seccion-sílabo", text: "EVALUACIÓN DE LA ASIGNATURA O MÓDULO" })]);
    pond.appendChild(h("div", { class: "pond__barra", role: "img", "aria-label": p.evaluacion_tabla.map(function (f) { return f.periodo + " " + f.global; }).join(", ") + ". Total " + p.evaluacion_total + "." },
      p.evaluacion_tabla.map(function (f, i) { return h("span", { class: "pond__seg pond__seg--" + (i + 1), style: "width:" + parseInt(f.global, 10) + "%", text: f.global }); })));
    pond.appendChild(h("div", { class: "pond__tarjetas" }, p.evaluacion_tabla.map(function (f, i) {
      var g = parseInt(f.global, 10), fo = parseInt(f.formativo, 10) || 0, su = parseInt(f.sumativo, 10) || 0;
      return h("div", { class: "pond__tarjeta", style: "--c:" + colores[i] }, [
        h("div", { class: "pond__anillo", style: "--p:" + g, "aria-hidden": "true" }, [h("strong", { text: f.global })]),
        h("div", { style: "width:100%" }, [
          h("p", { class: "pond__nombre", text: f.periodo }),
          h("div", { class: "pond__split", "aria-hidden": "true" }, [fo ? h("span", { class: "f", style: "width:" + fo + "%" }) : null, h("span", { class: "s", style: "width:" + su + "%" })]),
          h("p", { class: "pond__leyenda", text: (fo ? "Formativo " + f.formativo + ", sumativo " + f.sumativo : "Sumativo " + f.sumativo) + ". Vale " + f.global + " de la nota final." })
        ])
      ]);
    })));
    pond.appendChild(h("p", { class: "pond__nota", text: "Formativo: participación, trabajo autónomo y práctico. Sumativo: pruebas y exámenes." }));
    c.appendChild(pond);
    c.appendChild(h("details", { class: "politica" }, [h("summary", { text: "Ver la ponderación como tabla" }), h("div", { class: "tabla-marco", tabindex: "0", role: "region", "aria-label": "Tabla de ponderación de la evaluación" }, [
      h("table", null, [
        h("caption", { text: "Ponderación de la evaluación (Carreras Generales)" }),
        h("thead", null, [h("tr", null, [
          h("th", { scope: "col", text: "Período de Evaluación" }),
          h("th", { scope: "col", class: "num", text: "Componente Formativo" }),
          h("th", { scope: "col", class: "num", text: "Componente Sumativo" }),
          h("th", { scope: "col", class: "num", text: "Ponderación Global" })
        ])]),
        h("tbody", null, filas)
      ])
    ])]));
    if (p.evaluacion_texto) c.appendChild(h("p", { class: "cita", text: p.evaluacion_texto }));

    if (p.recursos_aprendizaje && p.recursos_aprendizaje.length) {
      c.appendChild(h("details", { class: "politica", id: "recursos-autorizados" }, [
        h("summary", { text: "Recursos y herramientas autorizadas" }),
        h("div", null, p.recursos_aprendizaje.map(function (g) {
          return h("div", null, [
            h("p", null, [h("strong", { text: g.titulo })]),
            h("ul", null, g.items.map(function (t) { return h("li", { text: t }); }))
          ]);
        }))
      ]));
    }

    c.appendChild(h("details", { class: "politica" }, [
      h("summary", { text: "Uso de la IA en sus trabajos (comportamiento ético)" }),
      h("ul", null, p.ia_conducta.map(function (t) { return h("li", { text: t }); }))
    ]));
    c.appendChild(h("details", { class: "politica", id: "niveles-ia" }, [
      h("summary", { text: "Niveles de uso de IA en actividades y evaluaciones" }),
      h("div", null, Object.keys(p.niveles_ia).map(function (k) {
        return h("p", null, [nivelIA(d, k), " ", p.niveles_ia[k].texto]);
      }))
    ]));
    c.appendChild(h("details", { class: "politica" }, [
      h("summary", { text: "Qué significan ACD, APE y AA" }),
      h("div", { class: "componentes" }, Object.keys(p.componentes).map(function (k) {
        var t = p.componentes[k].texto, m = t.match(/^([A-Z]+ \([^)]*\):)\s*(.*)$/);
        var nombre = m ? m[1].replace(/^[A-Z]+\s*\(([^)]*)\):$/, "$1:") : null;
        return h("p", { class: "componente" }, [h("span", { class: "ia ia--" + k + " sigla", text: k }), " ", nombre ? h("strong", { text: nombre }) : null, " " + (m ? m[2] : t)]);
      }))
    ]));
  }

  // ---------- navegación: abrir el desplegable que contiene el destino ----------
  function abrirDestino(hash) {
    hash = typeof hash === "string" ? hash : location.hash;
    if (!hash || hash.length < 2) return;
    var t;
    try { t = document.querySelector(hash); } catch (e) { return; }
    if (!t) return;
    var det = t.closest("details");
    while (det) { det.open = true; det = det.parentElement && det.parentElement.closest("details"); }
    if (t.tagName === "DETAILS") t.open = true;
    t.scrollIntoView();
  }

  // ---------- reloj de la barra superior ----------
  function relojSuperior() {
    var f = document.getElementById("ahora-fecha"), hh = document.getElementById("ahora-hora");
    if (!f || !hh) return;
    function pintar() {
      var ahora = new Date();
      var t = new Intl.DateTimeFormat("es-EC", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: ZONA }).format(ahora);
      f.textContent = t.charAt(0).toUpperCase() + t.slice(1);
      hh.textContent = new Intl.DateTimeFormat("es-EC", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: ZONA }).format(ahora);
    }
    pintar(); setInterval(pintar, 5000);
  }

  // ---------- franja: tres paneles de fotos que cambian cada 3 segundos ----------
  function activarFranja() {
    var cont = document.getElementById("franja-imagenes"), boton = document.getElementById("franja-pausa");
    if (!cont || !boton) return;
    var paneles = cont.querySelectorAll(".franja__panel");
    var total = paneles.length ? paneles[0].querySelectorAll(".franja__foto").length : 0, paso = 0, id = null;
    function mostrar() {
      paneles.forEach(function (p, k) {
        var idx = (paso * paneles.length + k) % total;
        setTimeout(function () { p.querySelectorAll(".franja__foto").forEach(function (f, j) { f.classList.toggle("activa", j === idx); }); }, k * 350);
      });
    }
    function iniciar() { if (id || !total) return; id = setInterval(function () { paso++; mostrar(); }, 3000); boton.textContent = "Pausar fotos"; boton.setAttribute("aria-pressed", "false"); }
    function detener() { clearInterval(id); id = null; boton.textContent = "Reanudar fotos"; boton.setAttribute("aria-pressed", "true"); }
    boton.addEventListener("click", function () { if (id) detener(); else iniciar(); });
    document.addEventListener("visibilitychange", function () { if (document.hidden && id) { clearInterval(id); id = null; } else if (!document.hidden && boton.getAttribute("aria-pressed") === "false") iniciar(); });
    var reducir = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducir) detener(); else iniciar();
  }
  relojSuperior();
  activarFranja();

  // ---------- inicio ----------
  cargar().then(function (d) {
    var hoy = hoyISO();
    DATOS = d;
    var meta = document.getElementById("curso-meta"), H = d.curso.horario;
    if (meta && H) {
      meta.innerHTML = "";
      [H.dias + ", de " + H.inicio + " a " + H.fin, "Aula " + H.aula, "Docente: " + docenteConTitulo(d), d.curso.codigo + ", " + d.curso.nivel + " nivel"].forEach(function (t) { meta.appendChild(h("li", { text: t })); });
    }
    (function () {
      var nombres = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
      var vistos = [];
      d.sesiones.forEach(function (s) { var n = aFecha(s.fecha).getUTCDay(); if (vistos.indexOf(n) === -1) vistos.push(n); });
      vistos.sort();
      var txt = vistos.map(function (n) { return nombres[n]; });
      var dias = txt.length > 1 ? txt.slice(0, -1).join(", ") + " y " + txt[txt.length - 1] : txt[0];
      dias = dias.charAt(0).toUpperCase() + dias.slice(1);
      document.getElementById("crono-rango").textContent = dias + ", del " +
        fecha(d.sesiones[0].fecha, false, true).replace(/^[^,]+, /, "") + " al " +
        fecha(d.sesiones[d.sesiones.length - 1].fecha, false, true).replace(/^[^,]+, /, "") + ".";
    })();
    pintarRotulo(d, hoy);
    pintarSemestre(d, hoy);
    pintarCronograma(d, hoy);
    activarBuscadorTemas();
    pintarRecursos(d);
    pintarContacto(d);
    activarTutoria(d);
    pintarTareas(d);
    pintarPoliticas(d);
    document.getElementById("pie-version").textContent =
      "Datos: silabo.json, versión " + d.version + ", actualizado el " + fecha(d.actualizado, false, true) +
      ". Fuente: sílabo aprobado del período 2026-II, versión 3." +
      (new URLSearchParams(location.search).get("hoy") ? " Vista de prueba con la fecha " + hoy + "." : "");
    window.addEventListener("hashchange", function () { abrirDestino(); });
    document.addEventListener("click", function (ev) {
      var a = ev.target.closest && ev.target.closest('a[href^="#"]');
      if (!a) return;
      var hash = a.getAttribute("href");
      if (hash === location.hash) { ev.preventDefault(); abrirDestino(hash); }
      else {
        try { var t = document.querySelector(hash); if (t) { var det = t.closest("details"); while (det) { det.open = true; det = det.parentElement && det.parentElement.closest("details"); } if (t.tagName === "DETAILS") t.open = true; } } catch (e) {}
      }
    });
    abrirDestino();
  }).catch(function (err) {
    if (window.console) console.error(err);
    mostrarError();
  });
})();

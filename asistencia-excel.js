/* Arma el libro de Excel de asistencia: una hoja de la sesión y una hoja del semestre.
   Los totales son fórmulas de Excel (COUNTIF), con su valor ya calculado para que se vean al abrir. */
(function (global) {
  "use strict";
  var X = global.XLSXMini || (typeof require !== "undefined" ? require("./xlsx-mini.js") : null);

  function fechaCorta(iso) { var p = iso.split("-"); return p[2] + "/" + p[1]; }

  /* datos = {
       curso, codigoCurso, docente, generado (texto),
       sesion: { n, fecha, fechaLarga, tema },
       sesiones: [{ n, fecha }]            // sesiones con registro, en orden (para el semestre)
       lista: [{ numero, nombre }],
       estado: function (n, estudiante) -> { presente: bool, hora: "HH:MM", modo: "QR"|"Manual" } | null,
       fuera: function (n) -> [{ nombre, codigo, hora, modo }]   // presentes que no están en la lista
     } */
  function construir(d) {
    var wb = X.libro({ titulo: "Asistencia " + d.codigoCurso + " sesión " + d.sesion.n, autor: d.docente });

    // ---------- Hoja 1: la sesión ----------
    var filas = [
      [{ v: "Registro de asistencia", s: "titulo" }],
      [{ v: d.curso + " (" + d.codigoCurso + ")", s: "negrita" }],
      [{ v: (d.sesion.titulo || "Sesión " + d.sesion.n) + ", " + d.sesion.fechaLarga + ". Docente: " + d.docente }],
      [{ v: d.sesion.tema, s: "sutil" }],
      [{ v: "N.º", s: "encabezado" }, { v: "Estudiante", s: "encabezado" }, { v: "Asistencia", s: "encabezado" }, { v: "Hora", s: "encabezado" }, { v: "Registro", s: "encabezado" }]
    ];
    var primera = filas.length + 1, pres = 0, falt = 0;
    d.lista.forEach(function (e) {
      var st = d.estado(d.sesion.n, e);
      var p = !!(st && st.presente);
      if (p) pres++; else falt++;
      filas.push([
        { v: e.numero, s: "centro" }, { v: e.nombre, s: "normal" },
        { v: p ? "Presente" : "Falta", s: p ? "presente-centro" : "falta-centro" },
        { v: p ? st.hora : "", s: "centro" }, { v: p ? st.modo : "", s: "centro" }
      ]);
    });
    var ultima = filas.length;
    var rango = "C" + primera + ":C" + ultima;
    filas.push([]);
    var fP = filas.length + 1;
    filas.push([null, { v: "Presentes", s: "negrita" }, { v: pres, f: 'COUNTIF(' + rango + ',"Presente")', s: "total" }]);
    var fF = filas.length + 1;
    filas.push([null, { v: "Faltas", s: "negrita" }, { v: falt, f: 'COUNTIF(' + rango + ',"Falta")', s: "total" }]);
    filas.push([null, { v: "Porcentaje de asistencia", s: "negrita" }, { v: pres + falt ? pres / (pres + falt) : 0, f: "IFERROR(C" + fP + "/(C" + fP + "+C" + fF + "),0)", s: "porcentaje" }]);
    var fuera = d.fuera(d.sesion.n) || [];
    if (fuera.length) {
      filas.push([]);
      filas.push([{ v: "Presentes que no están en la lista del curso (no cuentan en el porcentaje)", s: "negrita" }]);
      fuera.forEach(function (x) {
        filas.push([{ v: "—", s: "centro" }, { v: x.nombre + (/^QR con nombre$/.test(x.codigo) ? " (QR con nombre)" : " (código " + x.codigo + ")"), s: "normal" },
          { v: "Presente", s: "presente-centro" }, { v: x.hora, s: "centro" }, { v: x.modo, s: "centro" }]);
      });
    }
    filas.push([]);
    filas.push([{ v: "Generado por el sitio del curso el " + d.generado + ". Registro de apoyo: el registro oficial de asistencia es el de la Universidad UTE.", s: "sutil" }]);
    wb.hoja(d.sesion.hoja || "Sesión " + d.sesion.n, { anchos: [7, 46, 13, 9, 11], fijarFilas: 5, filas: filas, combinar: ["A4:E4", "A" + filas.length + ":E" + filas.length] });

    // ---------- Hoja 2: el semestre ----------
    var ses = d.sesiones;
    var cab = [{ v: "N.º", s: "encabezado" }, { v: "Estudiante", s: "encabezado" }]
      .concat(ses.map(function (s) { return { v: (s.corta || "S" + s.n) + " " + fechaCorta(s.fecha), s: "encabezado" }; }))
      .concat([{ v: "Asistencias", s: "encabezado" }, { v: "Sesiones", s: "encabezado" }, { v: "Porcentaje", s: "encabezado" }]);
    var f2 = [cab];
    var cIni = X.columna(2), cFin = X.columna(1 + ses.length);
    var cA = X.columna(2 + ses.length), cS = X.columna(3 + ses.length);
    d.lista.forEach(function (e) {
      var r = f2.length + 1, t = 0;
      var marcas = ses.map(function (s) {
        var st = d.estado(s.n, e); var p = !!(st && st.presente); if (p) t++;
        return { v: p ? "P" : "F", s: p ? "presente-centro" : "falta-centro" };
      });
      var fila = [{ v: e.numero, s: "centro" }, { v: e.nombre }].concat(marcas);
      if (ses.length) {
        fila.push({ v: t, f: "COUNTIF(" + cIni + r + ":" + cFin + r + ',"P")', s: "total" });
        fila.push({ v: ses.length, f: "COUNTA(" + cIni + r + ":" + cFin + r + ")", s: "total" });
        fila.push({ v: t / ses.length, f: "IFERROR(" + cA + r + "/" + cS + r + ",0)", s: "porcentaje" });
      }
      f2.push(fila);
    });
    var ultimaE = f2.length;
    if (ses.length && d.lista.length) {
      var tot = [null, { v: "Presentes por sesión", s: "negrita" }];
      ses.forEach(function (s, i) {
        var c = X.columna(2 + i);
        var n = d.lista.filter(function (e) { var st = d.estado(s.n, e); return st && st.presente; }).length;
        tot.push({ v: n, f: "COUNTIF(" + c + "2:" + c + ultimaE + ',"P")', s: "total" });
      });
      f2.push(tot);
    }
    f2.push([]);
    f2.push([{ v: "P = presente, F = falta. Solo se incluyen las sesiones con asistencia registrada en este equipo. Generado el " + d.generado + ".", s: "sutil" }]);
    wb.hoja("Semestre", { anchos: [7, 44].concat(ses.map(function () { return 10; })).concat([12, 10, 12]), fijarFilas: 1, filas: f2, horizontal: true });
    return wb;
  }

  global.AsistenciaExcel = { construir: construir };
  if (typeof module !== "undefined") module.exports = global.AsistenciaExcel;
})(typeof window !== "undefined" ? window : globalThis);

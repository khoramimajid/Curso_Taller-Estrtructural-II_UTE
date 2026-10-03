/* Formato común del código QR de asistencia.
   Versión 2 (actual):  PROF00820|2|<apellidos>|<nombres>|<fecha y hora ISO de Ecuador>
   Versión 1 (anterior, se sigue leyendo): PROF00820|1|<código>|<nombre>
   No lleva datos sensibles adicionales ni se envía a ningún servidor. */
(function (global) {
  "use strict";
  var CURSO = "PROF00820";

  function limpiarNombre(s) { return (s || "").replace(/[|\r\n\t]/g, " ").replace(/\s+/g, " ").trim(); }
  function limpiarCodigo(s) { return (s || "").replace(/\s+/g, "").toUpperCase(); }
  function normal(s) { return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim(); }
  function claveNombre(apellidos, nombres) { return "NOM-" + normal(apellidos + " " + nombres).replace(/[^a-z0-9ñ ]/g, "").replace(/ /g, "-").toUpperCase().slice(0, 60); }

  function validar(nombres, apellidos) {
    var e = {};
    nombres = limpiarNombre(nombres); apellidos = limpiarNombre(apellidos);
    if (nombres.length < 2) e.nombres = "Escribe tus nombres completos.";
    else if (nombres.length > 60) e.nombres = "Es demasiado largo (máximo 60 caracteres).";
    if (apellidos.length < 2) e.apellidos = "Escribe tus apellidos completos.";
    else if (apellidos.length > 60) e.apellidos = "Es demasiado largo (máximo 60 caracteres).";
    return { ok: !e.nombres && !e.apellidos, errores: e, nombres: nombres, apellidos: apellidos };
  }
  function ahoraEcuador() {
    var d = new Date(Date.now() - 5 * 3600 * 1000);
    return d.toISOString().slice(0, 19) + "-05:00";
  }
  function codificar(nombres, apellidos, generado) {
    return [CURSO, "2", limpiarNombre(apellidos), limpiarNombre(nombres), generado || ahoraEcuador()].join("|");
  }
  function decodificar(texto) {
    if (typeof texto !== "string") return null;
    var p = texto.split("|");
    if (p[0] !== CURSO) return null;
    if (p[1] === "2" && p.length === 5) {
      var ap = limpiarNombre(p[2]), no = limpiarNombre(p[3]), g = p[4];
      if (!ap || !no || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(g)) return null;
      return { version: 2, apellidos: ap, nombres: no, nombre: no + " " + ap, generado: g, codigo: claveNombre(ap, no) };
    }
    if (p[1] === "1" && p.length === 4) {
      var codigo = limpiarCodigo(p[2]), nombre = limpiarNombre(p[3]);
      if (!codigo || !nombre) return null;
      return { version: 1, codigo: codigo, nombre: nombre, generado: null };
    }
    return null;
  }
  function almacen() {
    try { var k = "__p__"; localStorage.setItem(k, "1"); localStorage.removeItem(k); return localStorage; }
    catch (e) { return null; }
  }
  global.QRAsistencia = { CURSO: CURSO, codificar: codificar, decodificar: decodificar, validar: validar, ahoraEcuador: ahoraEcuador,
    limpiarNombre: limpiarNombre, limpiarCodigo: limpiarCodigo, normal: normal, almacen: almacen, claveNombre: claveNombre };
})(window);

/* Guardar un archivo generado en la página.
   Dentro del visor de Claude usa la capacidad «downloads» (el visor pide confirmación;
   en el iPhone abre el menú Compartir). En GitHub Pages o con doble clic, descarga normal.
   Devuelve una promesa: true si se guardó, false si la persona canceló. */
(function (global) {
  "use strict";
  var capacidad = null;
  function obtener() {
    if (capacidad) return capacidad;
    capacidad = (global.claude && typeof global.claude.use === "function")
      ? global.claude.use("downloads").catch(function () { return null; })
      : Promise.resolve(null);
    return capacidad;
  }
  function descargaNormal(nombre, blob) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = nombre;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    return true;
  }
  global.guardarArchivo = function (nombre, blob) {
    return obtener().then(function (d) {
      if (!d) return descargaNormal(nombre, blob);
      return d.save({ filename: nombre, data: blob }).then(function () { return true; }, function (e) {
        if (e && e.code === "declined") return false;
        if (e && e.code === "rate_limited") { alert("Ya hay una descarga esperando su confirmación."); return false; }
        return descargaNormal(nombre, blob);
      });
    });
  };
  obtener();
})(window);

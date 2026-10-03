/* Generador mínimo de archivos .xlsx (Office Open XML) sin dependencias.
   Admite: varias hojas, texto, números, fórmulas con valor calculado, estilos
   (Arial, negrita, rellenos, bordes, porcentaje), anchos de columna, filas fijas.
   Uso:
     var wb = XLSXMini.libro();
     wb.hoja("Sesión 6", { anchos: [6, 40, 14], fijarFilas: 5, filas: [[{ v: "Título", s: "titulo" }], ...] });
     var blob = wb.blob();
   Celda: { v: valor, s: estilo, f: "FÓRMULA sin =" }  (v es el valor calculado que se muestra). */
(function (global) {
  "use strict";

  var ESTILOS = ["normal", "negrita", "titulo", "encabezado", "presente", "falta", "porcentaje", "sutil", "centro", "presente-centro", "falta-centro", "total"];
  // índice del estilo = posición en cellXfs
  var XF = {};
  ESTILOS.forEach(function (n, i) { XF[n] = i; });

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
  }
  function col(i) { var s = ""; i++; while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }

  var estilosXML =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<numFmts count="1"><numFmt numFmtId="164" formatCode="0%"/></numFmts>' +
    '<fonts count="5">' +
    '<font><sz val="11"/><name val="Arial"/><family val="2"/></font>' +
    '<font><b/><sz val="11"/><name val="Arial"/><family val="2"/></font>' +
    '<font><b/><sz val="14"/><name val="Arial"/><family val="2"/></font>' +
    '<font><sz val="10"/><color rgb="FF56626A"/><name val="Arial"/><family val="2"/></font>' +
    '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Arial"/><family val="2"/></font>' +
    '</fonts>' +
    '<fills count="5">' +
    '<fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FF1D2830"/><bgColor indexed="64"/></patternFill></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFE3F0E6"/><bgColor indexed="64"/></patternFill></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFF6E4DE"/><bgColor indexed="64"/></patternFill></fill>' +
    '</fills>' +
    '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>' +
    '<border><left style="thin"><color rgb="FFC3CBD0"/></left><right style="thin"><color rgb="FFC3CBD0"/></right><top style="thin"><color rgb="FFC3CBD0"/></top><bottom style="thin"><color rgb="FFC3CBD0"/></bottom><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="12">' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +                                              // normal
    '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +                                 // negrita
    '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +                                 // titulo
    '<xf numFmtId="0" fontId="4" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>' + // encabezado
    '<xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyFill="1" applyBorder="1"/>' +                  // presente
    '<xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyFill="1" applyBorder="1"/>' +                  // falta
    '<xf numFmtId="164" fontId="1" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1"/>' + // porcentaje
    '<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf>' + // sutil
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>' + // centro
    '<xf numFmtId="0" fontId="1" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>' + // presente-centro
    '<xf numFmtId="0" fontId="1" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>' + // falta-centro
    '<xf numFmtId="0" fontId="1" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>' + // total
    '</cellXfs>' +
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
    '</styleSheet>';

  function hojaXML(h) {
    var x = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">';
    if (h.fijarFilas) x += '<sheetViews><sheetView workbookViewId="0"><pane ySplit="' + h.fijarFilas + '" topLeftCell="A' + (h.fijarFilas + 1) + '" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>';
    else x += '<sheetViews><sheetView workbookViewId="0"/></sheetViews>';
    x += '<sheetFormatPr defaultRowHeight="15"/>';
    if (h.anchos && h.anchos.length) {
      x += "<cols>" + h.anchos.map(function (w, i) { return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>'; }).join("") + "</cols>";
    }
    x += "<sheetData>";
    h.filas.forEach(function (fila, r) {
      if (!fila || !fila.length) { x += '<row r="' + (r + 1) + '"/>'; return; }
      x += '<row r="' + (r + 1) + '">';
      fila.forEach(function (c, k) {
        if (c === null || c === undefined) return;
        if (typeof c !== "object") c = { v: c };
        var ref = col(k) + (r + 1), s = ' s="' + (XF[c.s || "normal"] || 0) + '"';
        if (c.f) {
          var num = typeof c.v === "number";
          x += '<c r="' + ref + '"' + s + (num ? "" : ' t="str"') + "><f>" + esc(c.f) + "</f>" + (c.v === undefined || c.v === null ? "" : "<v>" + esc(c.v) + "</v>") + "</c>";
        } else if (typeof c.v === "number" && isFinite(c.v)) {
          x += '<c r="' + ref + '"' + s + "><v>" + c.v + "</v></c>";
        } else if (c.v === "" || c.v === undefined || c.v === null) {
          x += '<c r="' + ref + '"' + s + "/>";
        } else {
          x += '<c r="' + ref + '"' + s + ' t="inlineStr"><is><t xml:space="preserve">' + esc(c.v) + "</t></is></c>";
        }
      });
      x += "</row>";
    });
    x += "</sheetData>";
    if (h.combinar && h.combinar.length) x += '<mergeCells count="' + h.combinar.length + '">' + h.combinar.map(function (m) { return '<mergeCell ref="' + m + '"/>'; }).join("") + "</mergeCells>";
    x += '<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>';
    x += '<pageSetup orientation="' + (h.horizontal ? "landscape" : "portrait") + '" fitToWidth="1" fitToHeight="0"/>';
    x += "</worksheet>";
    return x;
  }

  function nombreHoja(n, usados) {
    var s = String(n).replace(/[\[\]\*\?\/\\:]/g, " ").slice(0, 31).trim() || "Hoja";
    var base = s, i = 2;
    while (usados[s.toLowerCase()]) { s = base.slice(0, 28) + " " + i++; }
    usados[s.toLowerCase()] = 1;
    return s;
  }

  // ---------- ZIP (método STORE, sin compresión) ----------
  var TABLA = (function () { var t = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = TABLA[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function utf8(s) { return new TextEncoder().encode(s); }
  function zip(archivos) {
    var partes = [], centro = [], off = 0;
    var ahora = new Date();
    var hora = (ahora.getHours() << 11) | (ahora.getMinutes() << 5) | (ahora.getSeconds() >> 1);
    var fecha = ((ahora.getFullYear() - 1980) << 9) | ((ahora.getMonth() + 1) << 5) | ahora.getDate();
    archivos.forEach(function (a) {
      var nombre = utf8(a.nombre), datos = utf8(a.datos), crc = crc32(datos);
      var loc = new DataView(new ArrayBuffer(30));
      loc.setUint32(0, 0x04034b50, true); loc.setUint16(4, 20, true); loc.setUint16(6, 0x0800, true); loc.setUint16(8, 0, true);
      loc.setUint16(10, hora, true); loc.setUint16(12, fecha, true); loc.setUint32(14, crc, true);
      loc.setUint32(18, datos.length, true); loc.setUint32(22, datos.length, true); loc.setUint16(26, nombre.length, true); loc.setUint16(28, 0, true);
      partes.push(new Uint8Array(loc.buffer), nombre, datos);
      var cen = new DataView(new ArrayBuffer(46));
      cen.setUint32(0, 0x02014b50, true); cen.setUint16(4, 20, true); cen.setUint16(6, 20, true); cen.setUint16(8, 0x0800, true); cen.setUint16(10, 0, true);
      cen.setUint16(12, hora, true); cen.setUint16(14, fecha, true); cen.setUint32(16, crc, true);
      cen.setUint32(20, datos.length, true); cen.setUint32(24, datos.length, true); cen.setUint16(28, nombre.length, true);
      cen.setUint32(42, off, true);
      centro.push(new Uint8Array(cen.buffer), nombre);
      off += 30 + nombre.length + datos.length;
    });
    var tamCentro = centro.reduce(function (s, p) { return s + p.length; }, 0);
    var fin = new DataView(new ArrayBuffer(22));
    fin.setUint32(0, 0x06054b50, true); fin.setUint16(8, archivos.length, true); fin.setUint16(10, archivos.length, true);
    fin.setUint32(12, tamCentro, true); fin.setUint32(16, off, true);
    return partes.concat(centro, [new Uint8Array(fin.buffer)]);
  }

  function libro(meta) {
    var hojas = [], usados = {};
    meta = meta || {};
    return {
      hoja: function (nombre, def) { def.nombre = nombreHoja(nombre, usados); hojas.push(def); return this; },
      partes: function () {
        var ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
          '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
          '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
          '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
          '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
          '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>' +
          hojas.map(function (h, i) { return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join("") +
          "</Types>";
        var rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
          '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
          '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
          '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>';
        var wb = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
          '<bookViews><workbookView/></bookViews><sheets>' +
          hojas.map(function (h, i) { return '<sheet name="' + esc(h.nombre) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'; }).join("") +
          '</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>';
        var wbr = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
          hojas.map(function (h, i) { return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; }).join("") +
          '<Relationship Id="rId' + (hojas.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
        var iso = new Date().toISOString().replace(/\.\d+Z$/, "Z");
        var core = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
          "<dc:title>" + esc(meta.titulo || "") + "</dc:title><dc:creator>" + esc(meta.autor || "") + "</dc:creator>" +
          '<dcterms:created xsi:type="dcterms:W3CDTF">' + iso + '</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">' + iso + "</dcterms:modified></cp:coreProperties>";
        var app = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Sitio del curso PROF00820</Application></Properties>';
        var archivos = [
          { nombre: "[Content_Types].xml", datos: ct }, { nombre: "_rels/.rels", datos: rels },
          { nombre: "docProps/core.xml", datos: core }, { nombre: "docProps/app.xml", datos: app },
          { nombre: "xl/workbook.xml", datos: wb }, { nombre: "xl/_rels/workbook.xml.rels", datos: wbr },
          { nombre: "xl/styles.xml", datos: estilosXML }
        ].concat(hojas.map(function (h, i) { return { nombre: "xl/worksheets/sheet" + (i + 1) + ".xml", datos: hojaXML(h) }; }));
        return zip(archivos);
      },
      blob: function () { return new Blob(this.partes(), { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }); }
    };
  }

  global.XLSXMini = { libro: libro, columna: col };
  if (typeof module !== "undefined") module.exports = global.XLSXMini;
})(typeof window !== "undefined" ? window : globalThis);

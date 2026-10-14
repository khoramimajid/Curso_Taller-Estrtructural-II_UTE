/* Permite instalar el sitio como app en el celular. No guarda nada sin conexión: todo se pide siempre a internet. */
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", function () {});

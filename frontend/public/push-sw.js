// Avisos no celular (ver backend/src/services/push.js). Carregado dentro do service worker
// gerado pelo vite-plugin-pwa (workbox.importScripts no vite.config.js). A mensagem chega
// só com dados (titulo, texto, link) e quem monta o aviso é este arquivo.
self.addEventListener("push", (event) => {
  let dados = {};
  try {
    const carga = event.data ? event.data.json() : {};
    dados = carga.data || carga;
  } catch {
    dados = { texto: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(dados.titulo || "Nocturis", {
      body: dados.texto || "Você tem uma novidade na Nocturis.",
      icon: "/favicon-192.png",
      badge: "/favicon-48.png",
      data: { link: dados.link || "/" },
    }),
  );
});

// Tocar no aviso abre a tela certa: reaproveita a aba ou o app aberto, ou abre um novo.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.link || "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((janelas) => {
      const aberta = janelas.find((j) => new URL(j.url).origin === self.location.origin);
      if (aberta) return aberta.navigate(url).then((j) => (j || aberta).focus());
      return self.clients.openWindow(url);
    }),
  );
});

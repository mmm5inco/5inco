self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Requerido por Chrome para reconocer la web como una PWA
self.addEventListener('fetch', (event) => {
  // Aquí podríamos añadir lógica offline, pero para el prompt de instalación esto es suficiente.
});

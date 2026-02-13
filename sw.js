
const CACHE_NAME = 'portaria-express-v4';

// Recursos locais críticos para o funcionamento inicial
const PRE_CACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// Instalação: Cacheia o shell básico
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Instalando Service Worker: Efetuando pré-cache do App Shell');
      return cache.addAll(PRE_CACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Ativação: Limpa caches obsoletos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptação de Requisições
self.addEventListener('fetch', (event) => {
  // Ignorar métodos que não sejam GET
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // ESTRATÉGIA PARA NAVEGAÇÃO (SPA Fallback)
  // Se o usuário recarregar em uma sub-rota ou abrir o app sem internet
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // ESTRATÉGIA PARA RECURSOS ESTÁTICOS E CDNs (Tailwind, React, esm.sh, Google Fonts)
  // Cache-First: Tenta o cache, se não tiver, busca na rede e salva no cache
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // Verifica se a resposta é válida antes de cachear
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && !url.host.includes('esm.sh') && !url.host.includes('tailwindcss.com') && !url.host.includes('fonts.gstatic.com')) {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Se falhar rede e cache, e for imagem, poderia retornar um placeholder aqui
        return null;
      });
    })
  );
});

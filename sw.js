const CACHE_NAME = 'qwik-gold-v1';
const ASSETS_TO_CACHE = [
  '/qwik-gold/',
  '/qwik-gold/index.html',
  '/qwik-gold/assets/css/style.css',
  '/qwik-gold/assets/js/app.js',
  '/qwik-gold/assets/js/api.js',
  '/qwik-gold/assets/js/modules/auth.js',
  '/qwik-gold/assets/js/modules/dashboard.js',
  '/qwik-gold/assets/js/modules/purchases.js',
  '/qwik-gold/assets/js/modules/sales.js',
  '/qwik-gold/assets/js/modules/customers.js',
  '/qwik-gold/assets/js/modules/loans.js',
  '/qwik-gold/assets/js/modules/keepers.js',
  '/qwik-gold/assets/js/modules/expenses.js',
  '/qwik-gold/assets/js/modules/capital.js',
  '/qwik-gold/assets/js/modules/ledger.js',
  '/qwik-gold/assets/js/modules/settings.js',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,300,0,0'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Don't cache API requests, always fetch from network
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

const CACHE_NAME = 'huizekrokantekrab-v5'; // Verhoog dit naar v2, v3 etc. als je de HTML of CSS aanpast
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './schema.json',
    './manifest.json',
    './icon.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
    );
});

// Verwijder oude caches als je het versienummer aanpast
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(key => {
                if (key !== CACHE_NAME) return caches.delete(key);
            })
        ))
    );
});

self.addEventListener('fetch', event => {
    // Voor het programma (schema.json): probeer altijd eerst via internet
    if (event.request.url.includes('schema.json')) {
        event.respondWith(
            fetch(event.request).then(response => {
                // Internet werkt: sla de nieuwste versie direct op in de cache
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, response.clone());
                    return response;
                });
            }).catch(() => {
                // Geen internet (in het bos): gebruik de laatst bekende offline versie
                return caches.match(event.request);
            })
        );
    } else {
        // Voor HTML, CSS en JS: gebruik altijd direct de supersnelle lokale cache
        event.respondWith(
            caches.match(event.request).then(response => response || fetch(event.request))
        );
    }
});
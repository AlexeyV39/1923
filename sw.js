// GitHub Pages build
// V6.9 SOLITAIRE BIG CARDS
// V6.8.7 AUTO LAST BET
// V6.8.6 LAST BET
// V6.8.5 CHIP FIX
// V6.8.4 CHIPS VERIFIED
// V6.8.2 BLACKJACK BOTTOM CONTROLS
// V6.8.1 BLACKJACK UI FIX
// V6.8 CASINO UI
// V6.5 MEMORY FIT SCREEN - cache reset
// V6.4 SOLITAIRE FINAL UI - cache reset
// V6.3 MEMORY EXACT REAL
// V6 CLEAN - cache reset
const CACHE='card-games-github-pages-v1';
const ASSETS=['./','index.html','hub.css','manifest.json','solitaire.html','solitaire.css','solitaire_app.js','blackjack.html','blackjack.css','blackjack.js','memory.html','memory.css','memory.js','icons/icon-192.png','icons/icon-512.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));

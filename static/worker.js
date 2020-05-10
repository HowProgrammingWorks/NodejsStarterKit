'use strict';

const files = [
  '/',
  '/console.css',
  '/console.js',
  '/favicon.ico',
  '/favicon.png',
  '/manifest.json',
  '/metarhia.png',
  '/metarhia.svg',
];

self.addEventListener('install', event => event.waitUntil(
  caches.open('v1').then(cache => cache.addAll(files))
));

self.addEventListener('fetch', event => {
  event.respondWith(caches.match(event.request).then(response => {
    if (response !== undefined) return response;
    return fetch(event.request).then(response => {
      const responseClone = response.clone();
      caches.open('v1').then(cache => {
        cache.put(event.request, responseClone);
      });
      return response;
    }).catch(error => {
      throw error;
    });
  }));
});

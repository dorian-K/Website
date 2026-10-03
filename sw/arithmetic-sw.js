// Service worker that lets /arithmetic work offline.
// Template: the build (see offlineArithmetic in vite.config.ts) replaces the two placeholders
// below and emits the result as /arithmetic-sw.js. It is registered with scope /arithmetic,
// so the rest of the site is never served from this cache.

const CACHE_PREFIX = "arithmetic-offline-";
const CACHE_NAME = CACHE_PREFIX + __CACHE_VERSION__;
/** The page itself plus every file it needs at startup. */
const PRECACHE_URLS = __PRECACHE_URLS__;
const PAGE_URL = "/arithmetic";

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			// Bypass the HTTP cache so a new version never gets paired with stale files.
			.then((cache) => cache.addAll(PRECACHE_URLS.map((url) => new Request(url, { cache: "reload" }))))
			.then(() => self.skipWaiting()),
	);
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key))))
			.then(() => self.clients.claim()),
	);
});

self.addEventListener("fetch", (event) => {
	const request = event.request;
	if (request.method !== "GET") return;

	// Page loads: always try the network so a new deploy shows up right away, fall back offline.
	if (request.mode === "navigate") {
		event.respondWith(
			fetch(request).catch(() =>
				caches.match(PAGE_URL, { cacheName: CACHE_NAME }).then((cached) => cached ?? Response.error()),
			),
		);
		return;
	}

	// Everything else the page loads: files have content hashes in their names, so a cached copy
	// is never outdated. Requests outside the precache list (e.g. the GitHub API) go straight
	// to the network as usual.
	const url = new URL(request.url);
	if (url.origin !== self.location.origin || !PRECACHE_URLS.includes(url.pathname)) return;
	event.respondWith(caches.match(request, { cacheName: CACHE_NAME }).then((cached) => cached ?? fetch(request)));
});

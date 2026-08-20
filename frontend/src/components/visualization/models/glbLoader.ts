import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * A small hand-rolled Suspense-compatible GLTF loader, used instead of
 * drei's `useGLTF` specifically for its error-handling behavior.
 *
 * The problem this solves: the standard "throw a promise for Suspense,
 * throw the rejection for an ErrorBoundary" pattern usually wraps the
 * loader's promise directly and lets it reject on failure. In practice
 * (verified during testing - see the console output when pointing a
 * reference at a nonexistent .glb) that rejection can surface as an
 * *unhandled* promise rejection at the moment the loader fails, even
 * though the ErrorBoundary correctly renders its fallback on the next
 * render. Functionally harmless, but it fails a "zero uncaught errors"
 * bar, and it's avoidable.
 *
 * Fix: the promise thrown for Suspense ALWAYS resolves, never rejects -
 * on load failure we resolve it anyway and stash the error in the cache.
 * The next render then finds the cached error and throws it
 * *synchronously* during render, which is an ordinary render-phase error
 * an ErrorBoundary catches cleanly, with no rejected promise ever existing.
 */

type CacheEntry =
  | { status: "pending"; promise: Promise<void> }
  | { status: "success"; gltf: GLTF }
  | { status: "error"; error: unknown };

const cache = new Map<string, CacheEntry>();
const loader = new GLTFLoader();

export function loadGLTFSuspendable(url: string): GLTF {
  const existing = cache.get(url);

  if (existing?.status === "success") return existing.gltf;
  if (existing?.status === "error") throw existing.error;
  if (existing?.status === "pending") throw existing.promise;

  // Fetch the bytes ourselves rather than handing the URL straight to
  // GLTFLoader.load(): this gives us a single, fully-controlled place to
  // both check the HTTP status (a dev server serving an SPA fallback page
  // with a 200 status for an unmatched /models/*.glb path - as Vite's dev
  // server does - would otherwise read as a "successful" load right up
  // until JSON-parsing the HTML fails) and to guarantee every async step,
  // including the parse itself, funnels into the same never-rejects
  // promise below.
  const promise = new Promise<void>((resolve) => {
    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`GLB request failed: ${response.status} ${response.statusText} (${url})`);
        }
        const contentType = response.headers.get("content-type") ?? "";
        if (contentType.includes("text/html")) {
          // A dev-server SPA fallback or similar misconfigured static host
          // returning an HTML page instead of binary glTF data.
          throw new Error(`Expected a .glb file but received HTML from ${url}`);
        }
        return response.arrayBuffer();
      })
      .then(
        (buffer) =>
          new Promise<GLTF>((resolveParse, rejectParse) => {
            loader.parse(buffer, "", resolveParse, rejectParse);
          })
      )
      .then((gltf) => {
        cache.set(url, { status: "success", gltf });
      })
      .catch((error: unknown) => {
        cache.set(url, { status: "error", error });
      })
      .finally(resolve); // always resolves - see file header comment
  });

  cache.set(url, { status: "pending", promise });
  throw promise;
}

/** Clears a cached failure so a later retry (e.g. after fixing the file) can be attempted. Not used automatically - available for future admin/dev tooling. */
export function clearGLTFCacheEntry(url: string): void {
  cache.delete(url);
}

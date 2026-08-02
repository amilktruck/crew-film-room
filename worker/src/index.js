// Serves the crew-film R2 bucket directly, working around a Hudl export bug:
// its embedded asset paths are written as "..//z/<file>" (double slash), and
// R2 treats URL paths as exact object keys rather than collapsing "//" the
// way a normal web server would. This normalizes the path before the R2
// lookup, and otherwise behaves like R2's own public bucket serving
// (range requests included, for video scrubbing).
export default {
  async fetch(request, env) {
    // The Pages site (crewfilmroom.com) embeds thumbnails from this bucket's
    // hostname (film.crewfilmroom.com) — a different origin. Without CORS
    // headers, browsers intermittently apply Opaque Response Blocking to
    // those cross-origin <img> loads even though the response itself is
    // fine, causing thumbnails to fail unpredictably. Bucket contents are
    // public read-only film, so an open CORS policy is safe.
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET, HEAD",
          "access-control-max-age": "86400",
        },
      });
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405 });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/{2,}/g, "/");
    const key = decodeURIComponent(path.replace(/^\//, ""));

    if (!key) {
      return new Response("Not found", { status: 404 });
    }

    // Only forward range/conditional options when the client actually sent
    // them — passing the whole Headers object through unconditionally makes
    // R2 return an empty 206 even for plain requests with no Range header.
    const options = {};
    if (request.headers.has("range")) {
      options.range = request.headers;
    }
    if (
      request.headers.has("if-none-match") ||
      request.headers.has("if-modified-since") ||
      request.headers.has("if-match") ||
      request.headers.has("if-unmodified-since")
    ) {
      options.onlyIf = request.headers;
    }

    const object = await env.FILM_BUCKET.get(key, options);

    if (!object) {
      return new Response("Not found", { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("accept-ranges", "bytes");
    headers.set("access-control-allow-origin", "*");

    // object.range describes the extent actually returned and is present
    // even for a full, non-ranged fetch (e.g. {offset: 0, length: size}) —
    // it is not a signal that the client asked for a range. Only respond
    // 206 when the client's request itself carried a Range header, and
    // compute Content-Range from offset/length (R2Range has no "end").
    let status = 200;
    if (options.range && object.range) {
      status = 206;
      const offset = object.range.offset ?? 0;
      const length = object.range.length ?? object.size - offset;
      headers.set("content-range", `bytes ${offset}-${offset + length - 1}/${object.size}`);
    }

    if (request.method === "HEAD") {
      return new Response(null, { status, headers });
    }
    return new Response(object.body, { status, headers });
  },
};

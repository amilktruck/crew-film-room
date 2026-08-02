// Serves the crew-film R2 bucket directly, working around a Hudl export bug:
// its embedded asset paths are written as "..//z/<file>" (double slash), and
// R2 treats URL paths as exact object keys rather than collapsing "//" the
// way a normal web server would. This normalizes the path before the R2
// lookup, and otherwise behaves like R2's own public bucket serving
// (range requests included, for video scrubbing).
export default {
  async fetch(request, env) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405 });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/{2,}/g, "/");
    const key = decodeURIComponent(path.replace(/^\//, ""));

    if (!key) {
      return new Response("Not found", { status: 404 });
    }

    const object = await env.FILM_BUCKET.get(key, {
      range: request.headers,
      onlyIf: request.headers,
    });

    if (!object) {
      return new Response("Not found", { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("accept-ranges", "bytes");

    let status = 200;
    if (object.range) {
      status = 206;
      const end = object.range.end ?? object.size - 1;
      headers.set("content-range", `bytes ${object.range.offset}-${end}/${object.size}`);
    }

    if (request.method === "HEAD") {
      return new Response(null, { status, headers });
    }
    return new Response(object.body, { status, headers });
  },
};

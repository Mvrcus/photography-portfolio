// Serves the Vite build in ./dist on Cloudflare Workers with the same clean URLs the old
// Apache .htaccess provided, so every canonical and sitemap URL keeps working:
//   /about_me              -> about_me.html
//   /guides                -> guides/index.html   (no trailing slash, matching its canonical)
//   /page.html, /index.html -> 301 to the clean URL
//   http://, www.          -> 301 to https://zuri-visuals.com
const CANONICAL_HOST = "zuri-visuals.com"

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    // Canonical host and scheme. Preview hosts (*.workers.dev) are left alone.
    if (url.hostname === "www." + CANONICAL_HOST || (url.hostname === CANONICAL_HOST && url.protocol === "http:")) {
      url.hostname = CANONICAL_HOST
      url.protocol = "https:"
      return Response.redirect(url.toString(), 301)
    }

    let path = url.pathname

    // /x.html and /dir/index.html -> clean URL
    if (path.endsWith("/index.html")) return redirect(url, path.slice(0, -"/index.html".length) || "/")
    if (path.endsWith(".html")) return redirect(url, path.slice(0, -".html".length))
    // Trailing slash on anything but the root -> without it
    if (path.length > 1 && path.endsWith("/")) return redirect(url, path.replace(/\/+$/, ""))

    // Map the clean URL to the file in ./dist
    let file = path
    if (path === "/") file = "/index.html"
    else if (path === "/guides") file = "/guides/index.html"
    else if (!/\.[a-z0-9]+$/i.test(path)) file = path + ".html"

    const assetUrl = new URL(file, url)
    const response = await env.ASSETS.fetch(new Request(assetUrl, request))

    const headers = new Headers(response.headers)
    // Preview deployments must never be indexed.
    if (url.hostname !== CANONICAL_HOST) headers.set("X-Robots-Tag", "noindex")
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
  },
}

function redirect(url, pathname) {
  const target = new URL(url)
  target.pathname = pathname
  return Response.redirect(target.toString(), 301)
}

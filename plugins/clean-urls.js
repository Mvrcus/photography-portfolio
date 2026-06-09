const ROOT_PAGES = new Set(["senior-portraits", "about_me", "contact"]);

function rewriteCleanUrl(url) {
  const [pathname, search = ""] = url.split("?");
  const suffix = search ? `?${search}` : "";

  if (pathname === "/guides" || pathname === "/guides/") {
    return `/guides/index.html${suffix}`;
  }

  if (pathname.includes(".") || pathname === "/") {
    return null;
  }

  const page = pathname.replace(/\/$/, "").slice(1);
  if (!page) {
    return null;
  }

  if (ROOT_PAGES.has(page)) {
    return `/${page}.html${suffix}`;
  }

  if (page.startsWith("guides/")) {
    return `/${page}.html${suffix}`;
  }

  return null;
}

function cleanUrlMiddleware(req, _res, next) {
  if (!req.url || req.method !== "GET") {
    next();
    return;
  }

  const rewritten = rewriteCleanUrl(req.url);
  if (rewritten) {
    req.url = rewritten;
  }

  next();
}

export function cleanUrls() {
  return {
    name: "clean-urls",
    configureServer(server) {
      server.middlewares.use(cleanUrlMiddleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(cleanUrlMiddleware);
    },
  };
}

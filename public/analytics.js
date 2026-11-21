/*
 * analytics.js: GA4 and Microsoft Clarity, plus the events the client audit reports on.
 *
 * One file for every client site, whatever it is built with. On a site built from
 * this template, components/analytics.tsx renders the tag from lib/site.ts. On any
 * other site (plain HTML, Astro), copy this file into the served folder and put
 * this in the <head> of every page:
 *
 *   <script async src="/analytics.js"
 *           data-ga4="G-XXXXXXXXXX"
 *           data-clarity="xxxxxxxxxx"
 *           data-hosts="example.com"></script>
 *
 * data-clarity="off" means the site has chosen not to use session recording at all,
 * for audiences where being recorded is a risk (domestic violence, health).
 *
 * data-hosts lists the hostnames that report, comma separated. Everywhere else
 * (localhost, workers.dev previews) the tags never load and each event is logged
 * to the console instead, so the wiring can be checked without polluting the
 * numbers. At local-business traffic a handful of stray sessions visibly skews a
 * month.
 *
 * Events (docs/ANALYTICS.md has the full dictionary):
 *   phone_click    any tel: link
 *   email_click    any mailto: link
 *   scroll_depth   25/50/75/90% of a page, once each per path
 *   chat_open      first interaction with the LeadConnector (GoHighLevel) chat widget
 *   data-track     any element with data-track="event_name" fires that event on
 *                  click, with data-track-* attributes as parameters
 *   trackEvent()   window.trackEvent(name, params) for anything else, e.g.
 *                  generate_lead when a form succeeds
 *
 * Page views need nothing here. gtag's config call sends the first one, and GA4's
 * enhanced measurement ("Page changes based on browser history events", on by
 * default) sends one per client-side navigation. Sending our own on route changes
 * as well would double-count every navigation.
 *
 * Add ?analytics_debug=1 to a live URL to see its events in GA4 Admin > DebugView.
 */
(function () {
  "use strict";

  if (window.__analyticsLoaded) return;
  window.__analyticsLoaded = true;

  var script = document.currentScript;
  var config = (script && script.dataset) || {};
  var GA4 = config.ga4 || "";
  var CLARITY = config.clarity && config.clarity !== "off" ? config.clarity : "";
  var HOSTS = (config.hosts || "")
    .split(",")
    .map(function (h) { return h.trim(); })
    .filter(Boolean);
  // LeadConnector serves the GoHighLevel chat widget. White-labelled accounts may use another domain.
  var CHAT_FRAME = new RegExp(config.chatFrame || "leadconnector|msgsndr", "i");

  var host = window.location.hostname;
  var live = HOSTS.indexOf(host) !== -1;
  var debug = /[?&]analytics_debug=1(&|$)/.test(window.location.search);

  if (live && GA4) {
    var tag = document.createElement("script");
    tag.async = true;
    tag.src = "https://www.googletagmanager.com/gtag/js?id=" + GA4;
    document.head.appendChild(tag);

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA4, debug ? { debug_mode: true } : {});
  }

  if (live && CLARITY) {
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", CLARITY);
  }

  if (!live) {
    console.info(
      "[analytics] " + host + " is not a live host (" + (HOSTS.join(", ") || "none set") +
      "). Nothing is sent; events are logged here instead."
    );
  }

  function send(name, params) {
    params = params || {};
    if (!live || debug) console.info("[analytics] " + name, params);
    if (!live) return;
    if (window.gtag) window.gtag("event", name, params);
    // Mirrored into Clarity so recordings can be filtered by the same names.
    if (window.clarity) window.clarity("event", name);
  }

  // Replay anything sent before this file loaded (see lib/analytics.ts).
  var queued = (window.trackEvent && window.trackEvent.q) || [];
  window.trackEvent = send;
  for (var q = 0; q < queued.length; q++) send(queued[q][0], queued[q][1]);

  function linkText(el) {
    var text = (el.textContent || "").replace(/\s+/g, " ").trim();
    // GA4's terms forbid sending email addresses, even the business's own.
    return text.replace(/\S+@\S+/g, "[email]").slice(0, 100);
  }

  // data-track-plan="growth" becomes { plan: "growth" }; data-track-link-type becomes link_type.
  function paramsFrom(el) {
    var params = {};
    for (var key in el.dataset) {
      if (key === "track" || key.indexOf("track") !== 0) continue;
      var name = key.slice(5).replace(/^[A-Z]/, function (c) { return c.toLowerCase(); })
        .replace(/[A-Z]/g, function (c) { return "_" + c.toLowerCase(); });
      params[name] = el.dataset[key];
    }
    return params;
  }

  var chatOpened = false;
  function chatOpen() {
    if (chatOpened) return;
    chatOpened = true;
    send("chat_open", {});
  }

  // One delegated listener covers every link, including ones added later, so no
  // page or component ever needs its own tracking code. Link text and link URL use
  // GA4's built-in parameter names, so they report without custom dimensions.
  document.addEventListener("click", function (event) {
    var target = event.target;
    if (!target || !target.closest) return;

    var tracked = target.closest("[data-track]");
    if (tracked) send(tracked.getAttribute("data-track"), paramsFrom(tracked));

    // The chat widget's launcher lives in a custom element; clicks inside its shadow root arrive retargeted to it.
    if (target.closest("chat-widget")) chatOpen();

    var link = target.closest("a[href]");
    if (!link) return;
    var href = link.getAttribute("href") || "";
    if (/^tel:/i.test(href)) {
      send("phone_click", { link_text: linkText(link), link_url: href });
    } else if (/^mailto:/i.test(href)) {
      send("email_click", { link_text: linkText(link) });
    }
  }, true);

  // When the widget renders in a cross-origin iframe its clicks are invisible, but
  // the page losing focus to that iframe is the closest signal available. Best effort.
  window.addEventListener("blur", function () {
    var active = document.activeElement;
    if (active && active.tagName === "IFRAME" && CHAT_FRAME.test(active.getAttribute("src") || "")) {
      chatOpen();
    }
  });

  // Shows whether a page holds anyone or loses them above the fold.
  var MARKS = [25, 50, 75, 90];
  var reached = {};
  var ticking = false;
  function measureScroll() {
    ticking = false;
    var scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    var percent = (window.scrollY / scrollable) * 100;
    var path = window.location.pathname;
    var seen = reached[path] || (reached[path] = {});
    for (var i = 0; i < MARKS.length; i++) {
      if (percent >= MARKS[i] && !seen[MARKS[i]]) {
        seen[MARKS[i]] = true;
        send("scroll_depth", { percent_scrolled: MARKS[i] });
      }
    }
  }
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(measureScroll);
  }, { passive: true });
})();

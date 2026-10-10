/* Inline the above-the-fold ("critical") CSS of every page and load the full
   stylesheets without blocking the first paint.

   Why: the browser cannot draw anything before every <link rel="stylesheet">
   has arrived. On a phone connection that is the biggest part of the wait
   before the page appears. With the critical rules inline in the HTML, the
   header and hero are drawn as soon as the HTML is in; the complete
   stylesheets are downloaded alongside and take over as soon as they arrive.

   What it does for each page under website/:
     1. Opens the page (served from disk) in headless Chromium at a few
        viewport sizes and collects every CSS rule that applies to an element
        in the first screen.
     2. Writes those rules into <style data-critical> in <head>.
     3. Turns each <link rel="stylesheet"> into a non-blocking preload with a
        <noscript> fallback. The stylesheet order (and thus the cascade) is
        unchanged.

   Run it again after changing any CSS file or the markup of a header/hero:
       node scripts/build-critical-css.js            (all pages)
       node scripts/build-critical-css.js contact.html blog/*.html   (some)
   It is idempotent: re-running replaces the earlier inline block.
   A stale inline block is not dangerous (the full stylesheet still wins at the
   end), it only makes the first paint look slightly different for a moment.

   Needs Playwright with Chromium (globally installed is fine):
       npm i -g playwright && npx playwright install chromium */
"use strict";

var fs = require("fs");
var path = require("path");
var http = require("http");
var zlib = require("zlib");

var ROOT = path.join(__dirname, "..", "website");
var SKIP_DIRS = /^(_backup|previews|api|node_modules)/;
var VIEWPORTS = [
  { width: 390, height: 844, mobile: true },
  { width: 820, height: 1180, mobile: true },
  { width: 1440, height: 900, mobile: false },
  { width: 1920, height: 1080, mobile: false },
];
/* Rules are kept for elements whose box starts above this line (viewport
   height + margin), so a little below the fold is styled too. */
var BELOW_FOLD_MARGIN = 120;

function requirePlaywright() {
  var candidates = ["playwright", path.join(process.env.npm_config_prefix || "", "lib/node_modules/playwright")];
  try { candidates.push(require("child_process").execSync("npm root -g", { encoding: "utf8" }).trim() + "/playwright"); } catch (e) {}
  for (var i = 0; i < candidates.length; i++) {
    try { return require(candidates[i]); } catch (e) {}
  }
  throw new Error("Playwright not found. Install it with: npm i -g playwright && npx playwright install chromium");
}

function listPages(args) {
  if (args.length) {
    return args.map(function (a) { return path.isAbsolute(a) ? a : path.resolve(process.cwd(), a); })
      .filter(function (f) { return /\.html$/.test(f) && fs.existsSync(f); });
  }
  var out = [];
  (function walk(dir) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach(function (d) {
      var rel = path.relative(ROOT, path.join(dir, d.name));
      if (SKIP_DIRS.test(rel)) return;
      if (d.isDirectory()) walk(path.join(dir, d.name));
      else if (/\.html$/.test(d.name)) out.push(path.join(dir, d.name));
    });
  })(ROOT);
  return out.sort();
}

/* Static file server for the headless browser (gzip is not needed here). */
var MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".avif": "image/avif", ".svg": "image/svg+xml",
  ".ico": "image/x-icon", ".woff2": "font/woff2", ".mp4": "video/mp4" };
function startServer(cb) {
  var srv = http.createServer(function (req, res) {
    var p = decodeURIComponent(req.url.split("?")[0]);
    if (p.endsWith("/")) p += "index.html";
    var file = path.join(ROOT, p);
    fs.readFile(file, function (err, data) {
      if (err) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream" });
      res.end(data);
    });
  });
  srv.listen(0, "127.0.0.1", function () { cb(srv, "http://127.0.0.1:" + srv.address().port); });
}

/* Runs inside the page: returns the CSS text of every rule (from the page's
   own stylesheets) that applies to something in the first screen. */
function collectCritical(margin) {
  var vh = window.innerHeight + margin;
  var STATE_PSEUDO = /::?(hover|focus|focus-visible|focus-within|active|visited|target|disabled|enabled|checked|invalid|valid|required|optional|placeholder-shown|read-only|read-write|indeterminate|autofill|user-invalid|open|modal|fullscreen|popover-open|placeholder|before|after|marker|selection|first-letter|first-line|backdrop|file-selector-button|-webkit-[a-z-]+|-moz-[a-z-]+|cue|part\([^)]*\)|slotted\([^)]*\))\b/g;

  function visibleAncestor(el) {
    while (el && el !== document.documentElement) {
      var r = el.getBoundingClientRect();
      if (r.width || r.height) return r;
      el = el.parentElement;
    }
    return null;
  }
  function inFirstScreen(el) {
    if (el === document.documentElement || el === document.body) return true;
    var r = el.getBoundingClientRect();
    if (!r.width && !r.height) {
      /* Hidden or collapsed (display:none, empty): keep the rule when the
         element sits inside something that is on screen, e.g. the closed
         mobile menu inside the header. Otherwise it would pop up unstyled. */
      var a = visibleAncestor(el.parentElement);
      return !!a && a.top < vh && a.bottom > 0;
    }
    return r.top < vh && r.bottom > -margin;
  }
  function selectorMatches(selectorText) {
    var sel = selectorText.replace(STATE_PSEUDO, "").replace(/:not\(\s*\)/g, "").replace(/::?(?=[,\s)]|$)/g, "");
    sel = sel.replace(/\s*,\s*,\s*/g, ",").replace(/^\s*,|,\s*$/g, "");
    if (!sel.trim() || sel.trim() === ">") return true;
    var els;
    try { els = document.querySelectorAll(sel); } catch (e) { return true; }
    for (var i = 0; i < els.length; i++) if (inFirstScreen(els[i])) return true;
    return false;
  }
  /* url() values are written relative to the stylesheet; inline in the HTML
     they must be root-relative instead (the site is served from the root). */
  var sheetHref = "";
  function fixUrls(text) {
    return text.replace(/url\((['"]?)([^'")]+)\1\)/g, function (m, q, u) {
      if (/^(data:|https?:|\/)/.test(u)) return m;
      return 'url("' + new URL(u, sheetHref).pathname + '")';
    });
  }
  function walk(rules, out) {
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      var type = r.constructor.name;
      if (type === "CSSStyleRule") {
        if (selectorMatches(r.selectorText)) out.push({ key: r.cssText, text: fixUrls(r.cssText) });
      } else if (type === "CSSMediaRule") {
        if (/print/.test(r.media.mediaText) && !/screen/.test(r.media.mediaText)) continue;
        var inner = [];
        walk(r.cssRules, inner);
        if (inner.length) out.push({ key: "@media " + r.media.mediaText, text: "@media " + r.media.mediaText + "{", children: inner });
      } else if (type === "CSSSupportsRule" || type === "CSSLayerBlockRule" || type === "CSSContainerRule") {
        var inner2 = [];
        walk(r.cssRules, inner2);
        if (inner2.length) {
          var head = r.cssText.slice(0, r.cssText.indexOf("{"));
          out.push({ key: head, text: head + "{", children: inner2 });
        }
      } else if (type === "CSSFontFaceRule" || type === "CSSKeyframesRule" || type === "CSSPropertyRule" || type === "CSSFontFeatureValuesRule") {
        out.push({ key: r.cssText, text: fixUrls(r.cssText) });
      }
      /* @import and other rule types are not used in this site. */
    }
  }
  var out = [];
  var sheets = Array.prototype.slice.call(document.styleSheets);
  sheets.forEach(function (sheet) {
    if (!sheet.ownerNode || sheet.ownerNode.hasAttribute("data-critical")) return;
    if (sheet.ownerNode.tagName === "STYLE") return; /* page-local <style> blocks are already inline */
    var rules;
    try { rules = sheet.cssRules; } catch (e) { return; }
    sheetHref = sheet.href;
    var part = [];
    walk(rules, part);
    out.push({ key: "sheet:" + sheet.href, text: "", children: part, sheet: true });
  });
  return out;
}

/* Merge rule trees from several viewports, keeping source order. */
function mergeTrees(target, source) {
  source.forEach(function (node) {
    var existing = null;
    for (var i = 0; i < target.length; i++) if (target[i].key === node.key) { existing = target[i]; break; }
    if (!existing) { target.push(JSON.parse(JSON.stringify(node))); return; }
    if (node.children) mergeTrees(existing.children, node.children);
  });
}
function serialize(nodes) {
  return nodes.map(function (n) {
    if (n.sheet) return serialize(n.children);
    if (n.children) return n.text + serialize(n.children) + "}";
    return n.text;
  }).join("");
}
/* The merged list must follow source order, but a rule seen only in a later
   viewport is appended after rules that come later in the source. Resort each
   level by the rule's position in the stylesheet, which we learn from the
   full rule list of the first viewport. */
function orderLike(nodes, reference) {
  var pos = {};
  reference.forEach(function (n, i) { pos[n.key] = i; });
  nodes.sort(function (a, b) { return (pos[a.key] === undefined ? 1e9 : pos[a.key]) - (pos[b.key] === undefined ? 1e9 : pos[b.key]); });
  nodes.forEach(function (n) {
    if (!n.children) return;
    var ref = null;
    for (var i = 0; i < reference.length; i++) if (reference[i].key === n.key) { ref = reference[i]; break; }
    if (ref && ref.children) orderLike(n.children, ref.children);
  });
}

/* Full rule list (no viewport filter) used only for ordering. */
function collectAll() {
  function walk(rules, out) {
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i], type = r.constructor.name;
      if (type === "CSSMediaRule") { var c = []; walk(r.cssRules, c); out.push({ key: "@media " + r.media.mediaText, children: c }); }
      else if (type === "CSSSupportsRule" || type === "CSSLayerBlockRule" || type === "CSSContainerRule") { var c2 = []; walk(r.cssRules, c2); out.push({ key: r.cssText.slice(0, r.cssText.indexOf("{")), children: c2 }); }
      else out.push({ key: r.cssText });
    }
  }
  var out = [];
  Array.prototype.slice.call(document.styleSheets).forEach(function (sheet) {
    if (!sheet.ownerNode || sheet.ownerNode.tagName === "STYLE") return;
    var rules; try { rules = sheet.cssRules; } catch (e) { return; }
    var part = []; walk(rules, part);
    out.push({ key: "sheet:" + sheet.href, children: part });
  });
  return out;
}

var LINK_RE = /<link rel="stylesheet" href="([^"]+)"\s*\/?>/g;
var PRELOAD_RE = /<link rel="preload" href="([^"]+)" as="style" onload="this\.onload=null;this\.rel='stylesheet'"\s*\/?>\s*<noscript><link rel="stylesheet" href="\1"\s*\/?><\/noscript>/g;
var STYLE_RE = /\s*<style data-critical>[\s\S]*?<\/style>/;

/* Put the stylesheet links back to plain <link rel="stylesheet"> so the
   browser (and the collector) sees the page as it was. */
function plainLinks(html) {
  return html.replace(PRELOAD_RE, '<link rel="stylesheet" href="$1" />');
}
function asyncLinks(html) {
  return html.replace(LINK_RE, function (m, href) {
    return '<link rel="preload" href="' + href + '" as="style" onload="this.onload=null;this.rel=\'stylesheet\'" />' +
      '<noscript><link rel="stylesheet" href="' + href + '" /></noscript>';
  });
}

function injectCritical(html, css) {
  html = html.replace(STYLE_RE, "");
  html = plainLinks(html);
  var m = LINK_RE.exec(html);
  LINK_RE.lastIndex = 0;
  if (!m) return null;
  var block = "<style data-critical>" + css + "</style>\n  ";
  html = html.slice(0, m.index) + block + html.slice(m.index);
  return asyncLinks(html);
}

async function main() {
  var pw = requirePlaywright();
  var pages = listPages(process.argv.slice(2));
  if (!pages.length) { console.error("No pages found."); process.exit(1); }
  var originals = {};
  /* Serve the plain version of every page while collecting, so the inline
     block from an earlier run does not influence the result. */
  pages.forEach(function (f) {
    var html = fs.readFileSync(f, "utf8");
    originals[f] = html;
    fs.writeFileSync(f, plainLinks(html.replace(STYLE_RE, "")));
  });
  var restore = function () { Object.keys(originals).forEach(function (f) { fs.writeFileSync(f, originals[f]); }); };
  process.on("SIGINT", function () { restore(); process.exit(1); });

  var browser = await pw.chromium.launch();
  var server, base;
  await new Promise(function (resolve) { startServer(function (s, b) { server = s; base = b; resolve(); }); });
  try {
    for (var i = 0; i < pages.length; i++) {
      var file = pages[i];
      var rel = path.relative(ROOT, file).split(path.sep).join("/");
      var merged = [], reference = null;
      for (var v = 0; v < VIEWPORTS.length; v++) {
        var vp = VIEWPORTS[v];
        var ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.mobile, hasTouch: vp.mobile, deviceScaleFactor: vp.mobile ? 2 : 1 });
        var page = await ctx.newPage();
        await page.route(/\.(mp4|webm)(\?|$)/, function (route) { route.abort(); });
        await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, function (route) { route.abort(); });
        await page.goto(base + "/" + rel, { waitUntil: "load", timeout: 60000 });
        await page.waitForTimeout(250);
        if (!reference) reference = await page.evaluate(collectAll);
        var tree = await page.evaluate(collectCritical, BELOW_FOLD_MARGIN);
        mergeTrees(merged, tree);
        await ctx.close();
      }
      orderLike(merged, reference);
      var css = serialize(merged);
      var html = injectCritical(originals[file], css);
      if (html === null) { console.log("skip (no stylesheet link): " + rel); continue; }
      originals[file] = html;
      fs.writeFileSync(file, html);
      console.log(rel + "  critical " + (css.length / 1024).toFixed(1) + " KB (" + (zlib.gzipSync(css).length / 1024).toFixed(1) + " KB gzip)");
    }
  } finally {
    restore();
    await browser.close();
    server.close();
  }
}

main().catch(function (e) { console.error(e); process.exit(1); });

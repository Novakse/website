/* Novakse travel guide.
   Opens a personal guide with the code from the customer's link and shows:
   - Sweden with the booked province highlighted; tapping it flies through the
     clouds into the region;
   - the region map with the places of this trip (accommodation, ice entry
     points with their swept tracks, ski areas, husky tours);
   - the journey step by step (packing list, airport, shuttle, car rental,
     driving route, check-in), with each step drawn on the map.
   The private places never sit in this file or the page: /api/reisgids returns
   them only for a valid, signed code. */
(function () {
  "use strict";

  var API_URL = "/api/reisgids";
  var STORE_KEY = "novakse-reisgids-code";
  var PACK_KEY = "novakse-reisgids-paklijst";
  var SHAPES_URL = "/reisgids/vormen/";
  var SWEDEN_BOUNDS = [[10.6, 55.2], [24.2, 69.1]];
  var CLOSEST_ZOOM = 16;          // closest zoom a tap on a group or a place moves to (the map allows 16.5)
  var PIN_APART = 60;             // px: least distance between a pin and the selected pin next to it
  var CLOSE_ZOOM = 13.5;          // from this zoom markers only merge when they almost cover each other
  var CLOSE_GROUP_DISTANCE = 44;  // px
  var GROUP_DISTANCE = 54;        // px: markers closer than this merge into a group
  var SMALL_GROUP_DISTANCE = 30;  // px: the same for small pins, which only merge with each other
  var HALFWAY_TOWN_ZOOM = 9;      // from this zoom a town in view counts as seen (no halfway stop needed)
  var HALFWAY_MIN_JUMP = 2.5;     // a group tap that zooms in further than this stops halfway first
  var LABEL_ZOOM = 9.3;           // from this zoom the names show under the markers
  var SMALL_LABEL_ZOOM = 12;      // the same for the small pins
  var KEY_TOWN_KM = 8;            // a town this close to one of the guest's places gets a bold name
  var KEY_TOWN_ZOOM = 5;          // from this zoom the bold town names show (as the map's own town names)
  var KEY_TOWN_GAP = 6;           // px between a bold town name and its dot
  var PIN_BOX_PAD = 3;            // px kept free of map labels around a marker
  var MARK_ZOOM = 11.5;           // from this zoom km posts and other track marks show
  var PLACEHOLDER = "[INVULLEN";  // owner text that is not written yet (never shown live)

  var KINDS = {
    verblijf: { label: "Verblijf", filter: "Verblijf", art: "verblijf" },
    begeleiding: { label: "Begeleiding Novakse", filter: "Begeleiding", art: "begeleiding" },
    opstap: { label: "Opstapplek", filter: "Opstapplekken", art: "schaatsen" },
    schaatsen: { label: "Schaatsijs", filter: "Schaatsijs", art: "schaatsen" },
    skien: { label: "Skigebied", filter: "Skiën", art: "skien" },
    langlauf: { label: "Langlaufen", filter: "Langlaufen", art: "langlauf" },
    husky: { label: "Husky's", filter: "Husky's", art: "husky" },
    sneeuwscooter: { label: "Sneeuwscooter", filter: "Sneeuwscooter", art: "sneeuwscooter" },
    bezienswaardigheid: { label: "Bezienswaardigheid", filter: "Bezienswaardigheden", art: "stockholm", small: true },
    dalahast: { label: "Dalapaardjes", filter: "Dalapaardjes", art: "dalahast", small: true },
    supermarkt: { label: "Supermarkt", filter: "Supermarkten", art: "supermarkt", small: true, fromZoom: 10.5 },
    restaurant: { label: "Restaurant", filter: "Restaurants", art: "restaurant", small: true, fromZoom: 10.5 },
    ziekenhuis: { label: "Ziekenhuis", filter: "Ziekenhuizen", art: "ziekenhuis" },
    nooddienst: { label: "Zorg dichtbij", filter: "Zorg dichtbij", art: "nooddienst", small: true, fromZoom: 10.5 },
    vliegveld: { label: "Vliegveld", filter: "Vliegveld", art: "vliegtuig" },
    autoverhuur: { label: "Autoverhuur", filter: "Autoverhuur", art: "autoverhuur" },
    boot: { label: "Boot", filter: "Boot", art: "boot" },
    overig: { label: "Plek", filter: "Overig", art: "sneeuwvlok" }
  };
  var KIND_ORDER = ["verblijf", "begeleiding", "vliegveld", "autoverhuur", "boot", "opstap", "schaatsen", "skien", "langlauf", "husky", "sneeuwscooter", "bezienswaardigheid", "dalahast", "supermarkt", "restaurant", "ziekenhuis", "nooddienst", "overig"];

  var STEP_ART = {
    paklijst: "paklijst", vertrek: "vliegtuig", vliegveld: "vliegtuig", shuttle: "shuttlebus",
    autoverhuur: "autoverhuur", rijden: "rijden", inchecken: "inchecken", overig: "sneeuwvlok"
  };
  var POINT_ART = {
    vliegveld: "vliegtuig", bushalte: "shuttlebus", autoverhuur: "autoverhuur",
    verblijf: "verblijf", parkeren: "rijden", overig: "sneeuwvlok"
  };
  var TRACK_COLORS = {
    blauw: "#1f5f8b", groen: "#2f7d45", rood: "#a63a2b",
    oranje: "#c26a1f", zwart: "#14181a", paars: "#6a4a8a"
  };
  var ROUTE_COLOR = "#7a4620";
  var ROUTE_DASH = { vlucht: [2, 2], bus: [1.4, 1.2], lopen: [0.1, 1.8] };
  var NAV_MODES = { auto: ["driving", "d"], lopen: ["walking", "w"], ov: ["transit", "r"] };

  var REGION_ART = { dalarna: "dalahast", stockholm: "stockholm", norrbotten: "noorderlicht", helsinki: "helsinki", punkaharju: "dennen" };
  /* Same colours as the drawn overview map (js/atlas.js). */
  var REGION_COLORS = { dalarna: ["#f2b064", "#cf7a33"], stockholm: ["#509ea5", "#245d74"], norrbotten: ["#8ec5b1", "#398798"], helsinki: ["#2a7188", "#1b3e51"], punkaharju: ["#fbca76", "#aa692e"] };
  /* The dive into a region: one flat zoom from the drawn map down to the
     region (see diveFromAtlas), `ms` plus `msPerZoom` for every zoom level
     on the way (at most `maxMs`). The drawing does the first `handZoom`
     levels, the live map the rest, while the drawing lying exactly on it
     dissolves (`fadeMs`; slower when the drawing could not be taken along
     under the live map). */
  var DIVE = { ms: 1250, msPerZoom: 190, maxMs: 2300, handZoom: 1, overZoom: 0.6, fadeMs: 260, fadeMsBare: 800 };
  /* Regions that lie under snow once you are there (see letItSnow), and the
     map's colours under the snow per layer. The land goes white, but the map
     keeps its contrast: lakes and sea turn a clear ice blue with a snowy
     shore, the forest stays a cool grey and the hill shading stays. */
  var SNOW_REGIONS = { norrbotten: true };
  var SNOW_PAINT = [
    ["land", "background-color", "#fbfcfc"],
    ["forest", "fill-color", "#e0e8ea"],
    ["residential", "fill-color", "#eef1f2"],
    ["water", "fill-color", "#a6c9d8"],
    ["water", "fill-outline-color", ["interpolate", ["linear"], ["zoom"], 6, "#a6c9d8", 8, "#6e9db2"]],
    ["water-shore", "line-color", "#ffffff"],
    ["waterway", "line-color", "#a6c9d8"],
    ["road-path", "line-color", "#d3dbdf"],
    ["road-major-casing", "line-color", "#cdd6da"],
    ["place-village", "text-halo-color", "#fbfcfc"],
    ["place-town", "text-halo-color", "#fbfcfc"],
    ["place-town-early", "text-halo-color", "#fbfcfc"],
    ["place-city-overview", "text-halo-color", "#fbfcfc"]
  ];
  var SNOW_TINT = 0.4; // what is left of the province tint under the snow

  /* Ski areas with a 3D view (js/skigebied3d.js, loaded only when opened):
     place id -> scene, and where the live map tilts to before handing over
     (the middle of the view, looking up the slopes like the piste map). */
  var SKI_3D = {
    "skien-romme": { scene: "romme", center: [15.4013, 60.3862], bearing: 115 },
    // ijsbanen: the place whose swept tracks are drawn on the lake in the background
    "skien-gronklitt": { scene: "gronklitt", center: [14.5452, 61.2178], bearing: 65, ijsbanen: "opstap-orsa" },
    // The ski areas around Sälen (2026-11-01), each with its own pin
    "skien-lindvallen": { scene: "lindvallen", center: [13.165, 61.158], bearing: 90 },
    "skien-tandadalen": { scene: "tandadalen", center: [12.996, 61.176], bearing: 90 },
    "skien-stoten": { scene: "stoten", center: [12.888, 61.266], bearing: 90 },
    "skien-klappen": { scene: "klappen", center: [13.356, 61.030], bearing: 90 },
    // Bjursås Berg & Sjö (2026-11-04): the middle of the slopes; the place's own pin sits on the access road
    "skien-bjursas": { scene: "bjursas", center: [15.455, 60.761], bearing: 90 }
  };
  var SKI_3D_ZOOM = 13.5;          // zooming in this far on such a place opens its 3D view
  var SKI_3D_VERSION = "202611091200";

  /* The satellite map (Joey 2026-11-07: guests switch between the drawn map
     and the satellite map themselves). The same live map with the same pins,
     tracks, routes and 3D ski areas; only the ground is real: our own tiles of
     cloud-free winter pictures (NASA MODIS for the whole north, Copernicus
     Sentinel-2 at 10 m around the places of the guide), made beforehand by
     brand_assets/reisgids/satelliet/tegels.py into /reisgids/satelliet/. */
  var SAT_KEY = "novakse-reisgids-kaartsoort";
  var SAT_DIR = "/reisgids/satelliet/";
  var SAT_VERSION = "202611091200";
  var SAT_MAXZOOM = 12;            // the sharpest tiles (about 9 m per pixel in Dalarna)
  var SAT_NIGHT = "#050c18";       // beyond the pictures, as at the edge of the tiles
  var SAT_HALO = "rgba(5, 12, 24, 0.8)";
  var SAT_CREDIT = "Satellietbeeld: bevat aangepaste Copernicus Sentinel-gegevens 2021-2022, NASA GIBS (MODIS)";
  /* Map layers the pictures take the place of. */
  var SAT_HIDE = ["forest", "residential", "relief", "water", "water-shore", "waterway", "road-path"];
  /* The rest of the map stays, readable on the pictures: light names on a
     dark halo, light roads and borders. */
  var SAT_PAINT = [
    ["land", "background-color", SAT_NIGHT],
    ["road-minor", "line-color", "rgba(255, 255, 255, 0.42)"],
    ["road-major-casing", "line-color", "rgba(5, 12, 24, 0.35)"],
    ["road-major", "line-color", "rgba(255, 248, 236, 0.82)"],
    ["border-country", "line-color", "rgba(255, 255, 255, 0.7)"],
    ["border-county", "line-color", "rgba(255, 255, 255, 0.85)"],
    ["water-name", "text-color", "#d6eaf3"],
    ["water-name", "text-halo-color", SAT_HALO],
    ["place-village", "text-color", "#eef3f5"],
    ["place-village", "text-halo-color", SAT_HALO],
    ["place-town", "text-color", "#ffffff"],
    ["place-town", "text-halo-color", SAT_HALO],
    ["place-town-early", "text-color", "#ffffff"],
    ["place-town-early", "text-halo-color", SAT_HALO],
    ["place-city-overview", "text-color", "#eef3f5"],
    ["place-city-overview", "text-halo-color", SAT_HALO],
    ["place-country", "text-color", "#eef3f5"],
    ["place-country", "text-halo-color", SAT_HALO],
    ["place-key-dot", "circle-color", "#ffffff"],
    ["place-key-dot", "circle-stroke-color", "#132f3a"],
    ["provincie-sluier", "fill-color", SAT_NIGHT]
  ];
  var SAT_TINT = 0.5;              // what is left of the province tint on the pictures
  var SAT_VEIL = 0.5;              // the darker veil outside the region on the pictures

  /* Purely decorative drawings in empty stretches of the region map, [lng, lat]. */
  var DECOR_REGION = {
    dalarna: [
      { art: "eland", at: [14.62, 60.36] },
      { art: "den", at: [13.25, 61.35], small: true },
      { art: "den", at: [16.15, 61.25] },
      { art: "sneeuwvlok", at: [14.95, 61.55], small: true }
    ]
  };

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (id) { return document.getElementById(id); };

  var els = {
    gate: $("gate"), gateStatus: $("gateStatus"), codeForm: $("codeForm"), codeInput: $("codeInput"), gateHelp: $("gateHelp"),
    app: $("app"), main: document.querySelector(".rg-main"), map: $("kaart"), back: $("backBtn"), menuBtn: $("menuBtn"),
    welcome: $("welcome"), welcomeTitle: $("welcomeTitle"), journeyList: $("journeyList"), regionList: $("regionList"),
    sheet: $("sheet"), sheetList: $("sheetList"), sheetEyebrow: $("sheetEyebrow"), sheetTitle: $("sheetTitle"),
    carRoutes: $("carRoutes"), filters: $("filters"), placeList: $("placeList"),
    detail: $("detail"), detailClose: $("detailClose"), detailArt: $("detailArt"), detailKind: $("detailKind"),
    detailTitle: $("detailTitle"), detailDistance: $("detailDistance"), detailInfo: $("detailInfo"),
    detailTracks: $("detailTracks"), detailRoutes: $("detailRoutes"),
    detailPhotos: $("detailPhotos"), detailPhotoStrip: $("detailPhotoStrip"), detailPhotoDots: $("detailPhotoDots"),
    detailTipWrap: $("detailTipWrap"), detailTip: $("detailTip"), detailFacts: $("detailFacts"),
    routeGoogle: $("routeGoogle"), routeApple: $("routeApple"), zoomBtn: $("zoomBtn"), detailLink: $("detailLink"),
    journey: $("journey"), journeyName: $("journeyName"), journeyClose: $("journeyClose"), journeyDone: $("journeyDone"),
    stepCount: $("stepCount"), stepBody: $("stepBody"), stepArt: $("stepArt"), stepTitle: $("stepTitle"),
    stepText: $("stepText"), stepList: $("stepList"), stepPack: $("stepPack"), stepTipWrap: $("stepTipWrap"),
    stepTip: $("stepTip"), stepFacts: $("stepFacts"), stepPlaces: $("stepPlaces"), stepActions: $("stepActions"),
    stepRouteGoogle: $("stepRouteGoogle"), stepRouteApple: $("stepRouteApple"), stepPrev: $("stepPrev"), stepNext: $("stepNext"),
    menu: $("menu"), menuClose: $("menuClose"), menuTitle: $("menuTitle"), menuValid: $("menuValid"),
    installBlock: $("installBlock"), installText: $("installText"), installBtn: $("installBtn"), logout: $("logoutBtn"),
    journeyPuck: $("journeyPuck"),
    sheetToggle: $("sheetToggle"), journeyToggle: $("journeyToggle")
  };

  var state = {
    code: null,
    guide: null,
    map: null,
    mode: null,           // "overzicht" | "regio" | "reis"
    region: null,
    place: null,
    filter: "alle",
    journey: null,
    step: -1,
    markers: {},          // key -> { marker, el }  (places in the region view)
    marks: [],            // track markings (km posts, rescue points, parking)
    stepMarkers: [],      // markers of the current journey step
    pinBoxKey: "",        // the label boxes last given to the map (see layoutLabels)
    keyTowns: [],         // the bold town names: { name, at, rank, marker, el, ... } (see keyTowns)
    atlas: null,
    decor: [],
    shapes: {},           // region id -> GeoJSON feature of the province
    clouds: null,
    routeAnim: null,
    carRoute: null,       // the example car route on the region map: { option, markers, pins }
    carAnim: null,
    trackAnim: null,
    trackHold: null,
    diving: false,        // a scripted tilted camera move is running
    diveToken: 0,
    diveLiveMs: 0,        // ms after the start of a dive at which the live map shows
    stopPrefetch: function () {}, // stops the live map loading ahead for a dive (see prefetch)
    snowTimer: null,      // the snow about to start (see snowSoon)
    snowLook: false,      // the map shows its snow colours
    lookBase: {},         // "layer|property" -> the map's own value, before snow or pictures (see paintLook)
    satellite: readStored(SAT_KEY) === "satelliet", // the satellite map instead of the drawn one
    satBadges: null,      // the region badges on the satellite overview
    snowfall: null,       // the running snowfall ({ stop })
    snowTintTimer: null,
    ski3d: null,          // the open 3D view of a ski area ({ place, view, closing })
    ski3dToken: 0,        // a newer open or close cancels the one before
    mapAsleep: false,     // the map does not draw while the 3D view covers it (sleepMap)
    installPrompt: null
  };

  /* ------------------------------------------------------------------------
     Small helpers
     ------------------------------------------------------------------------ */
  function art(name) {
    var lib = window.NovakseIllustraties || {};
    var span = document.createElement("span");
    span.className = "rg-art";
    span.setAttribute("aria-hidden", "true");
    span.innerHTML = lib[name] || lib.sneeuwvlok || "";
    return span;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function isCoord(c) {
    return Array.isArray(c) && c.length === 2 &&
      isFinite(c[0]) && isFinite(c[1]) && Math.abs(c[0]) <= 180 && Math.abs(c[1]) <= 90;
  }
  function isLine(l) { return Array.isArray(l) && l.length >= 2 && l.every(isCoord); }
  function str(v) { return typeof v === "string" ? v : ""; }
  function strList(v) { return Array.isArray(v) ? v.filter(function (s) { return typeof s === "string" && s; }) : []; }

  function kindOf(place) { return KINDS[place.soort] ? place.soort : "overig"; }
  /* Less important places get a small pin ("klein" in the data, or their
     kind's `small`). Kinds with `fromZoom` only show from that zoom on, or
     when the guest filters on them: from afar they would crowd the
     accommodation they lie around. */
  function isSmall(place) { return place.klein === true || !!KINDS[kindOf(place)].small; }
  function onlyClose(place) { return !!KINDS[kindOf(place)].fromZoom; }
  function filteredClose() { return !!KINDS[state.filter] && !!KINDS[state.filter].fromZoom; }
  /* A place can have its own pin drawing (`pin`), e.g. each ski area in Sälen; otherwise the one of its kind. */
  function artOf(place) {
    var lib = window.NovakseIllustraties || {};
    return place.pin && lib[place.pin] ? place.pin : KINDS[kindOf(place)].art;
  }
  function pinClass(place) { return place.pin && /^[A-Za-z]+$/.test(place.pin) ? " rg-pin--" + place.pin : ""; }

  function formatDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    if (!m) return "";
    var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12));
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  }

  function isWide() { return window.matchMedia("(min-width: 64rem)").matches; }
  function isApple() { return /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent); }
  function duration(ms) { return reduceMotion ? 0 : ms; }

  function readStored(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function writeStored(key, value) {
    try { if (value) localStorage.setItem(key, value); else localStorage.removeItem(key); } catch (e) { /* private mode */ }
  }

  /* Accepts a bare code or a whole pasted link. */
  function extractCode(text) {
    var value = String(text || "").trim();
    var m = /[?&]code=([^&#\s]+)/.exec(value);
    if (m) value = decodeURIComponent(m[1]);
    return /^[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+$/.test(value) && value.length < 800 ? value : null;
  }

  /* Keep the code in the address bar, so "Add to home screen" opens this guide. */
  function putCodeInUrl(code) {
    var params = new URLSearchParams(location.search);
    if (params.get("code") === code) return;
    params.set("code", code);
    history.replaceState(null, "", location.pathname + "?" + params.toString() + location.hash);
  }

  /* Text that may still be a placeholder of the owner (only visible locally;
     the live API drops such steps). */
  function setRich(node, value) {
    var text = str(value);
    node.classList.toggle("is-invullen", text.indexOf(PLACEHOLDER) !== -1);
    node.textContent = text.indexOf(PLACEHOLDER) !== -1
      ? "Nog in te vullen: " + text.replace(/^\[INVULLEN[^:]*:\s*/, "").replace(/\]\s*$/, "")
      : text;
    node.hidden = !text;
  }

  function mapsLinks(to, from, mode) {
    var m = NAV_MODES[mode] || NAV_MODES.auto;
    var dest = to[1].toFixed(6) + "," + to[0].toFixed(6);
    var google = "https://www.google.com/maps/dir/?api=1&destination=" + dest + "&travelmode=" + m[0];
    var apple = "https://maps.apple.com/?daddr=" + dest + "&dirflg=" + m[1];
    if (from) {
      var orig = from[1].toFixed(6) + "," + from[0].toFixed(6);
      google += "&origin=" + orig;
      apple += "&saddr=" + orig;
    }
    return { google: google, apple: apple };
  }

  /* ------------------------------------------------------------------------
     Opening screen
     ------------------------------------------------------------------------ */
  function gate(stand, message, options) {
    options = options || {};
    els.gate.dataset.stand = stand;
    els.gateStatus.textContent = message;
    els.codeForm.hidden = !options.form;
    els.gateHelp.hidden = !options.help;
    if (options.form && options.prefill) els.codeInput.value = options.prefill;
  }

  /* Light snow on the opening screen: three depths of flakes (far ones
     small, slow and faint), drawn on one canvas; it stops when the opening
     screen has gone. */
  function startSnow() {
    if (reduceMotion) return;
    var canvas = el("canvas", "rg-gate__snow");
    canvas.setAttribute("aria-hidden", "true");
    els.gate.insertBefore(canvas, els.gate.firstChild);
    var ctx = canvas.getContext("2d");
    var ratio = Math.min(2, window.devicePixelRatio || 1);
    var w = 0, h = 0, flakes = [], last = null, frameId = null;
    function size() {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * ratio); canvas.height = Math.round(h * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    size();
    var count = Math.round(Math.min(110, w * h / 9000));
    for (var i = 0; i < count; i++) {
      var depth = i % 3; // 0 far, 2 near
      flakes.push({
        x: Math.random() * w, y: Math.random() * h,
        r: 0.6 + depth * 0.7 + Math.random() * 0.6,
        speed: 10 + depth * 14 + Math.random() * 8,
        sway: Math.random() * Math.PI * 2,
        alpha: 0.25 + depth * 0.2
      });
    }
    window.addEventListener("resize", size);
    function frame(now) {
      var dt = last === null ? 0 : Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, w, h);
      flakes.forEach(function (f) {
        f.y += f.speed * dt;
        f.sway += dt * 0.8;
        var x = f.x + Math.sin(f.sway) * 6 * f.r;
        if (f.y > h + 4) { f.y = -4; f.x = Math.random() * w; }
        ctx.globalAlpha = f.alpha;
        ctx.fillStyle = "#f4f2ed";
        ctx.beginPath();
        ctx.arc(x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      });
      if (els.gate.classList.contains("is-weg") && !startSnow.leaving) {
        startSnow.leaving = true;
        window.setTimeout(function () {
          window.cancelAnimationFrame(frameId);
          window.removeEventListener("resize", size);
          canvas.remove();
        }, 1200);
      }
      frameId = window.requestAnimationFrame(frame);
    }
    frameId = window.requestAnimationFrame(frame);
  }

  function openGuide(code) {
    gate("laden", "Je reisgids wordt geopend...");
    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code }),
      cache: "no-store",
      credentials: "omit"
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (body) {
        return { status: res.status, body: body };
      });
    }).then(function (result) {
      if (result.status === 200 && result.body && Array.isArray(result.body.regios)) {
        state.code = code;
        writeStored(STORE_KEY, code);
        putCodeInUrl(code);
        start(clean(result.body));
        return;
      }
      var fout = result.body && result.body.fout;
      if (fout === "verlopen") {
        writeStored(STORE_KEY, null);
        var tot = formatDate(result.body.tot);
        gate("fout", tot ? "Deze reisgids was geldig tot en met " + tot + "." : "Deze reisgids is verlopen.", { help: true });
      } else if (fout === "ingetrokken") {
        writeStored(STORE_KEY, null);
        gate("fout", "Deze reisgids is niet meer actief.", { help: true });
      } else if (fout === "ongeldig") {
        writeStored(STORE_KEY, null);
        gate("fout", "Deze code klopt niet. Gebruik de persoonlijke link uit je bevestiging.", { form: true, help: true });
      } else {
        gate("fout", "De reisgids is even niet bereikbaar. Probeer het straks opnieuw.", { form: true, help: true, prefill: code });
      }
    }).catch(function () {
      gate("fout", "Geen verbinding. Controleer je internet en probeer het opnieuw.", { form: true, help: true, prefill: code });
    });
  }

  /* Only keep well-formed data; everything is shown as text. */
  function clean(body) {
    var regions = body.regios.filter(function (r) {
      return r && typeof r.id === "string" && typeof r.naam === "string";
    }).map(function (r) {
      return {
        id: r.id,
        naam: r.naam,
        ondertitel: str(r.ondertitel),
        centrum: isCoord(r.centrum) ? r.centrum : null,
        zoom: isFinite(r.zoom) ? r.zoom : 8,
        plekken: (Array.isArray(r.plekken) ? r.plekken : []).filter(function (p) {
          return p && typeof p.id === "string" && typeof p.naam === "string" && isCoord(p.coord);
        }).map(function (p) {
          p.banen = (Array.isArray(p.banen) ? p.banen : []).filter(function (b) {
            return b && typeof b.naam === "string" && isLine(b.lijn);
          });
          p.markeringen = (Array.isArray(p.markeringen) ? p.markeringen : []).filter(function (m) {
            return m && typeof m.naam === "string" && isCoord(m.coord);
          });
          // Site photos by name only (always under /images/), with their sizes from `bouw`.
          p.fotos = (Array.isArray(p.fotos) ? p.fotos : []).filter(function (f) {
            return f && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(f.beeld) && typeof f.alt === "string" &&
              Array.isArray(f.breedtes) && f.breedtes.length > 0 && f.breedtes.every(function (w) { return w > 0 && w % 1 === 0; });
          }).map(function (f) {
            return {
              beeld: f.beeld,
              alt: f.alt,
              breedtes: f.breedtes,
              focus: /^\d{1,3}% \d{1,3}%$/.test(f.focus) ? f.focus : "",
              sfeerbeeld: f.sfeerbeeld === true
            };
          });
          return p;
        })
      };
    });

    var journeys = (Array.isArray(body.reisverlopen) ? body.reisverlopen : []).filter(function (j) {
      return j && typeof j.id === "string" && typeof j.naam === "string" && Array.isArray(j.stappen);
    }).map(function (j) {
      return {
        id: j.id,
        naam: j.naam,
        stappen: j.stappen.filter(function (s) {
          return s && typeof s.id === "string" && typeof s.titel === "string";
        }).map(function (s) {
          return {
            id: s.id,
            soort: STEP_ART[s.soort] ? s.soort : "overig",
            titel: s.titel,
            tekst: str(s.tekst),
            lijst: strList(s.lijst),
            groepen: (Array.isArray(s.groepen) ? s.groepen : []).filter(function (g) {
              return g && typeof g.titel === "string";
            }).map(function (g) { return { titel: g.titel, items: strList(g.items) }; }),
            tip: str(s.tip),
            plekken: strList(s.plekken),
            punten: (Array.isArray(s.punten) ? s.punten : []).filter(function (p) {
              return p && typeof p.naam === "string" && isCoord(p.coord);
            }),
            route: s.route && isLine(s.route.lijn) ? s.route : null,
            navigatie: s.navigatie && isCoord(s.navigatie.naar) ? s.navigatie : null
          };
        })
      };
    }).filter(function (j) { return j.stappen.length > 0; });

    return { klant: body.klant || {}, regios: regions, reisverlopen: journeys };
  }

  function findPlace(id) {
    var found = null;
    state.guide.regios.forEach(function (r) {
      r.plekken.forEach(function (p) { if (p.id === id) found = { region: r, place: p }; });
    });
    return found;
  }

  /* ------------------------------------------------------------------------
     App start
     ------------------------------------------------------------------------ */
  function start(guide) {
    state.guide = guide;
    var naam = guide.klant.naam || "reiziger";

    setTitle(els.welcomeTitle, "Welkom, " + naam);
    els.menuTitle.textContent = naam;
    var tot = formatDate(guide.klant.tot);
    els.menuValid.textContent = tot ? "Geldig tot en met " + tot + "." : "";
    buildJourneyList();
    buildRegionList();
    setupInstall();
    buildClouds();

    els.app.hidden = false;
    state.atlas = window.NovakseAtlas.create({
      container: els.main,
      before: els.welcome,
      regions: guide.regios.map(function (r) {
        return { id: r.id, naam: r.naam, centrum: r.centrum, art: REGION_ART[r.id] || "den" };
      }),
      art: art,
      onRegion: function (id) { if (state.mode === "overzicht") navigate(id); }
    });
    layoutAtlas();
    window.addEventListener("resize", function () {
      window.clearTimeout(layoutAtlas.timer);
      layoutAtlas.timer = window.setTimeout(function () { layoutAtlas(); placeFilterThumb(false); }, 150);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { placeFilterThumb(false); });

    if (location.hash && location.hash !== "#") {
      // Opened straight into an area or a step: no opening, the map now.
      initMap();
      window.setTimeout(function () { els.gate.classList.add("is-weg"); }, 350);
      return;
    }

    /* The opening: once the drawn map is ready, the welcome screen fades
       while the clouds part and you come down onto Sweden. The live map
       (heavy: WebGL and tiles) only starts after that, so it cannot stall
       the motion; tapping an area before then starts it straight away. */
    state.mode = "overzicht";
    // The clouds lie closed over the map from the first frame, so they are
    // ready first (never waited for longer than a moment).
    var clouds = Promise.race([state.cloudsReady || Promise.resolve(), new Promise(function (resolve) { window.setTimeout(resolve, 1200); })]);
    if (state.satellite) {
      /* On the pictures the live map is the overview: it starts right away,
         under the closed clouds, and they part once its first pictures are
         in (or after a few seconds at most). */
      var landed = new Promise(function (resolve) {
        state.onSatLanded = resolve;
        window.setTimeout(resolve, 4500);
      });
      initMap();
      Promise.all([landed, clouds]).then(function () {
        window.requestAnimationFrame(function () {
          els.app.classList.add("is-opening");
          window.setTimeout(function () { els.app.classList.remove("is-opening"); }, 4200);
          openThroughClouds(2700);
          els.gate.classList.add("is-weg");
        });
      });
      return;
    }
    Promise.all([state.atlas.ready, clouds]).then(function () {
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          // The bar and the welcome card arrive once the map has landed.
          els.app.classList.add("is-opening");
          window.setTimeout(function () { els.app.classList.remove("is-opening"); }, 4200);
          state.atlas.show(true);
          openThroughClouds(2700);
          els.gate.classList.add("is-weg");
          window.setTimeout(initMap, reduceMotion ? 0 : 3900);
        });
      });
    });
  }

  function buildJourneyList() {
    els.journeyList.textContent = "";
    els.journeyList.hidden = !state.guide.reisverlopen.length;
    state.guide.reisverlopen.forEach(function (j) {
      var li = el("li");
      var btn = el("button", "rg-journey-btn");
      btn.type = "button";
      var disc = el("span", "rg-journey-btn__art");
      disc.appendChild(art("vliegtuig"));
      btn.appendChild(disc);
      var text = el("span", "rg-journey-btn__text");
      text.appendChild(el("span", "rg-journey-btn__eyebrow", "Stap voor stap"));
      text.appendChild(el("span", "rg-journey-btn__name", j.naam));
      text.appendChild(el("span", "rg-journey-btn__count", j.stappen.length + " stappen, van paklijst tot inchecken"));
      btn.appendChild(text);
      btn.addEventListener("click", function () { navigate("reis/" + j.id + "/1"); });
      li.appendChild(btn);
      els.journeyList.appendChild(li);
    });
  }

  function buildRegionList() {
    els.regionList.textContent = "";
    state.guide.regios.forEach(function (region) {
      var li = el("li");
      var btn = el("button", "rg-region-btn");
      btn.type = "button";
      var disc = el("span", "rg-region-btn__art");
      disc.appendChild(art(REGION_ART[region.id] || "den"));
      btn.appendChild(disc);
      btn.appendChild(el("span", "rg-region-btn__name", region.naam));
      btn.appendChild(el("span", "rg-region-btn__count", countLabel(region.plekken.length)));
      btn.insertAdjacentHTML("beforeend", '<svg class="rg-region-btn__arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 5l7 7-7 7"/></svg>');
      btn.addEventListener("click", function () { navigate(region.id); });
      li.appendChild(btn);
      els.regionList.appendChild(li);
    });
  }

  function countLabel(n) { return n === 1 ? "1 plek" : n + " plekken"; }

  /* ------------------------------------------------------------------------
     Clouds: soft cloud sprites, drawn once on a canvas, that grow past the
     camera while the map dives into a region (transform and opacity only).
     ------------------------------------------------------------------------ */
  function cloudTexture(seed) {
    var w = 640, h = 380;
    var canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    var ctx = canvas.getContext("2d");
    var s = seed * 9301 + 49297;
    function rnd() { s = (s * 9301 + 49297) % 233280; return s / 233280; }
    for (var i = 0; i < 34; i++) {
      var a = rnd() * Math.PI * 2;
      var d = Math.sqrt(rnd());
      var x = w / 2 + Math.cos(a) * d * w * 0.3;
      var y = h / 2 + Math.sin(a) * d * h * 0.22;
      var r = 50 + rnd() * 90;
      var g = ctx.createRadialGradient(x, y, 0, x, y, r);
      var shade = y > h * 0.6 ? "205, 220, 229" : y > h * 0.48 ? "232, 240, 245" : "255, 255, 255";
      g.addColorStop(0, "rgba(" + shade + ", 0.92)");
      g.addColorStop(0.55, "rgba(" + shade + ", 0.5)");
      g.addColorStop(1, "rgba(" + shade + ", 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    /* As a file the browser writes in the background (toBlob): writing the
       PNG right away (toDataURL) held up the opening screen. Resolves to
       the image address. */
    return new Promise(function (resolve) {
      var now = function () { resolve(canvas.toDataURL("image/png")); };
      if (!canvas.toBlob || !window.URL || !URL.createObjectURL) { now(); return; }
      try {
        canvas.toBlob(function (blob) { if (blob) resolve(URL.createObjectURL(blob)); else now(); }, "image/png");
      } catch (e) { now(); }
    });
  }

  function buildClouds() {
    if (reduceMotion) return;
    var wrap = el("div", "rg-clouds");
    wrap.setAttribute("aria-hidden", "true");
    var textures = [cloudTexture(1), cloudTexture(2), cloudTexture(3)];
    /* x/y: start offset from the centre, tx/ty: where it drifts to, d: delay */
    var sprites = [
      { x: -22, y: -24, tx: -110, ty: -90, d: 0 },
      { x: 24, y: -12, tx: 120, ty: -50, d: 0.12 },
      { x: -18, y: 22, tx: -100, ty: 105, d: 0.22 },
      { x: 22, y: 26, tx: 110, ty: 115, d: 0.32 },
      { x: 2, y: -30, tx: 15, ty: -130, d: 0.42 }
    ];
    var clouds = sprites.map(function (sp) {
      var c = el("div", "rg-cloud");
      c.style.setProperty("--x0", sp.x + "vw");
      c.style.setProperty("--y0", sp.y + "vh");
      c.style.setProperty("--x1", sp.tx + "vw");
      c.style.setProperty("--y1", sp.ty + "vh");
      c.style.setProperty("--d", sp.d);
      wrap.appendChild(c);
      return c;
    });
    wrap.appendChild(el("div", "rg-clouds__mist"));
    wrap.appendChild(el("div", "rg-clouds__tunnel"));
    els.main.appendChild(wrap);
    state.clouds = wrap;
    // The opening waits for this (see start).
    state.cloudsReady = Promise.all(textures).then(function (urls) {
      clouds.forEach(function (c, i) { c.style.backgroundImage = "url(" + urls[i % urls.length] + ")"; });
    });
  }

  /* The opening: the clouds lie closed over the map and part while the
     welcome screen fades away. */
  function openThroughClouds(ms) {
    var wrap = state.clouds;
    if (!wrap || reduceMotion) return;
    wrap.style.setProperty("--rg-cloud-ms", ms + "ms");
    wrap.classList.add("is-openen");
    window.setTimeout(function () { wrap.classList.remove("is-openen"); }, ms + 600);
  }

  function flyThroughClouds(ms) {
    var wrap = state.clouds;
    if (!wrap || reduceMotion) return;
    wrap.classList.remove("is-vliegen");
    void wrap.offsetWidth; // restart the animation
    wrap.style.setProperty("--rg-cloud-ms", ms + "ms");
    wrap.classList.add("is-vliegen");
    window.clearTimeout(wrap._timer);
    wrap._timer = window.setTimeout(function () { wrap.classList.remove("is-vliegen"); }, ms + 100);
  }

  /* ------------------------------------------------------------------------
     Snow over Norrbotten: while the camera dives into the region, a short,
     heavy snowfall of thousands of snow crystals snows the map under. The
     map is seen from straight above, so the flakes fall away from the
     camera on a light wind: the big ones tumble past close by, all of them
     shrink towards the spot where they land and lie there a moment, while
     the map itself turns to its snow colours (paint transitions).
     ------------------------------------------------------------------------ */
  var snowSprites = null;

  function spriteCanvas(size, draw) {
    var canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    draw(canvas.getContext("2d"), size);
    return canvas;
  }

  /* A snow crystal: six arms with side branches (a stellar dendrite), some
     with little plates at the tips, in white with a fine cool edge so it
     also shows on the white map, and a faint glow. */
  function snowCrystal(seed) {
    var s = (seed * 7919) % 233280;
    function rnd() { s = (s * 9301 + 49297) % 233280; return s / 233280; }
    var size = 96, c = size / 2, R = size * 0.42;
    var tips = seed % 3 === 0;
    var width = R * (0.045 + rnd() * 0.03);
    var branches = [], nb = 2 + Math.floor(rnd() * 3);
    for (var b = 0; b < nb; b++) {
      branches.push({ at: 0.28 + b / nb * 0.55 + rnd() * 0.06, len: (0.2 + rnd() * 0.2) * (1 - b / (nb + 1)) });
    }
    function pt(k, along, side) {
      var a = k * Math.PI / 3 - Math.PI / 2, cos = Math.cos(a), sin = Math.sin(a);
      return [c + cos * along * R - sin * side * R, c + sin * along * R + cos * side * R];
    }
    function line(ctx, p, q) { ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); }
    function hexagon(ctx, r, at) {
      ctx.beginPath();
      for (var k = 0; k < 6; k++) {
        var p = pt(k, r, 0);
        ctx.lineTo(p[0] + at[0] - c, p[1] + at[1] - c);
      }
      ctx.closePath();
    }
    function tipPlates(ctx) {
      ctx.beginPath();
      for (var k = 0; k < 6; k++) {
        var at = pt(k, 0.92, 0);
        for (var j = 0; j < 6; j++) {
          var p = pt(j, 0.1, 0);
          if (j === 0) ctx.moveTo(p[0] + at[0] - c, p[1] + at[1] - c);
          else ctx.lineTo(p[0] + at[0] - c, p[1] + at[1] - c);
        }
        ctx.closePath();
      }
    }
    function arms(ctx) {
      ctx.beginPath();
      for (var k = 0; k < 6; k++) {
        line(ctx, pt(k, 0, 0), pt(k, 1, 0));
        branches.forEach(function (br) {
          // Side branches leave the arm at 60 degrees, pointing outwards.
          line(ctx, pt(k, br.at, 0), pt(k, br.at + br.len * 0.5, br.len * 0.866));
          line(ctx, pt(k, br.at, 0), pt(k, br.at + br.len * 0.5, -br.len * 0.866));
        });
      }
    }
    return spriteCanvas(size, function (ctx) {
      var glow = ctx.createRadialGradient(c, c, 0, c, c, R);
      glow.addColorStop(0, "rgba(255, 255, 255, 0.4)");
      glow.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, size, size);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      arms(ctx);
      ctx.strokeStyle = "rgba(110, 145, 170, 0.45)";
      ctx.lineWidth = width + 2.2;
      ctx.stroke();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = width;
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      if (tips) {
        tipPlates(ctx);
        ctx.strokeStyle = "rgba(110, 145, 170, 0.45)";
        ctx.lineWidth = 2.2;
        ctx.stroke();
        ctx.fill();
      }
      hexagon(ctx, 0.14, [c, c]);
      ctx.fill();
    });
  }

  function snowCanvas(className, w, h, ratio) {
    var canvas = el("canvas", className);
    canvas.setAttribute("aria-hidden", "true");
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    var ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { canvas: canvas, ctx: ctx };
  }

  /* The map's own colours to snow (on) or back (off), as paint transitions. */
  function setSnowLook(on, ms, delay) {
    var map = state.map;
    if (!map || state.snowLook === on) return;
    state.snowLook = on;
    var transition = { duration: ms, delay: delay };
    // The drawing under the map gives way to the snow (see setUnderlay).
    if (state.underlay) showUnderlay(!on, transition);
    SNOW_PAINT.forEach(function (p) { paintLook(p[0], p[1], transition); });
    if (!map.getLayer("provincie-vlak")) return;
    map.setPaintProperty("provincie-vlak", "fill-opacity-transition", transition);
    updateProvinceTint();
    // Later changes of the tint (journey, overview) fade at their own pace again.
    window.clearTimeout(state.snowTintTimer);
    state.snowTintTimer = window.setTimeout(function () {
      map.setPaintProperty("provincie-vlak", "fill-opacity-transition", { duration: 700 });
    }, ms + delay + 50);
  }

  /* It starts snowing hard right away, while the camera is still coming down. */
  function snowSoon(region) {
    window.clearTimeout(state.snowTimer);
    state.snowTimer = window.setTimeout(function () {
      if (state.mode === "regio" && state.region === region) letItSnow();
    }, duration(400));
  }

  function stopSnowfall() {
    var s = state.snowfall;
    if (!s) return;
    state.snowfall = null;
    s.stop();
  }

  function letItSnow() {
    stopSnowfall();
    var map = state.map;
    var w = els.map.clientWidth, h = els.map.clientHeight;
    if (reduceMotion || !w || !h) { setSnowLook(true, 0, 0); return; }
    var SNOWING = 1800; // ms in which new flakes start: hard, but not long
    var REST = 500;     // ms a fallen flake stays visible before it melts into the white
    // The map turns white while it snows, so it comes out of the dive snowed under.
    setSnowLook(true, 1600, 300);

    var crystals = snowSprites || (snowSprites = [1, 2, 3, 4, 5, 6, 7, 8].map(snowCrystal));
    var sky = snowCanvas("rg-snowfall", w, h, 1); // fast and many: the extra pixels of a sharp screen are skipped
    els.main.appendChild(sky.canvas);

    var unit = Math.max(1, Math.min(1.5, Math.min(w, h) / 390)); // bigger flakes on bigger screens
    var count = Math.round(Math.max(3000, Math.min(6000, w * h / 110)));
    var cx = w / 2, cy = h / 2;
    var wind = { x: -0.08 * w, y: -0.22 * h }; // where the flakes come from, at full height
    var flakes = [], end = 0;
    for (var i = 0; i < count; i++) {
      var r = Math.random();
      var f = {
        sx: (Math.random() * 1.12 - 0.06) * w,   // landing spot on the screen, when it starts falling
        sy: (Math.random() * 1.12 - 0.06) * h,
        x: 0, y: 0,                              // the same spot on the map (set when it starts)
        // Mostly small flakes, now and then a big crystal.
        size: (r < 0.08 ? 5 + Math.random() * 4 : 1.8 + r * r * 3) * unit,
        z0: 0.6 + Math.random() * 0.32,          // start height (1 = at the camera)
        t0: SNOWING * Math.pow(Math.random(), 1.1),
        d: 650 + Math.random() * 400,
        rot: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 2.4,       // rad/s, a slow turn
        sway: Math.random() * Math.PI * 2,
        img: crystals[i % crystals.length],
        started: false
      };
      end = Math.max(end, f.t0 + f.d + REST);
      flakes.push(f);
    }

    // The camera is still moving: the flakes land on the map, so their spots
    // move along with it (the flakes themselves keep their size).
    var ref = map.unproject([0, 0]), zoom0 = map.getZoom();
    var shift = { x: 0, y: 0, k: 1 };
    function follow() {
      var p = map.project(ref);
      shift.x = p.x; shift.y = p.y; shift.k = Math.pow(2, map.getZoom() - zoom0);
    }
    map.on("move", follow);

    function put(ctx, img, x, y, half, rot) {
      var cos = Math.cos(rot), sin = Math.sin(rot);
      ctx.setTransform(cos, sin, -sin, cos, x, y);
      ctx.drawImage(img, -half, -half, half * 2, half * 2);
    }

    var start = null, frameId = null;
    function frame(now) {
      if (start === null) start = now;
      var t = now - start;
      if (t > end) { stopSnowfall(); return; }
      var c = sky.ctx;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, w, h);
      // The snow clouds dim the light while it snows.
      var dim = 0.12 * Math.sin(Math.PI * Math.min(1, t / end));
      if (dim > 0.002) {
        c.globalAlpha = 1;
        c.fillStyle = "rgba(24, 58, 76, " + dim.toFixed(3) + ")";
        c.fillRect(0, 0, w, h);
      }
      for (var i = 0; i < flakes.length; i++) {
        var f = flakes[i];
        var age = t - f.t0;
        if (age < 0) continue;
        if (!f.started) {
          f.started = true;
          f.x = (f.sx - shift.x) / shift.k;
          f.y = (f.sy - shift.y) / shift.k;
        }
        var u = age / f.d;
        var gx = shift.x + f.x * shift.k, gy = shift.y + f.y * shift.k;
        if (u >= 1) {
          // Fallen: it lies a moment where it landed, then melts into the white.
          var melt = (age - f.d) / REST;
          if (melt >= 1) continue;
          c.globalAlpha = 0.9 * (1 - melt);
          put(c, f.img, gx, gy, f.size * 1.6, f.rot + f.spin * f.d / 1000);
          continue;
        }
        var z = f.z0 * (1 - (0.45 * u + 0.55 * u * u));
        var rot = f.rot + f.spin * age / 1000;
        gx += wind.x * z + Math.sin(f.sway + t * 0.003) * 9 * z;
        gy += wind.y * z;
        // In perspective: big and close to the camera, smaller as it nears the ground.
        var s = 1 / (1 - 0.85 * z);
        var half = f.size * 1.6 * s;
        var px = cx + (gx - cx) * s, py = cy + (gy - cy) * s;
        if (px < -half || px > w + half || py < -half || py > h + half) continue;
        c.globalAlpha = Math.min(1, age / 120) * Math.max(0.6, Math.min(1, 1.2 - 0.12 * s));
        put(c, f.img, px, py, half, rot);
      }
      frameId = window.requestAnimationFrame(frame);
    }
    frameId = window.requestAnimationFrame(frame);

    state.snowfall = {
      stop: function () {
        window.cancelAnimationFrame(frameId);
        map.off("move", follow);
        sky.canvas.remove();
      }
    };
  }

  /* ------------------------------------------------------------------------
     Map
     ------------------------------------------------------------------------ */
  function initMap() {
    if (state.map) return;
    var map = new maplibregl.Map({
      container: els.map,
      style: window.NovakseKaartstijl,
      center: (guide0Center() || [15.05, 60.72]),
      zoom: 6.5,
      minZoom: 2.5,
      maxZoom: 16.5,
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      // At most twice as sharp as the screen's CSS pixels: on a 3x phone the
      // map then has less than half the pixels to draw on every frame, which
      // the eye hardly sees and the motion does (the pictures of the drawing
      // are made at the same 2x, see setUnderlay).
      pixelRatio: Math.min(2, window.devicePixelRatio || 1)
    });
    map.touchZoomRotate.disableRotation();
    map.keyboard.disableRotation();
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    state.map = map;

    var pending = null;
    map.on("move", function () {
      if (pending) return;
      pending = window.requestAnimationFrame(function () {
        pending = null;
        var z = map.getZoom();
        els.map.classList.toggle("toon-labels", z >= LABEL_ZOOM);
        els.map.classList.toggle("toon-labels-klein", z >= SMALL_LABEL_ZOOM);
        els.map.classList.toggle("toon-markeringen", z >= MARK_ZOOM);
        // After the labels toggle: the marker boxes include the names under them.
        if (!regroup()) layoutLabels();
        updateDecorVisibility();
      });
    });

    /* The guests cannot tilt or turn the map themselves, so after any
       scripted tilted move (or one they interrupt) it levels out again. */
    map.on("moveend", levelOut);
    map.on("moveend", function () { updateBack(); });
    map.on("zoom", thinCarPins);

    /* Zooming in close on a ski area with a 3D view opens it: only when the
       guest zooms (scroll, pinch, double tap, + key), not on the guide's own
       camera moves. MapLibre does not tell them apart for scroll zoom. */
    var guestZoomed = 0;
    var markZoom = function () { guestZoomed = Date.now(); };
    els.map.addEventListener("wheel", markZoom, { passive: true });
    els.map.addEventListener("dblclick", markZoom);
    els.map.addEventListener("touchmove", function (e) { if (e.touches.length > 1) markZoom(); }, { passive: true });
    els.map.addEventListener("touchend", function () { if (guestZoomed && Date.now() - guestZoomed < 400) markZoom(); }, { passive: true });
    els.map.addEventListener("keydown", function (e) { if (e.key === "+" || e.key === "=") markZoom(); });
    map.on("zoomend", function () {
      if (Date.now() - guestZoomed < 1500) zoomedInOnSkiArea();
    });

    map.on("load", function () {
      addOwnLayers();
      keyTowns();
      loadShapes();
      buildRegionDecor();
      warmDrawing();
      state.mapReady = true;
      if (state.satellite) {
        applySatellite(true);
        if (state.mode === "overzicht") overviewLook(true);
        whenSatTilesIn(function () { if (state.onSatLanded) state.onSatLanded(); });
      }
      window.addEventListener("popstate", function () { route(false); });
      window.setTimeout(function () { route(true); }, reduceMotion ? 0 : 450);
    });

    els.map.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  }

  /* While the drawn map is looked at, the picture of the whole drawing
     that the live map lies on after a dive is made ahead (see setUnderlay),
     in a quiet moment, so a dive does not have to wait for it. */
  function warmDrawing() {
    // The borders the live map carries on with are worked out ahead as well.
    var make = function () { if (state.atlas.isShown() && !state.diving) { state.atlas.borders(); state.atlas.wholePicture(); } };
    window.setTimeout(function () {
      if (window.requestIdleCallback) window.requestIdleCallback(make, { timeout: 2000 });
      else make();
    }, 1200);
  }

  /* Checked a frame later: a move that replaces another one ends the old
     one first, and the new one should simply run on. */
  function levelOut() {
    window.requestAnimationFrame(function () {
      var map = state.map;
      if (!map || state.diving || map.isMoving()) return;
      if (Math.abs(map.getPitch()) > 0.5 || Math.abs(map.getBearing()) > 0.5) {
        map.easeTo({ pitch: 0, bearing: 0, duration: duration(700) });
      }
    });
  }

  function guide0Center() {
    var r = state.guide.regios[0];
    return r ? r.centrum || centerOf(r.plekken) : null;
  }

  /* The free area for the drawn map: above the welcome card on phones, right
     of the panel on wide screens. */
  function layoutAtlas() {
    if (!state.atlas) return;
    state.atlas.layout(overviewRect());
    // The satellite overview fits the same free space.
    if (state.satellite && state.mode === "overzicht" && state.mapReady && !state.diving) {
      var cam = satOverviewCamera();
      if (cam) state.map.jumpTo(cam);
    }
  }

  function overviewRect() {
    var top = 64;
    if (isWide()) {
      var left = 25 * 16 + 32;
      return { left: left, top: top, width: window.innerWidth - left - 16, height: window.innerHeight - top - 16 };
    }
    var cardTop = window.innerHeight - els.welcome.offsetHeight - 12;
    return { left: 0, top: top, width: window.innerWidth, height: Math.max(200, cardTop - top - 4) };
  }

  /* ------------------------------------------------------------------------
     Satellite map: the pictures under the live map, and a switch for the
     guest (see SAT_*). index.json lists the tiles there are; a tile that is
     not in it is never asked for: the map then shows the tile of the zoom
     above it, larger (what MapLibre does for a tile that answers 404).
     ------------------------------------------------------------------------ */
  var satIndex = null;
  function satTiles() {
    if (!satIndex) {
      satIndex = fetch(SAT_DIR + "index.json?v=" + SAT_VERSION)
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.json();
        })
        .then(function (data) {
          var have = {};
          Object.keys(data.tiles || {}).forEach(function (z) {
            data.tiles[z].forEach(function (run) {
              for (var x = run[1]; x <= run[2]; x++) have[z + "/" + x + "/" + run[0]] = true;
            });
          });
          return have;
        });
      satIndex.catch(function () { satIndex = null; });
    }
    return satIndex;
  }

  function satTileUrl(z, x, y) { return SAT_DIR + z + "/" + x + "_" + y + ".webp?v=" + SAT_VERSION; }

  function noTile() {
    var e = new Error("Hier is geen satellietbeeld");
    e.status = 404;
    return e;
  }

  /* One picture tile, or null where there is none (also for the 3D view). */
  function satTile(z, x, y, signal) {
    return satTiles().then(function (have) {
      if (!have[z + "/" + x + "/" + y]) return null;
      return fetch(satTileUrl(z, x, y), signal ? { signal: signal } : undefined).then(function (res) {
        if (!res.ok) throw noTile();
        return res.arrayBuffer();
      });
    });
  }

  function satProtocol() {
    if (satProtocol.done) return;
    satProtocol.done = true;
    maplibregl.addProtocol("rgsat", function (params, abort) {
      var m = /^rgsat:\/\/(\d+)\/(\d+)\/(\d+)$/.exec(params.url);
      if (!m) return Promise.reject(noTile());
      return satTile(m[1], m[2], m[3], abort && abort.signal).then(function (data) {
        if (!data) throw noTile();
        return { data: data };
      });
    });
  }

  function ensureSatelliteLayer() {
    var map = state.map;
    if (map.getLayer("satelliet")) return;
    satProtocol();
    map.addSource("satelliet", {
      type: "raster", tiles: ["rgsat://{z}/{x}/{y}"], tileSize: 512,
      minzoom: 0, maxzoom: SAT_MAXZOOM, attribution: SAT_CREDIT
    });
    // Over the drawn ground, under the water and everything on top of it.
    map.addLayer({
      id: "satelliet", type: "raster", source: "satelliet",
      paint: { "raster-fade-duration": 250, "raster-resampling": "linear" }
    }, "water");
  }

  /* A colour of the map as it should be now: on the pictures, under the
     snow, or the map's own (taken from the style the first time). */
  function paintLook(layer, prop, transition) {
    var map = state.map;
    if (!map || !map.getLayer(layer)) return;
    var key = layer + "|" + prop;
    if (!(key in state.lookBase)) state.lookBase[key] = map.getPaintProperty(layer, prop);
    var value = state.lookBase[key];
    var pick = function (list) {
      var hit;
      list.forEach(function (p) { if (p[0] === layer && p[1] === prop) hit = p; });
      return hit;
    };
    var snow = state.snowLook && pick(SNOW_PAINT), sat = state.satellite && pick(SAT_PAINT);
    if (sat) value = sat[2];
    else if (snow) value = snow[2];
    if (transition) map.setPaintProperty(layer, prop + "-transition", transition);
    map.setPaintProperty(layer, prop, value);
  }

  /* Puts the map in the look of state.satellite. The pictures fade in over
     the drawn ground, which only goes once the pictures in view are there
     (so nothing goes dark meanwhile); going back, the drawn ground is there
     at once and the pictures fade away over it. `instant`: no fading. */
  var SAT_FADE = 450;
  function applySatellite(instant) {
    var map = state.map, on = state.satellite;
    var token = state.satToken = (state.satToken || 0) + 1;
    if (on) ensureSatelliteLayer();
    var show = function (id, visible) {
      if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
    };
    var fade = instant || reduceMotion ? 0 : SAT_FADE;
    var drawnGround = function (visible) {
      SAT_HIDE.forEach(function (id) { show(id, visible); });
      paintLook("land", "background-color", { duration: 0, delay: 0 });
    };
    // The drawing that lies under the live map after a dive is not for the pictures.
    UNDERLAY.concat(["tekening-grens"]).forEach(function (id) { show(id, !on); });
    var now = { duration: 0, delay: 0 };
    SAT_PAINT.concat(SNOW_PAINT).forEach(function (p) { if (p[0] !== "land") paintLook(p[0], p[1], now); });
    if (map.getLayer("provincie-vlak")) {
      // The province tint over the pictures, on the drawn map under the hill shading.
      map.moveLayer("provincie-vlak", on ? "provincie-sluier" : "relief");
      updateVeil();
    }
    els.map.classList.toggle("is-satelliet", on);
    els.main.classList.toggle("is-satelliet", on);
    if (map.getLayer("satelliet")) {
      map.setPaintProperty("satelliet", "raster-opacity-transition", { duration: fade, delay: 0 });
    }
    if (on) {
      show("satelliet", true);
      if (!fade) {
        map.setPaintProperty("satelliet", "raster-opacity", 1);
        drawnGround(false);
        return;
      }
      map.setPaintProperty("satelliet", "raster-opacity", 0);
      whenSatTilesIn(function () {
        if (token !== state.satToken) return;
        map.setPaintProperty("satelliet", "raster-opacity", 1);
        window.setTimeout(function () { if (token === state.satToken) drawnGround(false); }, fade + 30);
      });
    } else {
      drawnGround(true);
      if (!map.getLayer("satelliet")) return;
      map.setPaintProperty("satelliet", "raster-opacity", 0);
      window.setTimeout(function () { if (token === state.satToken) show("satelliet", false); }, fade + 30);
    }
  }

  /* Once the pictures in view have come in (or after a moment at most). */
  function whenSatTilesIn(done) {
    var map = state.map, finished = false;
    var finish = function () {
      if (finished) return;
      finished = true;
      map.off("sourcedata", check);
      window.clearTimeout(timer);
      done();
    };
    var check = function () {
      if (map.getSource("satelliet") && map.isSourceLoaded("satelliet")) finish();
    };
    var timer = window.setTimeout(finish, 2500);
    map.on("sourcedata", check);
    window.requestAnimationFrame(check);
  }

  /* The guest's switch. Remembered on this device. */
  function setSatellite(on) {
    on = !!on;
    if (state.satellite === on) return;
    state.satellite = on;
    writeStored(SAT_KEY, on ? "satelliet" : null);
    syncLayerButton();
    if (!state.map || !state.mapReady) {
      // Not on the live map yet (the drawn overview): it comes with the map.
      if (on) startSatelliteOverview();
      return;
    }
    applySatellite();
    if (state.mode === "overzicht") overviewLook(true);
    if (state.ski3d && state.ski3d.view && state.ski3d.view.setSatellite) {
      state.ski3d.view.setSatellite(on ? satelliteFor3D() : null);
    }
  }

  function syncLayerButton() {
    var btn = $("layerBtn");
    if (!btn) return;
    var on = state.satellite;
    btn.classList.toggle("is-satelliet", on);
    btn.setAttribute("aria-label", on ? "Toon de getekende kaart" : "Toon het satellietbeeld");
    btn.querySelector(".rg-layer__label").textContent = on ? "Kaart" : "Satelliet";
  }

  /* Switched to the pictures while the drawn overview is still the only map:
     the live map starts now, under the drawing, which then fades away. */
  function startSatelliteOverview() {
    initMap();
  }

  /* The overview on the pictures: the north from high above, in the same
     free space as the drawn map, the booked regions lit up with a badge. */
  function satOverviewCamera() {
    var map = state.map;
    if (!map) return null;
    var b = new maplibregl.LngLatBounds(SWEDEN_BOUNDS[0], SWEDEN_BOUNDS[1]);
    state.guide.regios.forEach(function (r) {
      if (r.centrum) b.extend(r.centrum);
      (r.plekken || []).forEach(function (p) { if (!onlyClose(p)) b.extend(p.coord); });
    });
    var rect = overviewRect(), W = window.innerWidth, H = window.innerHeight;
    // Room for the badges, which stand above their spot and reach out to both sides.
    var side = Math.min(80, rect.width * 0.18);
    var pad = {
      top: rect.top + 56, left: rect.left + side,
      right: Math.max(8, W - rect.left - rect.width) + side, bottom: Math.max(8, H - rect.top - rect.height + 8)
    };
    if (pad.top + pad.bottom > H - 120) pad.bottom = Math.max(8, H - 120 - pad.top);
    var cam = map.cameraForBounds(b, { padding: pad });
    return cam ? { center: cam.center, zoom: cam.zoom, pitch: 0, bearing: 0 } : null;
  }

  function satBadges() {
    if (state.satBadges || !state.map) return state.satBadges || [];
    state.satBadges = state.guide.regios.map(function (r, i) {
      var btn = el("button", "rg-satbadge");
      btn.type = "button";
      btn.dataset.region = r.id;
      btn.style.setProperty("--i", i);
      btn.style.setProperty("--kleur", (REGION_COLORS[r.id] || REGION_COLORS.dalarna)[0]);
      btn.setAttribute("aria-label", r.naam + ", tik om in te zoomen");
      btn.tabIndex = -1;
      var inner = el("span", "rg-satbadge__inner");
      var pill = el("span", "rg-satbadge__pill");
      var disc = el("span", "rg-satbadge__art");
      disc.appendChild(art(REGION_ART[r.id] || "den"));
      pill.appendChild(disc);
      pill.appendChild(el("span", "rg-satbadge__name", r.naam));
      inner.appendChild(pill);
      inner.appendChild(el("span", "rg-satbadge__stem"));
      inner.appendChild(el("span", "rg-satbadge__dot"));
      btn.appendChild(inner);
      btn.addEventListener("click", function () { if (state.mode === "overzicht") navigate(r.id); });
      var at = r.centrum || centerOf(r.plekken || []);
      // The middle of the dot on the spot.
      var marker = new maplibregl.Marker({ element: btn, anchor: "bottom", offset: [0, 0.275 * rem()] }).setLngLat(at).addTo(state.map);
      return { el: btn, marker: marker };
    });
    return state.satBadges;
  }

  function showSatBadges(on) {
    var list = on ? satBadges() : (state.satBadges || []);
    list.forEach(function (b) {
      b.el.classList.toggle("is-zichtbaar", on);
      b.el.tabIndex = on ? 0 : -1;
    });
  }

  /* The overview in the current look: on the pictures the live map shows the
     north from high above (the drawing fades away), otherwise the drawing. */
  function overviewLook(switched) {
    var map = state.map;
    if (state.satellite) {
      var cam = satOverviewCamera();
      if (cam) map.jumpTo(cam);
      showSatBadges(true);
      if (state.atlas.isShown()) {
        // The drawing stays until the pictures under it are there.
        whenSatTilesIn(function () {
          if (!state.satellite || state.mode !== "overzicht") return;
          state.atlas.fadeOut(switched && !reduceMotion ? 650 : 0, function () {
            if (state.satellite && state.mode === "overzicht") state.atlas.hide();
          });
        });
      }
    } else {
      showSatBadges(false);
      if (!state.atlas.isShown()) state.atlas.show(false);
      layoutAtlas();
    }
  }

  /* What the 3D view of a ski area needs to lay the pictures on its ground. */
  function satelliteFor3D() {
    return {
      maxzoom: SAT_MAXZOOM,
      tile: function (z, x, y) {
        return satTile(z, x, y).then(function (data) {
          if (!data) return null;
          return createImageBitmap(new Blob([data], { type: "image/webp" }));
        }).catch(function () { return null; });
      }
    };
  }

  var EMPTY = { type: "FeatureCollection", features: [] };

  function addOwnLayers() {
    var map = state.map;
    map.addSource("provincies", { type: "geojson", data: EMPTY });
    // Their borders: over land only, as on the drawn map (see loadShapes).
    map.addSource("provincie-randen", { type: "geojson", data: EMPTY });
    map.addSource("sluier", { type: "geojson", data: EMPTY });
    map.addSource("banen", { type: "geojson", data: EMPTY, lineMetrics: true });
    map.addSource("reis-route", { type: "geojson", data: EMPTY, lineMetrics: true });
    map.addSource("auto-route", { type: "geojson", data: EMPTY });

    /* The booked province: a warm tint under the lakes, a soft glow and a
       line. Strong from far away, only a breath of warmth once you are in
       the region, so the snow and the hills stay the picture there. */
    map.addLayer({
      id: "provincie-vlak", type: "fill", source: "provincies",
      paint: {
        "fill-color": ["coalesce", ["get", "vlak"], "#f2b064"],
        "fill-opacity": ["interpolate", ["linear"], ["zoom"]].concat(PROVINCE_TINT),
        "fill-opacity-transition": { duration: 700 }
      }
    }, "relief"); // under the hill shading, so the hills stay visible in the coloured area
    /* Outside the province a pale veil, only in the region view. */
    map.addLayer({
      id: "provincie-sluier", type: "fill", source: "sluier",
      paint: { "fill-color": "#eaf0f1", "fill-opacity": 0, "fill-opacity-transition": { duration: 900 } }
    }, "water-name");
    /* The drawn map's province borders (same lines and colour as
       js/atlas.js), drawn while the live map carries the drawing on (see
       setUnderlay); hidden otherwise. */
    map.addSource("tekening-grenzen", { type: "geojson", data: EMPTY });
    map.addLayer({
      id: "tekening-grens", type: "line", source: "tekening-grenzen",
      layout: { "line-join": "round", "line-cap": "round" },
      // 3 px on and 2.6 px off at 1.2 px wide, as drawn.
      paint: { "line-color": "#7a4620", "line-opacity": 0, "line-width": DRAWN_BORDER[0], "line-dasharray": [2.5, 2.17] }
    }, "water-name");
    map.addLayer({
      id: "provincie-gloed", type: "line", source: "provincie-randen",
      paint: {
        "line-color": ["coalesce", ["get", "rand"], "#dd9752"],
        "line-width": ["interpolate", ["linear"], ["zoom"], 3, 6, 8, 16, 12, 22],
        "line-blur": ["interpolate", ["linear"], ["zoom"], 3, 4, 8, 12],
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 7, 0.4, 9, 0.3, 10.5, 0]
      }
    }, "water-name");
    map.addLayer({
      id: "provincie-rand", type: "line", source: "provincie-randen",
      layout: { "line-join": "round" },
      paint: {
        "line-color": ["coalesce", ["get", "rand"], "#d98a45"],
        "line-width": ["interpolate", ["linear"], ["zoom"], 3, 1.2, 8, 1.8, 12, 2.4],
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 8.5, 1, 10, 0]
      }
    }, "water-name");

    /* Swept ice tracks: a pale lane with the track colour on top. Both are
       drawn with a gradient along the line, so they can sweep onto the ice
       (see sweepTracks); one colour layer per track colour, because a
       gradient cannot read the colour from the track itself. */
    map.addLayer({
      id: "banen-baan", type: "line", source: "banen",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-width": ["interpolate", ["linear"], ["zoom"], 8, 3, 11, 8, 14, 16, 16, 26],
        "line-opacity": 0.88,
        "line-gradient": trackGradient("#ffffff", 1)
      }
    });
    Object.keys(TRACK_COLORS).forEach(function (name) {
      var color = TRACK_COLORS[name];
      map.addLayer({
        id: "banen-lijn-" + name, type: "line", source: "banen",
        filter: ["==", ["get", "kleur"], color],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-width": ["interpolate", ["linear"], ["zoom"], 8, 1.4, 11, 2.6, 14, 4, 16, 6],
          "line-gradient": trackGradient(color, 1)
        }
      });
    });
    /* An invisible wide line on top makes the thin tracks easy to tap. */
    map.addLayer({
      id: "banen-klik", type: "line", source: "banen",
      paint: { "line-color": "#000000", "line-opacity": 0, "line-width": 22 }
    });
    map.addLayer({
      id: "banen-naam", type: "symbol", source: "banen", minzoom: 11,
      layout: {
        "symbol-placement": "line",
        "text-field": ["get", "label"],
        "text-font": ["Noto Sans Regular"],
        "text-size": 12.5,
        "symbol-spacing": 320
      },
      // The label sits on the white swept lane, so a thin halo is enough (a
      // thick one turns the hyphen into a little box).
      paint: { "text-color": ["coalesce", ["get", "kleur"], "#1f5f8b"], "text-halo-color": "#ffffff", "text-halo-width": 0.8 }
    });

    /* Journey route: lane, a solid line that draws itself, or a dashed line. */
    map.addLayer({
      id: "reis-baan", type: "line", source: "reis-route",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#ffffff",
        "line-width": ["interpolate", ["linear"], ["zoom"], 4, 6, 9, 11, 14, 18],
        "line-opacity": 0.9
      }
    });
    map.addLayer({
      id: "reis-lijn", type: "line", source: "reis-route",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-width": ["interpolate", ["linear"], ["zoom"], 4, 2.2, 9, 3.2, 14, 5],
        "line-gradient": ["step", ["line-progress"], ROUTE_COLOR, 1, "rgba(0,0,0,0)"]
      }
    });
    map.addLayer({
      id: "reis-stippel", type: "line", source: "reis-route",
      layout: { "line-cap": "round", "line-join": "round", visibility: "none" },
      paint: {
        "line-color": ROUTE_COLOR,
        "line-width": ["interpolate", ["linear"], ["zoom"], 4, 2.4, 9, 3.4, 14, 5],
        "line-dasharray": [2, 2]
      }
    });

    /* The example car route in the region view: the shuttle leg dashed, the drive solid. */
    map.addLayer({
      id: "auto-baan", type: "line", source: "auto-route",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#ffffff",
        "line-width": ["interpolate", ["linear"], ["zoom"], 4, 6, 9, 11, 14, 18],
        "line-opacity": 0.9
      }
    });
    map.addLayer({
      id: "auto-lijn", type: "line", source: "auto-route",
      filter: ["==", ["get", "modus"], "auto"],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": ROUTE_COLOR, "line-width": ["interpolate", ["linear"], ["zoom"], 4, 2.2, 9, 3.2, 14, 5] }
    });
    map.addLayer({
      id: "auto-stippel", type: "line", source: "auto-route",
      filter: ["!=", ["get", "modus"], "auto"],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": ROUTE_COLOR,
        "line-width": ["interpolate", ["linear"], ["zoom"], 4, 2.4, 9, 3.4, 14, 5],
        "line-dasharray": ROUTE_DASH.bus
      }
    });

    /* The markers are HTML on top of the map, so the map's own labels do not
       know where they are and would hide underneath. An invisible box per
       marker, on top so it is placed first, keeps the names beside the
       markers (see layoutLabels). */
    map.addSource("pin-vakken", { type: "geojson", data: EMPTY });
    map.addLayer({
      id: "pin-vakken", type: "symbol", source: "pin-vakken",
      layout: {
        "icon-image": ["get", "vak"],
        "icon-anchor": "top-left",
        "icon-offset": ["array", "number", 2, ["get", "hoek"]],
        "icon-allow-overlap": true
      },
      paint: { "icon-opacity": 0 }
    });

    /* Tapping the map itself (not a marker) folds the panel down. */
    map.on("click", function () {
      if (state.mode === "regio") setCollapsed(els.sheet, true);
      else if (state.mode === "reis") setCollapsed(els.journey, true);
    });

    map.on("click", "banen-klik", function (e) {
      if (state.mode !== "regio" || !e.features || !e.features.length) return;
      var f = e.features[0].properties;
      var box = el("div", "rg-popup");
      box.appendChild(el("strong", null, f.naam));
      if (f.lengte) box.appendChild(el("p", null, f.lengte));
      box.appendChild(el("p", "rg-popup__plek", "Geveegde baan bij " + f.plek));
      new maplibregl.Popup({ closeButton: true, offset: 8, maxWidth: "16rem", className: "rg-popup-wrap" })
        .setLngLat(e.lngLat).setDOMContent(box).addTo(map);
    });
    map.on("mouseenter", "banen-klik", function () { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", "banen-klik", function () { map.getCanvas().style.cursor = ""; });

    map.on("click", "provincie-vlak", function (e) {
      if (state.mode !== "overzicht" || !e.features || !e.features.length) return;
      var id = e.features[0].properties.id;
      if (findRegion(id)) navigate(id);
    });
    map.on("mouseenter", "provincie-vlak", function () {
      if (state.mode === "overzicht") map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "provincie-vlak", function () { map.getCanvas().style.cursor = ""; });
  }

  function findRegion(id) {
    var found = null;
    state.guide.regios.forEach(function (r) { if (r.id === id) found = r; });
    return found;
  }

  /* Province outlines are public geography (OpenStreetMap), one file per region. */
  function loadShapes() {
    var loads = state.guide.regios.map(function (r) {
      return fetch(SHAPES_URL + encodeURIComponent(r.id) + ".json")
        .then(function (res) { return res.ok ? res.json() : null; })
        .then(function (f) {
          if (f && f.geometry) {
            var colors = REGION_COLORS[r.id] || REGION_COLORS.dalarna;
            f.properties = { id: r.id, vlak: colors[0], rand: colors[1] };
            state.shapes[r.id] = f;
          }
        })
        .catch(function () { /* no outline: the region still works with its badge */ });
    });
    Promise.all(loads).then(function () {
      var features = Object.keys(state.shapes).map(function (id) { return state.shapes[id]; });
      var all = { type: "FeatureCollection", features: features };
      state.map.getSource("provincies").setData(all);
      state.map.getSource("provincie-randen").setData(all);
      updateVeil();
      /* The official border of a province by the sea runs far out over the
         water; like the drawn map, draw it only where it runs over land. */
      state.atlas.ready.then(function () {
        var edges = state.atlas.edges();
        if (!edges) return;
        edges.features.forEach(function (f) {
          var colors = REGION_COLORS[f.properties.id] || REGION_COLORS.dalarna;
          f.properties.rand = colors[1];
        });
        state.map.getSource("provincie-randen").setData(edges);
      });
    });
  }

  /* The towns the guest's places lie at (Falun, Orsa, Mora, ...) get a dot
     on the map (layer place-key-dot in kaartstijl.js) and a bold name on
     top of the markers (see placeKeyTowns): for every place the nearest
     town within KEY_TOWN_KM. The map's own town labels leave those names
     out, so they are not on the map twice. */
  function keyTowns() {
    fetch(SHAPES_URL + "plaatsen.json")
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) {
        if (!data || !data.features) return;
        var found = {};
        state.guide.regios.forEach(function (r) {
          (r.plekken || []).forEach(function (p) {
            if (onlyClose(p)) return; // a shop does not make its town a key town
            var best = null;
            data.features.forEach(function (f) {
              var km = kmBetween(p.coord, f.geometry.coordinates);
              if (km <= KEY_TOWN_KM && (!best || km < best.km)) best = { km: km, town: f };
            });
            if (best) found[best.town.properties.name] = best.town;
          });
        });
        var names = Object.keys(found);
        if (!names.length) return;
        var map = state.map;
        state.keyTowns = names.map(function (name) {
          var node = el("div", "rg-town");
          node.setAttribute("aria-hidden", "true"); // the places themselves carry the names for screen readers
          var label = el("span", "rg-town__naam", name);
          node.appendChild(label);
          var at = maplibregl.LngLat.convert(found[name].geometry.coordinates);
          var marker = new maplibregl.Marker({ element: node, anchor: "center" }).setLngLat(at).addTo(map);
          return { name: name, at: at, rank: found[name].properties.rank || 30, marker: marker, el: node, label: label, anchor: at };
        });
        var isKey = ["in", ["get", "name"], ["literal", names]];
        map.setFilter("place-key-dot", isKey);
        ["place-village", "place-town-early", "place-town", "place-city-overview"].forEach(function (id) {
          var own = map.getFilter(id);
          map.setFilter(id, own ? ["all", own, ["!", isKey]] : ["!", isKey]);
        });
        layoutLabels();
        // Measured again once the font is there (the first size may be the fallback's).
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(function () {
            state.keyTowns.forEach(function (t) { t.w = 0; });
            layoutLabels();
          });
        }
      })
      .catch(function () { /* the towns keep their ordinary names */ });
  }

  function kmBetween(a, b) {
    var lat = (a[1] + b[1]) / 2 * Math.PI / 180;
    return Math.hypot((a[0] - b[0]) * 111.32 * Math.cos(lat), (a[1] - b[1]) * 110.57);
  }

  /* The province tint: full on the overview and in the region, much
     quieter in the journey so the route stands out on it. */
  var PROVINCE_TINT = [3, 0.75, 5, 0.5, 6.3, 0.14, 7.2, 0.04, 10, 0];
  function updateProvinceTint() {
    var factor = (state.mode === "reis" ? 0.35 : 1) * (state.snowLook ? SNOW_TINT : 1) * (state.satellite ? SAT_TINT : 1);
    var stops = PROVINCE_TINT.map(function (v, i) { return i % 2 ? v * factor : v; });
    state.map.setPaintProperty("provincie-vlak", "fill-opacity", ["interpolate", ["linear"], ["zoom"]].concat(stops));
  }

  /* A world-sized polygon with the current region cut out. */
  function updateVeil() {
    var map = state.map;
    if (map.getLayer("provincie-vlak")) updateProvinceTint();
    var shape = state.mode === "regio" && state.region ? state.shapes[state.region.id] : null;
    // With the drawing under the map the colours around stay (no veil).
    if (!shape || state.underlay) {
      map.setPaintProperty("provincie-sluier", "fill-opacity", 0);
      return;
    }
    var polys = shape.geometry.type === "Polygon" ? [shape.geometry.coordinates] : shape.geometry.coordinates;
    var world = [[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]];
    var rings = [world];
    polys.forEach(function (poly) {
      var ring = poly[0].slice();
      if (ringArea(ring) * ringArea(world) > 0) ring.reverse(); // holes wind the other way
      rings.push(ring);
    });
    map.getSource("sluier").setData({ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: rings } });
    map.setPaintProperty("provincie-sluier", "fill-opacity", ["interpolate", ["linear"], ["zoom"], 7, state.satellite ? SAT_VEIL : 0.6, 9.5, 0]);
  }

  function ringArea(ring) {
    var a = 0;
    for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      a += (ring[j][0] - ring[i][0]) * (ring[j][1] + ring[i][1]);
    }
    return a;
  }

  function padding(panel) {
    var top = 84;
    if (isWide()) return { top: top, bottom: 48, left: 25 * 16 + 48, right: 64 };
    top = 118; // markers stand above their spot, keep them clear of the top bar
    var bottom = (panel && !panel.hidden ? panel.offsetHeight + panelGap(panel) : 0) + 20;
    return { top: top, bottom: Math.min(bottom, window.innerHeight - top - 160), left: 40, right: 40 };
  }

  /* MapLibre overwrites the aria-label of a marker element with "Map marker";
     put our own label back. */
  function addMarker(node, anchor, lngLat) {
    var label = node.getAttribute("aria-label");
    var marker = new maplibregl.Marker({ element: node, anchor: anchor }).setLngLat(lngLat).addTo(state.map);
    if (label) node.setAttribute("aria-label", label);
    else node.removeAttribute("aria-label");
    return marker;
  }

  function offsetFor(pad) {
    return [(pad.left - pad.right) / 2, (pad.top - pad.bottom) / 2];
  }

  /* With reduced motion MapLibre turns a flight into a jump and drops the
     offset, so the spot would land behind the panel; an instant easeTo
     keeps the offset. */
  function flyTo(options) {
    if (reduceMotion) return state.map.easeTo(Object.assign({}, options, { duration: 0 }));
    return state.map.flyTo(options);
  }

  /* Fold a panel down to a slim bar (phones only), or open it again. */
  function setCollapsed(panel, on) {
    if (isWide() || panel.hidden) on = false;
    panel.classList.toggle("is-ingeklapt", on);
    var toggle = panel === els.journey ? els.journeyToggle : els.sheetToggle;
    toggle.setAttribute("aria-expanded", String(!on));
    var title = panel === els.journey ? els.stepTitle.textContent
      : state.place ? state.place.naam : state.region ? state.region.naam : "";
    toggle.querySelector(".rg-peek__title").textContent = title;
    toggle.querySelector(".rg-peek__hint").textContent = panel === els.journey ? "Toon stap" : "Toon info";
    setAttributionOffset(panel);
  }

  function setAttributionOffset(panel) {
    var folded = panel && panel.classList.contains("is-ingeklapt");
    var px = isWide() || !panel || panel.hidden ? 0 : panelGap(panel) + (folded ? 4.4 * rem() : panel.offsetHeight) + 8;
    els.map.style.setProperty("--rg-map-bottom", px + "px");
  }

  /* The room between a floating panel and the bottom of the screen. */
  function panelGap(panel) {
    var parent = panel.offsetParent;
    return parent ? Math.max(0, parent.clientHeight - panel.offsetTop - panel.offsetHeight) : 0;
  }
  function rem() { return parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16; }

  /* ------------------------------------------------------------------------
     Motion kit: a spring, titles that come into focus word by word, panels
     you can drag with a finger, and a drawing that flies from where you
     tapped it into the panel.
     ------------------------------------------------------------------------ */

  /* A damped spring from `from` to `to` (px), starting with velocity v
     (px per second); calls frame(x) every frame and done() at rest. */
  function spring(from, to, v, frame, done) {
    var k = 420, c = 2 * Math.sqrt(k) * 0.84, x = from, last = null;
    function step(now) {
      var dt = last === null ? 1 / 60 : Math.min(0.032, (now - last) / 1000);
      last = now;
      var a = -k * (x - to) - c * v;
      v += a * dt;
      x += v * dt;
      if (Math.abs(x - to) < 0.4 && Math.abs(v) < 8) { frame(to); if (done) done(); return; }
      frame(x);
      window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  /* A heading whose words rise and sharpen one after another. The words
     stay plain text for screen readers. */
  function setTitle(node, text) {
    node.textContent = "";
    if (reduceMotion) { node.textContent = text; return; }
    text.split(/(\s+)/).forEach(function (part, i) {
      if (!part) return;
      if (/^\s+$/.test(part)) { node.appendChild(document.createTextNode(part)); return; }
      var word = el("span", "rg-word", part);
      word.style.setProperty("--w", Math.floor(i / 2));
      node.appendChild(word);
    });
  }

  /* Drag a panel up and down by its handle (phones). On release it springs
     open or folded, carrying the speed of the finger; a tap still toggles. */
  function attachDrag(panel, handle) {
    var drag = null, swallowClick = false;
    handle.addEventListener("pointerdown", function (e) {
      if (isWide() || reduceMotion || !panel.classList.contains("is-open")) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      var closed = panel.offsetHeight - 4.4 * rem();
      var base = panel.classList.contains("is-ingeklapt") ? closed : 0;
      drag = { id: e.pointerId, y0: e.clientY, last: e.clientY, t: e.timeStamp, v: 0, base: base, closed: closed, y: base, moved: false };
      try { handle.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
    });
    handle.addEventListener("pointermove", function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dy = e.clientY - drag.y0;
      if (!drag.moved && Math.abs(dy) < 6) return;
      drag.moved = true;
      var y = drag.base + dy;
      // Past the ends it gets heavier, like rubber.
      if (y < 0) y = y * 0.28;
      if (y > drag.closed) y = drag.closed + (y - drag.closed) * 0.28;
      var dt = e.timeStamp - drag.t;
      if (dt > 0) drag.v = drag.v * 0.3 + ((e.clientY - drag.last) / dt) * 1000 * 0.7;
      drag.last = e.clientY; drag.t = e.timeStamp; drag.y = y;
      panel.style.transition = "none";
      panel.style.transform = "translateY(" + y.toFixed(1) + "px)";
    });
    function release(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var d = drag;
      drag = null;
      if (!d.moved) return; // a tap: the click below toggles
      swallowClick = true;
      window.setTimeout(function () { swallowClick = false; }, 350);
      var fold = d.y + d.v * 0.2 > d.closed / 2;
      spring(d.y, fold ? d.closed : 0, d.v, function (y) {
        panel.style.transform = "translateY(" + y.toFixed(1) + "px)";
      }, function () {
        setCollapsed(panel, fold);
        panel.style.transform = "";
        panel.style.transition = "";
        if (navigator.vibrate) navigator.vibrate(6);
      });
    }
    handle.addEventListener("pointerup", release);
    handle.addEventListener("pointercancel", release);
    handle.addEventListener("click", function (e) {
      if (swallowClick) { swallowClick = false; e.stopImmediatePropagation(); }
    });
  }

  /* Remember the drawing that was tapped (a card or a marker), so the
     detail can fly in from there. */
  function rememberFlight(node) {
    var r = node && node.getBoundingClientRect();
    state.flight = r && r.width ? { left: r.left, top: r.top, width: r.width, at: Date.now() } : null;
  }

  /* A copy of the drawing flies on a slight arc from the tapped spot to its
     place in the panel, following the panel while it still moves; the real
     drawing takes over when it lands. */
  function flyInto(target) {
    var from = state.flight;
    state.flight = null;
    if (!from || reduceMotion || Date.now() - from.at > 1200) return;
    var clone = target.cloneNode(true);
    clone.classList.add("rg-fly");
    clone.removeAttribute("id");
    els.app.appendChild(clone);
    target.style.visibility = "hidden";
    var ms = 760, startAt = null;
    function frame(now) {
      if (startAt === null) startAt = now;
      var p = Math.min(1, (now - startAt) / ms);
      var e = 1 - Math.pow(1 - p, 4);
      var to = target.getBoundingClientRect();
      var w = from.width + (to.width - from.width) * e;
      var x = from.left + (to.left - from.left) * e;
      var y = from.top + (to.top - from.top) * e - Math.sin(Math.PI * e) * 46;
      clone.style.width = clone.style.height = to.width + "px";
      clone.style.transform = "translate(" + x.toFixed(1) + "px, " + y.toFixed(1) + "px) scale(" + (w / to.width).toFixed(4) + ") rotate(" + (-10 * Math.sin(Math.PI * e)).toFixed(2) + "deg)";
      if (p < 1) { window.requestAnimationFrame(frame); return; }
      target.style.visibility = "";
      clone.remove();
    }
    window.requestAnimationFrame(frame);
  }

  /* A puck glides along the swept lane at the top of the journey to where
     you are in the trip (the line itself fills in behind it). */
  function glidePuck(to) {
    var path = els.journeyDone, puck = els.journeyPuck;
    if (!path || !puck || !path.getTotalLength) return;
    var from = typeof glidePuck.at === "number" ? glidePuck.at : 0;
    glidePuck.at = to;
    window.cancelAnimationFrame(glidePuck.frame);
    var ms = duration(1100), startAt = null;
    function place(t) {
      var svgBox = path.ownerSVGElement.getBoundingClientRect();
      var head = els.journey.querySelector(".rg-journey__head").getBoundingClientRect();
      if (!svgBox.width) return;
      var pt = path.getPointAtLength(path.getTotalLength() * t);
      var x = svgBox.left - head.left + pt.x / 400 * svgBox.width;
      var y = svgBox.top - head.top + pt.y / 24 * svgBox.height;
      puck.style.transform = "translate(" + x.toFixed(1) + "px, " + y.toFixed(1) + "px)";
    }
    function frame(now) {
      if (startAt === null) startAt = now;
      var p = ms ? Math.min(1, (now - startAt) / ms) : 1;
      var e = 1 - Math.pow(1 - p, 4);
      place(from + (to - from) * e);
      if (p < 1) glidePuck.frame = window.requestAnimationFrame(frame);
    }
    glidePuck.frame = window.requestAnimationFrame(frame);
  }

  /* The dark thumb behind the chosen filter glides over to the new one. */
  function placeFilterThumb(animate) {
    var thumb = els.filters.querySelector(".rg-filters__thumb");
    var chosen = els.filters.querySelector('[aria-pressed="true"]');
    if (!thumb || !chosen || !chosen.offsetWidth) return;
    if (!animate) thumb.style.transition = "none";
    thumb.style.width = chosen.offsetWidth + "px";
    thumb.style.height = chosen.offsetHeight + "px";
    thumb.style.transform = "translate(" + chosen.offsetLeft + "px, " + chosen.offsetTop + "px)";
    els.filters.classList.add("met-duim");
    if (!animate) { void thumb.offsetWidth; thumb.style.transition = ""; }
  }

  /* Sweden view ------------------------------------------------------------ */
  function buildRegionDecor() {
    Object.keys(DECOR_REGION).forEach(function (id) {
      DECOR_REGION[id].forEach(function (d) { addDecor(d, id); });
    });
  }

  function addDecor(d, scope) {
    var node = el("div", "rg-decor" + (d.small ? " rg-decor--klein" : ""));
    node.setAttribute("aria-hidden", "true");
    var inner = el("span", "rg-decor__inner");
    inner.appendChild(art(d.art));
    node.appendChild(inner);
    var marker = addMarker(node, "center", d.at);
    state.decor.push({ el: node, scope: scope, marker: marker });
  }

  function updateDecorVisibility() {
    if (!state.map) return;
    var zoom = state.map.getZoom();
    state.decor.forEach(function (d) {
      // Not while diving in: they come in once the camera is there.
      var show = state.mode === "regio" && state.region && state.region.id === d.scope && zoom < 10 && !state.diving;
      d.el.classList.toggle("is-zichtbaar", !!show);
    });
  }

  function centerOf(places) {
    if (!places.length) return null;
    return boundsOf(places.map(function (p) { return p.coord; })).getCenter().toArray();
  }

  function boundsOf(coords) {
    var b = new maplibregl.LngLatBounds();
    coords.forEach(function (c) { b.extend(c); });
    return b;
  }

  function showOverview(firstLoad) {
    if (state.mode === "overzicht") {
      if (state.satellite && state.mapReady) overviewLook(false);
      else layoutAtlas();
      return;
    }
    var cameFrom = state.mode === "regio" && state.region ? state.region.id : null;
    var fromInside = state.mode === "regio" || state.mode === "reis";
    leaveRegion(true);
    leaveJourney();
    state.mode = "overzicht";
    els.back.hidden = true;
    els.welcome.hidden = false;
    window.requestAnimationFrame(function () {
      els.welcome.classList.remove("is-weg");
      layoutAtlas();
    });
    updateVeil();
    updateDecorVisibility();

    if (state.satellite && state.mapReady) {
      setSnowLook(false, 0, 0);
      if (!fromInside || reduceMotion) { overviewLook(false); return; }
      // On the pictures the camera pulls up through the clouds to the whole north.
      var satMap = state.map;
      var satToken = ++state.diveToken;
      state.stopPrefetch();
      state.diving = true;
      var satCam = satOverviewCamera();
      flyThroughClouds(2400);
      satMap.flyTo({ center: satCam.center, zoom: satCam.zoom, pitch: 0, bearing: 0, duration: 2100, curve: 1.45, essential: false });
      satMap.once("moveend", function () {
        if (satToken !== state.diveToken) return;
        state.diving = false;
        if (state.mode === "overzicht") overviewLook(false);
      });
      window.setTimeout(function () { if (state.mode === "overzicht" && satToken === state.diveToken) showSatBadges(true); }, 1300);
      return;
    }

    if (fromInside && !reduceMotion) {
      // The live map pulls up and away, tilting back, into the clouds...
      var map = state.map;
      var token = ++state.diveToken;
      state.stopPrefetch();
      state.diving = true;
      map.easeTo({
        zoom: map.getZoom() - 1.8, pitch: 50, bearing: 16, duration: 1100,
        easing: function (t) { return t * t * t; }
      });
      flyThroughClouds(2400);
      // ...and the drawing comes back while the clouds are thickest.
      window.setTimeout(function () {
        if (state.mode === "overzicht") state.atlas.zoomOutFrom(cameFrom, 1700);
      }, 850);
      window.setTimeout(function () {
        // Under the drawing the snow melts unseen.
        if (state.mode === "overzicht") setSnowLook(false, 0, 0);
        if (token !== state.diveToken) return;
        // Under the drawing: lay the live map flat again for the next dive.
        map.stop();
        map.jumpTo({ pitch: 0, bearing: 0 });
        state.diving = false;
      }, 1300);
    } else {
      setSnowLook(false, 0, 0);
      state.atlas.show(firstLoad === true);
    }
  }

  /* Leaving the overview (into a region or a journey): its badges go. */
  function leaveOverview() {
    showSatBadges(false);
  }

  /* From the drawn map into the live map, as one flat zoom down to `camera`
     (Joey 2026-10-30: the zoom has to be clean, the 3D goes on the way, and
     the roads and villages come in early). Everything grows around one
     point that keeps its place on the screen (see plan in atlas.js). The
     drawing does the first level, while the raised tile settles onto the
     map; then the live map, waiting under it at exactly that view with the
     drawing as its ground (see setUnderlay), zooms on around the same point
     on the same clock. The drawing dissolves into it, the lines stay thin
     and sharp, and the real lakes, roads and names come in while it is
     still zooming. Returns false when the drawn map is not shown. */
  function diveFromAtlas(camera) {
    var map = state.map;
    if (!state.atlas.isShown()) return false;
    state.diveLiveMs = 0;
    if (reduceMotion) {
      state.atlas.hide();
      if (camera) map.jumpTo(camera);
      return true;
    }
    var token = ++state.diveToken;
    state.stopPrefetch();
    var plan = state.atlas.plan(camera);
    if (!plan) {
      // Nowhere (much) closer to go: the drawing dissolves into the live map.
      map.stop();
      if (camera) map.jumpTo({ center: camera.center, zoom: camera.zoom, pitch: 0, bearing: 0 });
      state.atlas.fadeOut(DIVE.fadeMsBare, function () { if (token === state.diveToken) state.atlas.hide(); });
      return true;
    }
    state.diving = true;
    var dz = plan.dz;
    var hand = Math.min(DIVE.handZoom, dz * 0.45);
    var ms = Math.min(DIVE.maxMs, DIVE.ms + DIVE.msPerZoom * dz);
    var handMs = Math.round(ms * diveTimeAt(hand / dz));
    state.diveLiveMs = handMs;
    /* The drawing zooms on a little past the handover, on the same clock: a
       phone that is busy for a moment (tiles, pictures) hands over a little
       late, and the zoom then runs on instead of standing still. */
    var over = Math.min(hand + DIVE.overZoom, dz * 0.9);
    var overMs = Math.max(handMs, Math.round(ms * diveTimeAt(over / dz)));

    var frames = [], steps = Math.max(24, Math.round(overMs / 30));
    for (var i = 0; i <= steps; i++) {
      frames.push({ offset: i / steps, zoom: diveCurve(i / steps * overMs / ms) * dz });
    }
    var begin = performance.now();
    state.atlas.zoomInto({ plan: plan, frames: frames, ms: overMs, flatAt: hand * 0.9 });

    // Under the drawing the live map loads its tiles for the way down,
    // the deepest first, and then waits where the drawing hands over.
    var handCamera = plan.cameraAt(hand);
    map.stop();
    var stopPrefetch = state.stopPrefetch = prefetch([camera, plan.cameraAt((hand + dz) / 2), handCamera]);

    // Pictures of the drawing for the live map to lie on: the whole map, the
    // view where it takes over and the view it ends on, each sharp there.
    // Made once the zoom runs on its own (they are drawn on the main thread).
    var laid = null, handed = false, dissolving = false;
    var shots = new Promise(function (resolve) { window.setTimeout(resolve, 60); })
      .then(function () { return plan.pictureAt(hand); })
      .then(function (near) { return plan.pictureAt(dz).then(function (end) { return [near, end]; }); });
    Promise.all([state.atlas.wholePicture(), shots]).then(function (all) {
      if (token !== state.diveToken) return;
      laid = setUnderlay([all[0], all[1][0], all[1][1]], { zoom: plan.zoom, hand: hand, from: camera.zoom + 0.8 });
      if (handed) dissolve();
    });
    window.setTimeout(handOver, handMs);

    function follow() {
      if (token !== state.diveToken) { map.off("move", follow); return; }
      state.atlas.follow(map.getCenter(), map.getZoom());
    }
    function dissolve() {
      if (dissolving) return;
      dissolving = true;
      state.atlas.fadeOut(laid ? DIVE.fadeMs : DIVE.fadeMsBare, function () {
        map.off("move", follow);
        if (token === state.diveToken) state.atlas.hide();
      });
    }
    function handOver() {
      stopPrefetch();
      if (token !== state.diveToken) return;
      handed = true;
      map.stop();
      // Late: the drawing has zoomed on, so the live map starts where it is now.
      var from = Math.max(hand, Math.min(over, diveCurve(Math.min(1, (performance.now() - begin) / ms)) * dz));
      var startCamera = from > hand + 0.01 ? plan.cameraAt(from) : handCamera;
      map.jumpTo({ center: startCamera.center, zoom: startCamera.zoom, pitch: 0, bearing: 0 });
      follow();
      map.on("move", follow);
      // On the same clock as the drawing, so the zoom runs on without a seam
      // even when this starts a little late.
      var rest = Math.max(250, ms - (performance.now() - begin));
      map.easeTo({
        zoom: camera.zoom, around: plan.around, pitch: 0, bearing: 0, duration: rest,
        easing: function (k) {
          if (k >= 1) return 1;
          var z = diveCurve(Math.min(1, (performance.now() - begin) / ms)) * dz;
          return Math.max(0, Math.min(1, (z - from) / (dz - from)));
        }
      });
      map.once("moveend", function () {
        if (token !== state.diveToken) return;
        state.diving = false;
        levelOut();
        regroup();
        updateDecorVisibility();
      });
      if (laid !== null) dissolve();
      // The pictures are late: do not keep the drawing waiting.
      else window.setTimeout(function () { if (token === state.diveToken) dissolve(); }, 400);
    }
    return true;
  }

  /* The zoom over a dive, as part of the way down (0 to 1) at part `u` of
     its time: it starts slowly, picks up speed and comes down gently, like
     a CSS cubic-bezier(0.3, 0, 0.2, 1). */
  function diveCurve(u) {
    var lo = 0, hi = 1, t = u;
    for (var i = 0; i < 26; i++) {
      t = (lo + hi) / 2;
      if (bezier(t, 0.3, 0.2) < u) lo = t; else hi = t;
    }
    return bezier(t, 0, 1);
  }
  function bezier(t, a, b) { return 3 * (1 - t) * (1 - t) * t * a + 3 * (1 - t) * t * t * b + t * t * t; }
  /* ...and the other way round: the part of the time at which the zoom has
     come `part` of the way down. */
  function diveTimeAt(part) {
    var lo = 0, hi = 1;
    for (var i = 0; i < 26; i++) {
      var u = (lo + hi) / 2;
      if (diveCurve(u) < part) lo = u; else hi = u;
    }
    return (lo + hi) / 2;
  }

  /* Lets the live map load its tiles for the way down while the drawing
     still covers it: it stands at each camera in turn until its tiles are in
     (or a moment has passed), and stays at the last one. Returns a function
     that stops it where it is. */
  function prefetch(cameras) {
    var map = state.map;
    var stopped = false, timer = null, go = null;
    (function next(i) {
      var c = cameras[i];
      map.jumpTo({ center: c.center, zoom: c.zoom, pitch: 0, bearing: 0 });
      if (i === cameras.length - 1) return;
      go = function () {
        window.clearTimeout(timer);
        map.off("idle", go);
        if (!stopped) next(i + 1);
      };
      timer = window.setTimeout(go, i ? 250 : 450);
      map.on("idle", go);
    })(0);
    return function () {
      stopped = true;
      window.clearTimeout(timer);
      if (go) map.off("idle", go);
    };
  }

  /* The drawing carried on under the live map after the dive (Joey: the ice
     and the colours of the whole map stay while you zoom in). Pictures of the
     drawn map (the whole map, the view where the live map takes over, the
     view the dive ends on and, once the camera rests, a sharp one of the
     view) lie under the water, the roads and the names, so the real map
     comes in on top of them. The live ocean stays away while the drawn sea
     and ice show; the real lakes come in just after the live map has taken
     over. The drawing's province borders and the booked province's border
     are drawn by the live map itself: as wide as in the drawing where it
     takes over, and from there on thin and sharp at every zoom; the live
     borders, glow and country names stay away meanwhile. From zoom `from`
     on, over two zoom levels, the drawing gives way to the normal winter
     map. `shots`: [whole, near, end], any of them may be null; `at`: { zoom
     (the drawing's own scale as a zoom level), hand (levels below that
     where the live map takes over), from }. Returns whether a picture was
     laid. */
  var UNDERLAY = ["tekening-ver", "tekening-nabij", "tekening", "tekening-scherp"];
  var UNDERLAY_LINES = ["border-country", "border-county", "provincie-gloed"];
  /* The drawing's province borders on the live map (see addOwnLayers):
     [width in the drawing (px), opacity, width once the live map has taken
     over (px)]; and the same for the booked province's border. */
  var DRAWN_BORDER = [1.2, 0.55, 1.5];
  var DRAWN_EDGE = [2.2, 1, 2.4];
  function setUnderlay(shots, at) {
    var map = state.map;
    UNDERLAY.forEach(function (id) {
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    });
    if (!shots.some(Boolean)) return false;
    if (!state.underlayBase) {
      state.underlayBase = { edge: map.getPaintProperty("provincie-rand", "line-width") };
      UNDERLAY_LINES.forEach(function (id) {
        var v = map.getPaintProperty(id, "line-opacity");
        state.underlayBase[id] = v === undefined ? 1 : v;
      });
      map.getSource("tekening-grenzen").setData(state.atlas.borders());
      // Sharper drawing wherever the camera comes to rest, in a quiet moment:
      // the picture costs the phone a moment of work, never during a move.
      map.on("moveend", function () {
        window.clearTimeout(state.sharpenTimer);
        state.sharpenTimer = window.setTimeout(function () {
          if (window.requestIdleCallback) window.requestIdleCallback(sharpenUnderlay, { timeout: 1500 });
          else sharpenUnderlay();
        }, 350);
      });
    }
    state.underlayAt = at;
    state.sharpAt = null;
    shots.forEach(function (shot, i) { layUnderlay(UNDERLAY[i], shot); });
    state.underlay = true;
    showUnderlay(!state.snowLook, { duration: 0, delay: 0 });
    updateVeil();
    return true;
  }

  /* One picture as a map layer; `fadeMs` lets it come in softly over what
     lies there already. */
  function layUnderlay(id, shot, fadeMs) {
    var map = state.map;
    if (map.getLayer(id)) map.removeLayer(id);
    if (map.getSource(id)) map.removeSource(id);
    if (!shot) return;
    map.addSource(id, { type: "canvas", canvas: shot.canvas, coordinates: shot.corners, animate: false });
    map.addLayer({
      id: id, type: "raster", source: id,
      layout: { visibility: state.satellite ? "none" : "visible" },
      paint: { "raster-opacity": underlayOpacity(fadeMs ? 0 : 1), "raster-fade-duration": 0, "raster-resampling": "linear" }
    }, "water");
    if (!fadeMs) return;
    var start = null;
    (function step(now) {
      if (!map.getLayer(id) || state.snowLook) return;
      if (start === null) start = now;
      var t = Math.min(1, (now - start) / fadeMs);
      map.setPaintProperty(id, "raster-opacity", underlayOpacity(t * t * (3 - 2 * t)));
      if (t < 1) window.requestAnimationFrame(step);
    })(performance.now());
  }

  function underlayOpacity(strength) {
    var s = strength === undefined ? 1 : strength;
    return ["interpolate", ["linear"], ["zoom"], state.underlayAt.from, s, state.underlayAt.from + 2, 0];
  }

  /* A line of the drawing on the live map: `drawn` px wide (as in the
     drawing) at the drawing's own scale, growing with it down to where the
     live map takes over, and from there settling at `settled` px. */
  function drawnWidth(drawn, settled) {
    var at = state.underlayAt, hand = at.zoom + at.hand;
    return ["interpolate", ["exponential", 2], ["zoom"], at.zoom, drawn, hand, drawn * Math.pow(2, at.hand), hand + 1.5, settled];
  }

  /* The drawing under the map on, or away (under the snow of Norrbotten). */
  function showUnderlay(on, transition) {
    var map = state.map, at = state.underlayAt, from = at.from, to = from + 2;
    UNDERLAY.forEach(function (id) {
      if (!map.getLayer(id)) return;
      map.setPaintProperty(id, "raster-opacity-transition", transition);
      map.setPaintProperty(id, "raster-opacity", on ? underlayOpacity() : 0);
    });
    // The real lakes come in just after the live map has taken over (the
    // drawing has them too until then), the sea only where the drawing goes.
    var ocean = ["==", ["get", "class"], "ocean"];
    var lakesIn = at.zoom + at.hand;
    var water = function (full) {
      var stops = [from, ["case", ocean, 0, full], to, full];
      if (lakesIn + 0.6 < from) stops = [lakesIn, 0, lakesIn + 0.6, ["case", ocean, 0, full]].concat(stops);
      return ["interpolate", ["linear"], ["zoom"]].concat(stops);
    };
    map.setPaintProperty("water", "fill-opacity", on ? water(1) : 1);
    map.setPaintProperty("water-shore", "line-opacity", on ? water(0.75) : 0.75);
    UNDERLAY_LINES.forEach(function (id) {
      if (!map.getLayer(id)) return;
      var base = state.underlayBase[id];
      // Back in where the drawing gives way (the province glow is gone by then anyway).
      var under = typeof base === "number" ? ["interpolate", ["linear"], ["zoom"], from, 0, to, base] : 0;
      map.setPaintProperty(id, "line-opacity", on ? under : base);
    });
    map.setPaintProperty("tekening-grens", "line-width", drawnWidth(DRAWN_BORDER[0], DRAWN_BORDER[2]));
    // Gone well before the drawing is: the drawn borders are only close, the real map's own (and the booked province's) lie a little beside them.
    map.setPaintProperty("tekening-grens", "line-opacity-transition", transition);
    map.setPaintProperty("tekening-grens", "line-opacity", on ? ["interpolate", ["linear"], ["zoom"], from, DRAWN_BORDER[1], from + 0.8, 0] : 0);
    map.setPaintProperty("provincie-rand", "line-width", on ? drawnWidth(DRAWN_EDGE[0], DRAWN_EDGE[2]) : state.underlayBase.edge);
    // The drawing names the countries itself, at its own zoom.
    map.setPaintProperty("place-country", "text-opacity", on ? 0 : 1);
  }

  function sharpenUnderlay() {
    var map = state.map;
    var quiet = function () { return state.underlay && !state.snowLook && !state.satellite && !state.diving && !map.isMoving() && state.mode !== "overzicht"; };
    if (!quiet()) return;
    if (map.getZoom() >= state.underlayAt.from + 2) return; // the drawing is gone at this zoom
    var W = window.innerWidth, H = window.innerHeight;
    var view = map.getBounds(), at = map.getZoom(), last = state.sharpAt;
    // Still inside the last sharp picture, at about its zoom: nothing to do.
    if (last && Math.abs(at - last.zoom) < 0.5 && view.getWest() >= last.nw[0] && view.getEast() <= last.se[0] &&
        view.getNorth() <= last.nw[1] && view.getSouth() >= last.se[1]) return;
    var nw = map.unproject([-0.25 * W, -0.25 * H]), se = map.unproject([1.25 * W, 1.25 * H]);
    var sharp = state.sharpAt = { zoom: at, nw: [nw.lng, nw.lat], se: [se.lng, se.lat] };
    var width = 1.5 * W * Math.min(2, window.devicePixelRatio || 1);
    // Asked again right before the drawing: when the guest moves on, it waits for the next rest.
    state.atlas.pictureOf([nw.lng, nw.lat], [se.lng, se.lat], width, quiet).then(function (shot) {
      if (!shot) { if (state.sharpAt === sharp) state.sharpAt = null; return; }
      if (state.underlay && !state.snowLook && Math.abs(map.getZoom() - at) < 1.5) layUnderlay(UNDERLAY[3], shot, 600);
    });
  }

  /* Camera for a set of points, fitted between the top bar and the panel.
     The map's own padding stays zero on purpose: MapLibre keeps a padding
     passed to flyTo and adds it to every later fit, which then fails. */
  function cameraFor(coords, panel, maxZoom) {
    if (!coords.length) return null;
    if (coords.length === 1) {
      var c = coords[0];
      coords = [[c[0] - 0.002, c[1] - 0.001], [c[0] + 0.002, c[1] + 0.001]];
      maxZoom = Math.min(maxZoom, 11);
    }
    var cam = state.map.cameraForBounds(boundsOf(coords), { padding: padding(panel), maxZoom: maxZoom });
    return cam ? { center: cam.center, zoom: Math.min(cam.zoom, maxZoom) } : null;
  }

  /* Region view ------------------------------------------------------------ */
  function leaveRegion(toOverview) {
    if (state.mode !== "regio") return;
    stopCarRoute(false);
    clearPlaceRoutes();
    window.clearTimeout(state.snowTimer);
    stopSnowfall();
    // Back to the overview it melts under the drawing (see showOverview).
    if (!toOverview) setSnowLook(false, duration(900), 0);
    state.region = null;
    state.place = null;
    clearPlaceMarkers();
    clearMarks();
    stopTrackAnim();
    setTrackProgress(1, 1);
    state.map.getSource("banen").setData(EMPTY);
    els.sheet.classList.remove("is-open", "is-detail");
    els.detail.hidden = true;
    els.sheetList.hidden = false;
    window.setTimeout(function () { if (state.mode !== "regio") els.sheet.hidden = true; }, 650);
  }

  function openRegion(region, fit) {
    var fresh = state.mode !== "regio" || state.region !== region;
    var fromAbove = state.mode === "overzicht" || state.mode === null;
    if (state.mode === "reis") leaveJourney();
    if (fresh && state.mode === "regio") leaveRegion();
    leaveOverview();
    state.mode = "regio";
    state.region = region;
    if (fresh) {
      state.filter = "alle";
      if (SNOW_REGIONS[region.id]) snowSoon(region);
      else setSnowLook(false, fromAbove ? 0 : duration(900), 0);
    }

    els.welcome.classList.add("is-weg");
    els.back.hidden = false;
    updateBack();

    els.sheetEyebrow.textContent = region.ondertitel || "Jouw plekken";
    if (els.sheetTitle.textContent !== region.naam) setTitle(els.sheetTitle, region.naam);
    buildCarRoutes();
    buildFilters();
    buildPlaceList();
    els.sheet.hidden = false;
    window.requestAnimationFrame(function () { placeFilterThumb(false); });
    setCollapsed(els.sheet, false);
    window.requestAnimationFrame(function () { els.sheet.classList.add("is-open"); });

    updateVeil();
    if (fit && fresh) holdTracks(); // they sweep in once the camera is there
    updateTracks();
    if (fit) fitRegion(fresh, fresh && fromAbove);
    else if (state.atlas.isShown()) state.atlas.hide();
    updateDecorVisibility();
  }

  function visiblePlaces() {
    var region = state.region;
    if (!region) return [];
    return region.plekken.filter(function (p) {
      return state.filter === "alle" || kindOf(p) === state.filter || kindOf(p) === "verblijf";
    });
  }

  /* The places the camera frames for the region. Places that only show
     close up stay out of it, so they do not change the view of the region. */
  function framedPlaces() {
    var places = visiblePlaces();
    return filteredClose() ? places : places.filter(function (p) { return !onlyClose(p); });
  }

  function fitRegion(reveal, fromAtlas) {
    var places = framedPlaces();
    window.requestAnimationFrame(function () {
      var pad = padding(els.sheet);
      setAttributionOffset(els.sheet);
      // On the pictures, down from the whole north: longer, through the clouds.
      var fromHigh = fromAtlas && state.satellite && !state.atlas.isShown();
      var ms = duration(fromHigh ? 1900 : 1100);
      if (fromHigh) flyThroughClouds(2300);
      if (fromAtlas) {
        var coords = regionCoords(places);
        if (diveFromAtlas(cameraFor(coords, els.sheet, places.length < 3 ? 12 : 10.5))) {
          // The markers drop in as soon as the live map shows, while the camera settles.
          if (reveal) window.setTimeout(function () { regroup(true); }, state.diveLiveMs + 100);
          return;
        }
      }
      var all = regionCoords(places);
      if (!all.length) return;
      // Filtered on the shops, the accommodation can end up at the edge: keep its pin and name in view.
      if (filteredClose()) pad = { top: pad.top + 60, right: pad.right + 60, bottom: pad.bottom + 80, left: pad.left + 60 };
      if (all.length === 1) {
        flyTo({ center: all[0], zoom: Math.min(11, state.region.zoom || 11), offset: offsetFor(pad), duration: ms });
      } else {
        state.map.fitBounds(boundsOf(all), {
          padding: pad, maxZoom: filteredClose() ? 13 : 10.5, duration: ms, curve: 1.7, essential: false
        });
      }
      // The markers drop in halfway through the flight, not only at its end.
      if (reveal) window.setTimeout(function () { regroup(true); }, ms * 0.5);
    });
  }

  /* The places plus the region's own centre, so an area with one place
     (Stockholm with Arlanda) still shows the city around it. */
  function regionCoords(places) {
    var coords = places.map(function (p) { return p.coord; });
    if (filteredClose()) return coords; // just the shops around the accommodation
    var shape = state.shapes[state.region.id];
    // Few places (Stockholm, Luleå): show the whole province around them.
    if (shape && places.length < 3) {
      var g = shape.geometry;
      (g.type === "Polygon" ? [g.coordinates] : g.coordinates).forEach(function (poly) {
        poly[0].forEach(function (c) { coords.push(c); });
      });
    } else if (state.region.centrum) {
      coords.push(state.region.centrum);
    }
    return coords;
  }

  /* Closer in than the whole region: a place is open, or the guest tapped a
     group of pins or pinched in. The back button then goes up to the whole
     region first, and only from there to the country. */
  function closeToRegion() {
    if (state.mode !== "regio" || !state.region || !state.map) return false;
    if (state.place) return true;
    var places = framedPlaces();
    var cam = cameraFor(regionCoords(places), els.sheet, filteredClose() ? 13 : places.length < 3 ? 12 : 10.5);
    return !!cam && state.map.getZoom() > cam.zoom + 0.75;
  }

  function updateBack() {
    if (state.mode !== "regio" || !state.region) return;
    var up = closeToRegion();
    var label = up ? state.region.naam : /^(helsinki|punkaharju)$/.test(state.region.id) ? "Finland" : "Zweden";
    els.back.setAttribute("aria-label", "Terug naar " + (up ? "heel " : "") + label);
    var span = els.back.querySelector("span");
    if (span.textContent === label) return;
    span.textContent = label;
    span.classList.remove("is-nieuw");
    void span.offsetWidth; // restart the animation
    span.classList.add("is-nieuw");
  }

  function buildFilters() {
    els.filters.textContent = "";
    var present = {};
    state.region.plekken.forEach(function (p) { present[kindOf(p)] = true; });
    var kinds = KIND_ORDER.filter(function (k) { return present[k]; });
    if (kinds.length < 3) { els.filters.hidden = true; return; }
    els.filters.hidden = false;
    els.filters.classList.remove("met-duim");
    els.filters.appendChild(el("span", "rg-filters__thumb"));
    ["alle"].concat(kinds).forEach(function (k) {
      var b = el("button", "rg-filter", k === "alle" ? "Alles" : KINDS[k].filter);
      b.type = "button";
      b.setAttribute("aria-pressed", String(state.filter === k));
      b.addEventListener("click", function () {
        stopCarRoute(false);
        state.filter = k;
        Array.prototype.forEach.call(els.filters.querySelectorAll(".rg-filter"), function (c) { c.setAttribute("aria-pressed", String(c === b)); });
        placeFilterThumb(true);
        if (!isWide()) b.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest", inline: "nearest" });
        buildPlaceList();
        updateTracks();
        regroup();
        fitRegion(false, false);
      });
      els.filters.appendChild(b);
    });
  }

  /* Example car route ------------------------------------------------------
     On the region map the guest can show the drive of a journey in one go:
     airport, the free shuttle to the car rental, and the road to the
     accommodation. It uses the lines and places of the journey, so there is
     nothing to maintain twice. Only regions that hold a stop of such a
     journey get the button. */
  function carOption(journey) {
    var legs = [];
    journey.stappen.forEach(function (s) {
      if (s.route && (s.route.modus === "auto" || s.route.modus === "bus")) {
        legs.push({ modus: s.route.modus, lijn: s.route.lijn, titel: s.titel, afstand: s.route.afstand, duur: s.route.duur });
      }
    });
    if (!legs.some(function (l) { return l.modus === "auto"; })) return null;
    return { journey: journey, legs: legs, stops: carStops(journey) };
  }

  function carRoutesWhere(match) {
    var out = [];
    state.guide.reisverlopen.forEach(function (journey) {
      var option = carOption(journey);
      if (option && option.stops.some(function (st) { return st.place && match(st.place); })) out.push(option);
    });
    return out;
  }

  function carRoutesFor(region) {
    return carRoutesWhere(function (place) { return region.plekken.some(function (p) { return p.id === place.id; }); });
  }

  /* The routes that stop at (or start from) this airport or car rental. */
  function carRoutesVia(place) {
    // Only the airport and the car rental show it; the other places (accommodation, ice) do not need it.
    if (kindOf(place) !== "vliegveld" && kindOf(place) !== "autoverhuur") return [];
    return carRoutesWhere(function (p) { return p.id === place.id; });
  }

  /* The stops in travel order: a place of the guide where there is one,
     else the point of the step (the airport arrival, a bus stop). */
  function carStops(journey) {
    var stops = [];
    var allPlaces = [];
    state.guide.regios.forEach(function (r) { allPlaces = allPlaces.concat(r.plekken); });
    function near(c) {
      for (var i = 0; i < stops.length; i++) if (kmBetween(stops[i].coord, c) < 0.25) return i;
      return -1;
    }
    function add(stop) {
      var i = near(stop.coord);
      if (i < 0) stops.push(stop);
      else if (stop.place && !stops[i].place) stops[i] = stop; // a place wins over a point
    }
    journey.stappen.forEach(function (s) {
      if (s.route && s.route.modus === "vlucht") return;
      s.punten.forEach(function (pt) {
        var match = allPlaces.filter(function (p) { return kmBetween(p.coord, pt.coord) < 0.25; })[0];
        add(match ? { place: match, coord: match.coord } : { point: pt, coord: pt.coord });
      });
      s.plekken.forEach(function (id) {
        var f = findPlace(id);
        if (f) add({ place: f.place, coord: f.place.coord });
      });
    });
    return stops;
  }

  function carLegList(option) {
    var legs = el("ol", "rg-carroute__legs");
    option.legs.forEach(function (leg) {
      var li = el("li");
      var b = el("button", "rg-carroute__leg rg-carroute__leg--" + leg.modus);
      b.type = "button";
      b.appendChild(el("span", "rg-carroute__swatch"));
      var t = el("span", "rg-carroute__legtext");
      t.appendChild(el("span", "rg-carroute__legname", leg.titel));
      var meta = [leg.afstand, leg.duur].filter(Boolean).join(" · ");
      if (meta) t.appendChild(el("span", "rg-carroute__legmeta", meta));
      b.appendChild(t);
      b.addEventListener("click", function () { fitCarCoords(leg.lijn); });
      li.appendChild(b);
      legs.appendChild(li);
    });
    return legs;
  }

  function carLines(options) {
    var features = [];
    options.forEach(function (o) {
      o.legs.forEach(function (l) {
        features.push({ type: "Feature", properties: { modus: l.modus }, geometry: { type: "LineString", coordinates: l.lijn } });
      });
    });
    return { type: "FeatureCollection", features: features };
  }

  /* Opening the airport or car rental of a route shows the route(s) through it: on the map and in the details. */
  function showPlaceRoutes(place) {
    var options = carRoutesVia(place);
    els.detailRoutes.textContent = "";
    els.detailRoutes.hidden = !options.length;
    var source = state.map && state.map.getSource("auto-route");
    if (source) source.setData(options.length ? carLines(options) : EMPTY);
    options.forEach(function (option) {
      var wrap = el("div", "rg-carroute");
      wrap.appendChild(el("h3", "rg-carroute__heading", "Route met de auto: " + option.journey.naam));
      wrap.appendChild(carLegList(option));
      var all = el("button", "rg-btn rg-btn--line rg-carroute__all", "Bekijk de hele route");
      all.type = "button";
      all.addEventListener("click", function () {
        var coords = [];
        option.legs.forEach(function (l) { coords = coords.concat(l.lijn); });
        fitCarCoords(coords);
      });
      wrap.appendChild(all);
      els.detailRoutes.appendChild(wrap);
    });
  }

  function clearPlaceRoutes() {
    if (state.carRoute) return;
    var source = state.map && state.map.getSource("auto-route");
    if (source) source.setData(EMPTY);
    els.detailRoutes.textContent = "";
    els.detailRoutes.hidden = true;
  }

  function buildCarRoutes() {
    els.carRoutes.textContent = "";
    var options = carRoutesFor(state.region);
    els.carRoutes.hidden = !options.length;
    options.forEach(function (option) {
      var wrap = el("div", "rg-carroute");
      var btn = el("button", "rg-carroute__btn");
      btn.type = "button";
      btn.setAttribute("aria-pressed", "false");
      var disc = el("span", "rg-carroute__art");
      disc.setAttribute("aria-hidden", "true");
      disc.appendChild(art("autoverhuur"));
      var text = el("span", "rg-carroute__text");
      text.appendChild(el("span", "rg-carroute__eyebrow", "Voorbeeldroute met de auto"));
      text.appendChild(el("span", "rg-carroute__name", option.journey.naam));
      var action = el("span", "rg-carroute__action", "Toon");
      btn.appendChild(disc);
      btn.appendChild(text);
      btn.appendChild(action);
      var legs = carLegList(option);
      legs.hidden = true;
      btn.addEventListener("click", function () {
        var on = btn.getAttribute("aria-pressed") !== "true";
        if (on) startCarRoute(option);
        else stopCarRoute(true);
      });
      option.btn = btn;
      option.action = action;
      option.legsEl = legs;
      wrap.appendChild(btn);
      wrap.appendChild(legs);
      els.carRoutes.appendChild(wrap);
    });
    state.carOptions = options;
  }

  function syncCarButtons(active) {
    (state.carOptions || []).forEach(function (o) {
      var on = o === active;
      o.btn.setAttribute("aria-pressed", String(on));
      o.action.textContent = on ? "Sluit" : "Toon";
      o.legsEl.hidden = !on;
    });
  }

  function fitCarCoords(coords) {
    var pad = padding(els.sheet);
    // Room for the pins (they stand above their spot) and the map credits.
    pad = { top: pad.top + 40, right: pad.right + 30, bottom: pad.bottom + 70, left: pad.left + 30 };
    setAttributionOffset(els.sheet);
    state.map.fitBounds(boundsOf(coords), { padding: pad, maxZoom: 12, duration: duration(1100), curve: 1.7, essential: false });
  }

  function startCarRoute(option) {
    var map = state.map;
    stopCarRoute(false);
    state.carRoute = { option: option, markers: [], pins: [] };
    syncCarButtons(option);
    clearPlaceMarkers();
    updateTracks();

    option.stops.forEach(function (st) {
      var entry;
      if (st.place) {
        entry = placeMarker(st.place, true);
      } else {
        var node = pointPin(st.point);
        entry = { marker: addMarker(node, "bottom", st.point.coord), el: node };
      }
      entry.el.classList.add("is-vast-label");
      state.carRoute.markers.push(entry);
      state.carRoute.pins.push({ entry: entry, coord: st.coord });
      reveal_(entry.el);
    });
    state.carRoute.markers.forEach(function (m, i) { m.el.style.setProperty("--rg-delay", i * 160 + "ms"); });
    thinCarPins();
    layoutLabels();

    var all = [];
    option.legs.forEach(function (l) { all = all.concat(l.lijn); });
    // The panel grows when the legs unfold: measure it after that, or the start hides under it.
    window.setTimeout(function () {
      if (state.carRoute && state.carRoute.option === option) fitCarCoords(all);
    }, 60);
    growCarRoute(option.legs);
  }

  function stopCarRoute(restore) {
    var cr = state.carRoute;
    if (!cr) return;
    state.carRoute = null;
    if (state.carAnim) { window.cancelAnimationFrame(state.carAnim); state.carAnim = null; }
    cr.markers.forEach(function (m) { m.marker.remove(); });
    var src = state.map && state.map.getSource("auto-route");
    if (src) src.setData(EMPTY);
    syncCarButtons(null);
    if (restore && state.mode === "regio") {
      regroup(true);
      updateTracks();
      fitRegion(false, false);
    }
    layoutLabels();
  }

  /* Stops that sit on top of each other at this zoom (airport and car
     rental are 2 km apart): only the later one keeps its pin. */
  function thinCarPins() {
    var cr = state.carRoute;
    if (!cr || !state.map) return;
    cr.pins.forEach(function (pin, i) {
      var a = state.map.project(pin.coord);
      var covered = cr.pins.slice(i + 1).some(function (other) {
        var b = state.map.project(other.coord);
        return Math.hypot(a.x - b.x, a.y - b.y) < 46;
      });
      pin.entry.el.classList.toggle("is-onder-route", covered);
    });
  }

  /* The route is travelled from the start: the dashed shuttle first, then
     the drive draws itself behind a moving dot. */
  function lineUpTo(path, t) {
    var d = Math.min(1, Math.max(0, t)) * path.total;
    var out = [path.coords[0]];
    for (var i = 1; i < path.coords.length && path.cum[i] <= d; i++) out.push(path.coords[i]);
    out.push(pointAlong(path, t));
    return out;
  }

  function growCarRoute(legs) {
    var map = state.map;
    var source = map.getSource("auto-route");
    var parts = legs.map(function (l) { return { modus: l.modus, path: measureLine(l.lijn), weight: l.modus === "auto" ? 1 : 0.2 }; });
    var sum = parts.reduce(function (a, p) { return a + p.weight; }, 0);
    function feature(part, coords) {
      return { type: "Feature", properties: { modus: part.modus }, geometry: { type: "LineString", coordinates: coords } };
    }
    function snapshot(p) {
      var at = p * sum, features = [], head = parts[0].path.coords[0];
      for (var i = 0; i < parts.length; i++) {
        var w = parts[i].weight;
        if (at >= w || i === parts.length - 1 && at >= w - 1e-9) {
          features.push(feature(parts[i], parts[i].path.coords));
          head = parts[i].path.coords[parts[i].path.coords.length - 1];
          at -= w;
        } else {
          var coords = lineUpTo(parts[i].path, at / w);
          features.push(feature(parts[i], coords));
          head = coords[coords.length - 1];
          break;
        }
      }
      return { fc: { type: "FeatureCollection", features: features }, head: head };
    }
    var ms = duration(2600);
    if (!ms) { source.setData(snapshot(1).fc); return; }
    var node = el("div", "rg-route-head");
    node.setAttribute("aria-hidden", "true");
    node.appendChild(el("span", "rg-route-head__dot"));
    var marker = addMarker(node, "center", parts[0].path.coords[0]);
    state.carRoute.markers.push({ marker: marker, el: node });
    var startAt = null;
    function frame(now) {
      if (!state.carRoute) return;
      if (startAt === null) startAt = now;
      var p = Math.min(1, (now - startAt) / ms);
      var eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      var snap = snapshot(eased);
      source.setData(snap.fc);
      marker.setLngLat(snap.head);
      if (p >= 1) node.classList.add("is-aangekomen");
      state.carAnim = p < 1 ? window.requestAnimationFrame(frame) : null;
    }
    state.carAnim = window.requestAnimationFrame(frame);
  }

  function sortedPlaces(places) {
    return places.slice().sort(function (a, b) {
      return KIND_ORDER.indexOf(kindOf(a)) - KIND_ORDER.indexOf(kindOf(b));
    });
  }

  function buildPlaceList() {
    els.placeList.textContent = "";
    var places = sortedPlaces(visiblePlaces());
    if (!places.length) {
      els.placeList.appendChild(el("li", "rg-places__empty", "Hier staan nog geen plekken."));
      return;
    }
    places.forEach(function (p, i) {
      var li = el("li", "rg-place rg-place--" + kindOf(p));
      li.style.setProperty("--i", i); // the cards come in one after another
      var btn = el("button", "rg-place__btn");
      btn.type = "button";
      var disc = el("span", "rg-place__art");
      disc.appendChild(art(artOf(p)));
      btn.appendChild(disc);
      var text = el("span");
      text.appendChild(el("span", "rg-place__kind", KINDS[kindOf(p)].label));
      text.appendChild(el("span", "rg-place__name", p.naam));
      btn.appendChild(text);
      btn.addEventListener("click", function () { rememberFlight(disc); navigate(placeHash(state.region.id, p)); });
      li.appendChild(btn);
      els.placeList.appendChild(li);
    });
  }

  /* Swept tracks and their markings (km posts, rescue access points, parking). */
  function updateTracks() {
    var features = [];
    clearMarks();
    (state.carRoute ? [] : visiblePlaces()).forEach(function (p) {
      p.banen.forEach(function (b) {
        features.push({
          type: "Feature",
          properties: {
            kleur: TRACK_COLORS[b.kleur] || TRACK_COLORS.blauw,
            naam: b.naam,
            lengte: b.lengte || "",
            plek: p.naam,
            // Only the main lines get a name on the map; side branches share it.
            // The map font draws a plain space along a line as a box; a
            // no-break space (U+00A0) renders as a normal gap.
            label: b.lengte ? (b.naam + " · " + b.lengte).replace(/ /g, "\u00a0") : ""
          },
          geometry: { type: "LineString", coordinates: b.lijn }
        });
      });
      p.markeringen.forEach(function (m) { state.marks.push(markMarker(m, p)); });
    });
    state.map.getSource("banen").setData({ type: "FeatureCollection", features: features });
  }

  /* A line that is drawn up to `progress` (0 to 1) of its length. */
  function trackGradient(color, progress) {
    var clear = color === "#ffffff" ? "rgba(255,255,255,0)" : "rgba(0,0,0,0)";
    return ["step", ["line-progress"], color, Math.min(1, Math.max(0.0001, progress)), clear];
  }

  /* lane: how far the pale swept lane is; line: the colour on top. */
  function setTrackProgress(lane, line) {
    var map = state.map;
    if (!map || !map.getLayer("banen-baan")) return;
    map.setPaintProperty("banen-baan", "line-gradient", trackGradient("#ffffff", lane));
    Object.keys(TRACK_COLORS).forEach(function (name) {
      map.setPaintProperty("banen-lijn-" + name, "line-gradient", trackGradient(TRACK_COLORS[name], line));
    });
  }

  /* Hide the tracks until the camera has arrived; never longer than a few
     seconds, so they can not stay hidden when the sweep does not come. */
  function holdTracks() {
    stopTrackAnim();
    setTrackProgress(0, 0);
    state.trackHold = window.setTimeout(function () { setTrackProgress(1, 1); }, 6000);
  }

  function stopTrackAnim() {
    window.clearTimeout(state.trackHold);
    if (state.trackAnim) window.cancelAnimationFrame(state.trackAnim);
    state.trackAnim = null;
  }

  /* The swept tracks sweep onto the ice: first the pale lane, the colour
     right behind it, all tracks at once from their own start. */
  function sweepTracks() {
    stopTrackAnim();
    var ms = duration(1700);
    if (!ms) { setTrackProgress(1, 1); return; }
    var startAt = null;
    function frame(now) {
      if (startAt === null) startAt = now;
      var p = Math.min(1, (now - startAt) / ms);
      var ease = function (t) { t = Math.min(1, Math.max(0, t)); return 1 - Math.pow(1 - t, 3); };
      setTrackProgress(ease(p * 1.18), ease(p * 1.18 - 0.18));
      state.trackAnim = p < 1 ? window.requestAnimationFrame(frame) : null;
    }
    state.trackAnim = window.requestAnimationFrame(frame);
  }

  function markMarker(m, place) {
    var soort = ["km", "hulpdiensten", "parkeren", "rustplek", "bestemming"].indexOf(m.soort) !== -1 ? m.soort : "overig";
    var btn = el("button", "rg-mark rg-mark--" + soort);
    btn.type = "button";
    btn.setAttribute("aria-label", m.naam + (m.info ? ". " + m.info : ""));
    // MapLibre sets an inline opacity on the marker element itself, so the
    // show/hide by zoom level runs on this inner wrapper.
    var inner = el("span", "rg-mark__inner");
    var dot = el("span", "rg-mark__dot");
    var num = /(\d+)\s*$/.exec(m.naam);
    var toilet = soort === "overig" && /toilet/i.test(m.naam);
    var warning = soort === "overig" && /waarschuwing/i.test(m.naam);
    if (toilet) btn.classList.add("rg-mark--wc");
    if (warning) btn.classList.add("rg-mark--let-op");
    if (soort === "overig" && /op- en afstap|opstapplek aan de wal/i.test(m.naam)) btn.classList.add("rg-mark--instap");
    dot.textContent = soort === "parkeren" ? "P" : soort === "km" || soort === "hulpdiensten" ? (num ? num[1] : "") : toilet ? "WC" : warning ? "!" : "";
    inner.appendChild(dot);
    // Only destinations carry their name on the map; the rest shows it on tap.
    if (soort === "bestemming" || (soort === "parkeren" && /op het ijs/i.test(m.naam)) || /kampvuur|picknick/i.test(m.naam)) {
      inner.appendChild(el("span", "rg-mark__label", m.naam));
    }
    btn.appendChild(inner);
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var box = el("div", "rg-popup");
      box.appendChild(el("strong", null, m.naam));
      if (m.info) box.appendChild(el("p", null, m.info));
      new maplibregl.Popup({ closeButton: true, offset: 14, maxWidth: "15rem", className: "rg-popup-wrap" })
        .setLngLat(m.coord).setDOMContent(box).addTo(state.map);
    });
    var marker = addMarker(btn, "center", m.coord);
    return { marker: marker, place: place };
  }

  function clearMarks() {
    state.marks.forEach(function (m) { m.marker.remove(); });
    state.marks = [];
  }

  /* Markers: places closer than GROUP_DISTANCE px merge into one group marker
     that zooms in when tapped. The selected place always stands alone. Small
     pins only merge with each other, so they never swallow a normal pin. */
  function regroup(reveal) {
    if (state.mode !== "regio" || !state.region || !state.map || state.carRoute) return;
    if (state.diving && !reveal && !Object.keys(state.markers).length) return; // they land when the camera arrives
    var map = state.map;
    var selected = state.place;
    var groups = [];
    // Zoomed in on the ice, pins that just touch are both tappable: no need to merge them.
    var groupGap = map.getZoom() >= CLOSE_ZOOM ? CLOSE_GROUP_DISTANCE : GROUP_DISTANCE;
    visiblePlaces().forEach(function (p) {
      var px = map.project(p.coord);
      if (selected && p.id === selected.id) { groups.push({ items: [p], px: px, solo: true }); return; }
      if (onlyClose(p) && !filteredClose() && map.getZoom() < KINDS[kindOf(p)].fromZoom) return;
      var small = isSmall(p);
      var gap = small ? SMALL_GROUP_DISTANCE : groupGap;
      for (var i = 0; i < groups.length; i++) {
        var g = groups[i];
        if (g.solo || g.small !== small) continue;
        if (Math.abs(g.px.x - px.x) < gap && Math.abs(g.px.y - px.y) < gap) {
          g.items.push(p);
          g.px = { x: (g.px.x * (g.items.length - 1) + px.x) / g.items.length, y: (g.px.y * (g.items.length - 1) + px.y) / g.items.length };
          return;
        }
      }
      groups.push({ items: [p], px: px, small: small });
    });

    var wanted = {};
    groups.forEach(function (g) {
      wanted[g.items.map(function (p) { return p.id; }).sort().join("|")] = g;
    });

    Object.keys(state.markers).forEach(function (key) {
      if (!wanted[key]) { state.markers[key].marker.remove(); delete state.markers[key]; }
    });

    /* On arrival the markers land in a wave that spreads out from the
       accommodation, and the swept tracks sweep onto the ice. */
    var home = visiblePlaces().filter(function (p) { return kindOf(p) === "verblijf"; })[0];
    var origin = home ? map.project(home.coord) : { x: els.map.clientWidth / 2, y: els.map.clientHeight / 2 };
    if (reveal) sweepTracks();

    Object.keys(wanted).forEach(function (key) {
      var g = wanted[key];
      var entry = state.markers[key];
      if (!entry) {
        entry = g.items.length === 1 ? placeMarker(g.items[0], true) : groupMarker(g.items);
        var wave = Math.min(450, Math.hypot(g.px.x - origin.x, g.px.y - origin.y) * 0.8);
        entry.el.style.setProperty("--rg-delay", (reveal ? Math.round(wave) : 0) + "ms");
        state.markers[key] = entry;
        reveal_(entry.el);
      }
      if (g.items.length > 1) entry.marker.setLngLat(groupCenter(g.items));
      entry.el.classList.toggle("is-actief", g.items.length === 1 && !!selected && g.items[0].id === selected.id);
      // A place right next to the selected one (accommodation by the ice entry) is nudged sideways
      // so it does not hide under it and stays tappable.
      var shift = [0, 0];
      if (selected && g.items.length === 1 && g.items[0].id !== selected.id) {
        var sel = map.project(selected.coord);
        var dx = g.px.x - sel.x;
        var apart = g.small && isSmall(selected) ? SMALL_GROUP_DISTANCE + 6 : PIN_APART;
        if (Math.abs(dx) < apart && Math.abs(g.px.y - sel.y) < GROUP_DISTANCE) {
          shift = [(dx < 0 ? -apart : apart) - dx, 0];
        }
      }
      entry.marker.setOffset(shift);
    });
    state.marks.forEach(function (m) {
      m.marker.getElement().classList.toggle("is-van-keuze", !!selected && m.place.id === selected.id);
    });
    layoutLabels();
    return true;
  }

  /* The map's own labels do not know where the markers (HTML on top of the
     map) are and would hide underneath. This gives the map an invisible box
     per marker and per bold town name (layer pin-vakken), so the other names
     move aside or step back, and places the bold town names first (see
     placeKeyTowns). The boxes hang on fixed spots, so they are only sent
     again when markers, names or offsets change. */
  function layoutLabels() {
    var map = state.map;
    var source = map && map.getSource("pin-vakken");
    if (!source) return;
    var pins = markerBoxes();
    var features = pins.concat(placeKeyTowns(pins)).map(function (b) {
      var width = Math.ceil(b.box[2] - b.box[0]);
      var height = Math.ceil(b.box[3] - b.box[1]);
      var image = "pin-vak-" + width + "x" + height;
      if (!map.hasImage(image)) map.addImage(image, { width: width, height: height, data: new Uint8Array(width * height * 4) });
      return {
        type: "Feature",
        properties: { vak: image, hoek: [Math.round(b.box[0]), Math.round(b.box[1])] },
        geometry: { type: "Point", coordinates: [b.at.lng, b.at.lat] }
      };
    });
    var key = JSON.stringify(features);
    if (key === state.pinBoxKey) return;
    state.pinBoxKey = key;
    source.setData({ type: "FeatureCollection", features: features });
  }

  /* Every marker as a box around the spot it hangs on, in px: the marker
     and its name when that shows, with its offset and a little room. */
  function markerBoxes() {
    var namesShow = els.map.classList.contains("toon-labels");
    var smallNamesShow = els.map.classList.contains("toon-labels-klein");
    var entries = Object.keys(state.markers).map(function (k) { return state.markers[k]; }).concat(state.stepMarkers);
    var out = [];
    entries.forEach(function (entry) {
      var node = entry.el;
      if (!node.classList.contains("rg-pin")) return;
      var active = node.classList.contains("is-actief");
      var label = node.querySelector(".rg-pin__label");
      var shown = node.classList.contains("rg-pin--klein") ? smallNamesShow : namesShow;
      var named = !!label && (shown || active || node.classList.contains("is-vast-label"));
      // Measured only when the marker changes, not on every frame of a move.
      if (entry.boxFor !== active + "|" + named) {
        var w = node.offsetWidth, h = node.offsetHeight;
        var b = [-w / 2, -h, w / 2, 0]; // left, top, right, bottom around the tip
        if (active) { b[0] -= w * 0.1; b[2] += w * 0.1; b[1] -= h * 0.2 + 4; } // lifted and scaled up
        if (named) {
          b[0] = Math.min(b[0], -label.offsetWidth / 2);
          b[2] = Math.max(b[2], label.offsetWidth / 2);
          b[3] = label.parentNode.offsetTop + label.offsetTop + label.offsetHeight - h;
        }
        entry.box = b;
        entry.boxFor = active + "|" + named;
      }
      var box = entry.box;
      var shift = entry.marker.getOffset();
      out.push({
        at: entry.marker.getLngLat(),
        box: [box[0] + shift.x - PIN_BOX_PAD, box[1] + shift.y - PIN_BOX_PAD, box[2] + shift.x + PIN_BOX_PAD, box[3] + shift.y + PIN_BOX_PAD]
      });
    });
    return out;
  }

  /* The bold names of the towns the guest's places lie at (Falun, Orsa,
     ...) are HTML on top of the markers, so a marker never hides them. A
     town under a marker gets its name just under that marker; any other
     town beside its dot, on the first side that is free of markers, dots
     and other names (right, left, below, above: a name right next to its
     dot reads as one), or else on the side that covers least. Returns
     their boxes. */
  function placeKeyTowns(pins) {
    var map = state.map;
    var out = [];
    var shown = (state.mode === "regio" || state.mode === "reis") && map.getZoom() >= KEY_TOWN_ZOOM;
    var width = els.map.clientWidth, height = els.map.clientHeight;
    var screen = function (at, box) {
      var p = map.project(at);
      return [p.x + box[0], p.y + box[1], p.x + box[2], p.y + box[3]];
    };
    var pinRects = pins.map(function (pin) { return screen(pin.at, pin.box); });
    /* What is already on the screen; covering another name or dot weighs
       much more than covering the edge of a marker (the names lie on top). */
    var taken = pinRects.map(function (r) { return { r: r, weight: 3 }; });
    // A name with its room around it against other names, without against markers and dots (their boxes have room already).
    var cost = function (box, room) {
      return taken.reduce(function (sum, o) {
        var r = o.name ? room : box;
        var x = Math.min(r[2], o.r[2]) - Math.max(r[0], o.r[0]);
        var y = Math.min(r[3], o.r[3]) - Math.max(r[1], o.r[1]);
        return x > 0 && y > 0 ? sum + x * y * o.weight : sum;
      }, 0);
    };

    var towns = state.keyTowns.map(function (t) {
      var p = map.project(t.at);
      var host = null, closest = Infinity;
      if (shown) {
        pins.forEach(function (pin, i) {
          var r = pinRects[i];
          if (p.x < r[0] || p.x > r[2] || p.y < r[1] || p.y > r[3]) return;
          var a = map.project(pin.at);
          var d = Math.hypot(a.x - p.x, a.y - p.y);
          if (d < closest) { closest = d; host = pin; }
        });
      }
      return { town: t, p: p, host: host };
    });
    // A dot that shows (not under a marker) is no place for another name.
    towns.forEach(function (c) {
      if (!c.host) taken.push({ r: [c.p.x - 5, c.p.y - 5, c.p.x + 5, c.p.y + 5], weight: 8 });
    });
    // Names under a marker have the least room, so they go first; then the bigger towns.
    towns.sort(function (a, b) { return (a.host ? 0 : 1) - (b.host ? 0 : 1) || a.town.rank - b.town.rank; });

    towns.forEach(function (c) {
      var t = c.town;
      var away = c.p.x < -80 || c.p.y < -80 || c.p.x > width + 80 || c.p.y > height + 80;
      t.el.classList.toggle("is-zichtbaar", shown && !away);
      if (!shown || away) return;
      if (!t.w) { t.w = t.label.offsetWidth; t.h = t.label.offsetHeight; }
      var w = t.w, h = t.h, d = KEY_TOWN_GAP;
      var options = [];
      if (c.host) {
        // Under the marker: in the middle, a little to either side, or a line lower.
        var hb = c.host.box, mid = (hb[0] + hb[2]) / 2;
        [0, -w / 3, w / 3].forEach(function (s) {
          options.push({ at: c.host.at, box: [mid + s - w / 2, hb[3], mid + s + w / 2, hb[3] + h] });
        });
        options.push({ at: c.host.at, box: [mid - w / 2, hb[3] + h, mid + w / 2, hb[3] + 2 * h] });
      }
      options.push(
        { at: t.at, box: [d, -h / 2, d + w, h / 2] },
        { at: t.at, box: [-d - w, -h / 2, -d, h / 2] },
        { at: t.at, box: [-w / 2, d, w / 2, d + h] },
        { at: t.at, box: [-w / 2, -d - h, w / 2, -d] }
      );
      // The first free side, or else the one that covers least (touching counts too).
      var pick = null, least = Infinity;
      options.forEach(function (o) {
        o.room = [o.box[0] - PIN_BOX_PAD, o.box[1] - PIN_BOX_PAD, o.box[2] + PIN_BOX_PAD, o.box[3] + PIN_BOX_PAD];
        var c = cost(screen(o.at, o.box), screen(o.at, o.room));
        if (c < least) { least = c; pick = o; }
      });
      if (t.anchor.lng !== pick.at.lng || t.anchor.lat !== pick.at.lat) { t.anchor = pick.at; t.marker.setLngLat(pick.at); }
      var spot = "translate(" + Math.round(pick.box[0]) + "px, " + Math.round(pick.box[1]) + "px)";
      if (t.spot !== spot) { t.spot = spot; t.label.style.transform = spot; }
      taken.push({ r: screen(pick.at, pick.room), weight: 20, name: true });
      out.push({ at: pick.at, box: pick.room });
    });
    return out;
  }

  function reveal_(node) {
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () { node.classList.add("is-zichtbaar"); });
    });
  }

  function groupCenter(items) {
    var lng = 0, lat = 0;
    items.forEach(function (p) { lng += p.coord[0]; lat += p.coord[1]; });
    return [lng / items.length, lat / items.length];
  }

  /* A ski area with a 3D view that is already open: tapping its icon again
     goes on to the 3D view (same as the "Bekijk het skigebied in 3D" button). */
  function placeHash(regionId, p) {
    var again = state.place === p && state.mode === "regio" && SKI_3D[p.id];
    return regionId + "/" + p.id + (again ? "/3d" : "");
  }

  function placeMarker(p, linkToPlace) {
    var kind = kindOf(p);
    var btn = el("button", "rg-pin rg-pin--" + kind + pinClass(p) + (isSmall(p) ? " rg-pin--klein" : ""));
    btn.type = "button";
    btn.setAttribute("aria-label", p.naam + ", " + KINDS[kind].label);
    var inner = el("span", "rg-pin__inner");
    var disc = el("span", "rg-pin__disc");
    disc.appendChild(art(artOf(p)));
    inner.appendChild(disc);
    inner.appendChild(el("span", "rg-pin__label", p.naam));
    btn.appendChild(inner);
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var found = findPlace(p.id);
      if (linkToPlace !== false && found) { rememberFlight(disc); navigate(placeHash(found.region.id, p)); }
    });
    var marker = addMarker(btn, "bottom", p.coord);
    return { marker: marker, el: btn };
  }

  /* Pixels between two spots at a zoom level (MapLibre's 512 px tiles). */
  function pixelGap(a, b, zoom) {
    var ma = maplibregl.MercatorCoordinate.fromLngLat(a);
    var mb = maplibregl.MercatorCoordinate.fromLngLat(b);
    var scale = 512 * Math.pow(2, zoom);
    return { x: Math.abs(ma.x - mb.x) * scale, y: Math.abs(ma.y - mb.y) * scale };
  }

  /* Spots that lie on top of each other even at the closest zoom cannot be
     told apart, so they are not worth zooming in for. */
  function coincide(a, b) {
    var gap = pixelGap(a, b, CLOSEST_ZOOM);
    return gap.x < 20 && gap.y < 20;
  }

  /* How far a tap on a group may zoom: close enough that places a few
     hundred metres apart (accommodation and ice entry) fall apart. */
  function groupMaxZoom(coords) {
    for (var i = 1; i < coords.length; i++) {
      if (!coincide(coords[0], coords[i])) return CLOSEST_ZOOM;
    }
    return 13;
  }

  /* The closest two spots of a group that can still be told apart, with the
     centre between them and the zoom from which they stand apart. */
  function tightestPair(coords, distance) {
    var best = null;
    for (var i = 0; i < coords.length; i++) {
      for (var j = i + 1; j < coords.length; j++) {
        if (coincide(coords[i], coords[j])) continue;
        var gap = pixelGap(coords[i], coords[j], 0);
        var span = Math.max(gap.x, gap.y);
        if (!best || span < best.span) best = { span: span, a: coords[i], b: coords[j] };
      }
    }
    if (!best) return null;
    // Smallest zoom at which the pair is far enough apart on screen (the grouping rule).
    var zoom = Math.min(CLOSEST_ZOOM, Math.ceil(Math.log((distance + 6) / best.span) / Math.LN2 * 4) / 4);
    return { zoom: zoom, center: [(best.a[0] + best.b[0]) / 2, (best.a[1] + best.b[1]) / 2] };
  }

  /* The zoom from which no other place of the map merges with this one. */
  function zoomApart(place, zoom) {
    var small = isSmall(place);
    var apart = (small ? SMALL_GROUP_DISTANCE : GROUP_DISTANCE) + 6;
    var others = visiblePlaces().filter(function (p) {
      return p.id !== place.id && isSmall(p) === small && !coincide(p.coord, place.coord);
    });
    for (var z = zoom; z < CLOSEST_ZOOM; z += 0.25) {
      var free = others.every(function (p) {
        var gap = pixelGap(place.coord, p.coord, z);
        return gap.x >= apart || gap.y >= apart;
      });
      if (free) return z;
    }
    return CLOSEST_ZOOM;
  }

  /* A tap on a group that would zoom in far in one go (from the province straight
     to accommodation and ice entry) stops halfway first, so the town (Falun) is in
     view and the guest can pick from there. Returns null when the jump is small. */
  function halfwayStop(target, pad) {
    var map = state.map;
    var from = map.getZoom();
    if (target.zoom - from < HALFWAY_MIN_JUMP) return null;
    var town = null;
    state.keyTowns.forEach(function (t) {
      var km = kmBetween(target.center, [t.at.lng, t.at.lat]);
      if (km <= KEY_TOWN_KM && (!town || km < town.km)) town = { km: km, at: t.at };
    });
    // No town to show, or it is already clearly in view: the guest can go straight on.
    if (!town || (from >= HALFWAY_TOWN_ZOOM && map.getBounds().contains(town.at))) return null;
    var zoom = from + (target.zoom - from) * 0.5;
    var center = target.center;
    // Both the town and the group stay on screen at that zoom.
    var both = map.cameraForBounds(boundsOf([center, [town.at.lng, town.at.lat]]), { padding: pad, maxZoom: zoom });
    if (both) { zoom = Math.min(zoom, both.zoom); center = [both.center.lng, both.center.lat]; }
    return zoom - from < 0.75 ? null : { zoom: zoom, center: center };
  }

  function groupMarker(items) {
    var small = isSmall(items[0]);
    var btn = el("button", "rg-pin rg-pin--groep" + (small ? " rg-pin--klein" : ""));
    btn.type = "button";
    btn.setAttribute("aria-label", items.length + " plekken: " + items.map(function (p) { return p.naam; }).join(", ") + ". Inzoomen");
    var stack = el("span", "rg-pin__stack");
    sortedPlaces(items).slice(0, small ? 1 : 3).forEach(function (p) {
      var disc = el("span", "rg-pin__disc");
      disc.appendChild(art(artOf(p)));
      stack.appendChild(disc);
    });
    var inner = el("span", "rg-pin__inner");
    inner.appendChild(stack);
    inner.appendChild(el("span", "rg-pin__count", String(items.length)));
    btn.appendChild(inner);
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var coords = items.map(function (p) { return p.coord; });
      var pad = padding(els.sheet);
      var maxZoom = groupMaxZoom(coords);
      var cam = state.map.cameraForBounds(boundsOf(coords), { padding: pad, maxZoom: maxZoom });
      var tight = tightestPair(coords, small ? SMALL_GROUP_DISTANCE : GROUP_DISTANCE);
      // Fitting everything splits the group: do that. A far-off member (Lugnet) would keep the
      // close pair (accommodation + ice entry) together, so then zoom in on that pair instead.
      var fitAll = !tight || (cam && cam.zoom >= tight.zoom);
      var target = fitAll ? (cam && { center: [cam.center.lng, cam.center.lat], zoom: cam.zoom }) : tight;
      var stop = target && halfwayStop(target, pad);
      if (stop) {
        // A big jump goes in two taps: first halfway, with the town in view, then on to the places.
        flyTo({ center: stop.center, zoom: stop.zoom, offset: offsetFor(pad), duration: duration(1050), essential: false });
      } else if (fitAll) {
        state.map.fitBounds(boundsOf(coords), { padding: pad, maxZoom: maxZoom, duration: duration(1050) });
      } else {
        flyTo({ center: tight.center, zoom: tight.zoom, offset: offsetFor(pad), duration: duration(1050), essential: false });
      }
    });
    var marker = addMarker(btn, "bottom", groupCenter(items));
    return { marker: marker, el: btn };
  }

  function clearPlaceMarkers() {
    Object.keys(state.markers).forEach(function (key) { state.markers[key].marker.remove(); });
    state.markers = {};
    layoutLabels();
  }

  /* Place details ----------------------------------------------------------- */
  function showPlace(place, flyFromFar) {
    stopCarRoute(false);
    state.place = place;
    updateBack();
    var kind = kindOf(place);
    els.sheet.classList.add("is-detail");
    setCollapsed(els.sheet, false);
    els.sheetList.hidden = true;
    els.detail.hidden = false;
    els.detail.scrollTop = 0;

    els.detailArt.textContent = "";
    els.detailArt.appendChild(art(artOf(place)));
    els.detailKind.textContent = KINDS[kind].label;
    setTitle(els.detailTitle, place.naam);

    /* Driving time from this customer's own accommodation (worked out per
       accommodation beforehand; no distances, Joey prefers time). */
    var time = travelTime(place);
    els.detailDistance.textContent = !time ? "" : time === "loopafstand" ? "Op loopafstand van je verblijf"
      : time.charAt(0).toUpperCase() + time.slice(1) + " rijden vanaf je verblijf";
    els.detailDistance.hidden = !time;

    renderPhotos(place.fotos);
    setText(els.detailInfo, place.info);

    els.detailTracks.textContent = "";
    var listed = {};
    place.banen.filter(function (b) {
      var seen = listed[b.naam];
      listed[b.naam] = true;
      return !seen;
    }).forEach(function (b) {
      var li = el("li");
      var swatch = el("span", "rg-tracks__swatch");
      swatch.style.background = TRACK_COLORS[b.kleur] || TRACK_COLORS.blauw;
      li.appendChild(swatch);
      li.appendChild(el("span", "rg-tracks__name", b.naam));
      if (b.lengte) li.appendChild(el("span", "rg-tracks__len", b.lengte));
      els.detailTracks.appendChild(li);
    });
    els.detailTracks.hidden = !place.banen.length;
    showPlaceRoutes(place);

    if (str(place.tip)) {
      els.detailTip.textContent = place.tip;
      els.detailTipWrap.hidden = false;
    } else {
      els.detailTipWrap.hidden = true;
    }

    els.detailFacts.textContent = "";
    addFact(els.detailFacts, "Reistijd", place.reistijd);
    addFact(els.detailFacts, "Adres", place.adres);
    addPhones(els.detailFacts, place.telefoon);

    var links = mapsLinks(place.coord, null, "auto");
    els.routeGoogle.href = links.google;
    els.routeApple.href = links.apple;
    els.routeApple.hidden = !isApple();

    if (typeof place.link === "string" && /^https:\/\//.test(place.link)) {
      els.detailLink.href = place.link;
      els.detailLink.textContent = "Website: " + place.link.replace(/^https:\/\/(www\.)?/, "").replace(/\/$/, "");
      els.detailLink.hidden = false;
    } else {
      els.detailLink.hidden = true;
    }

    // A ski area with a 3D view: the close-up button opens that instead.
    var in3d = !!SKI_3D[place.id];
    els.zoomBtn.textContent = in3d ? "Bekijk het skigebied in 3D" : "Bekijk van dichtbij";
    els.zoomBtn.classList.toggle("rg-btn--dark", in3d);
    els.zoomBtn.classList.toggle("rg-btn--line", !in3d);
    els.zoomBtn.style.flex = in3d ? "1 1 100%" : "";
    if (in3d) prefetchSki3D(place);

    regroup();
    flyInto(els.detailArt);
    window.requestAnimationFrame(function () {
      var pad = padding(els.sheet);
      setAttributionOffset(els.sheet);
      var ms = duration(1200);
      if (state.atlas.isShown()) {
        var coords0 = [place.coord];
        place.banen.forEach(function (b) { coords0 = coords0.concat(b.lijn); });
        diveFromAtlas(cameraFor(coords0, els.sheet, 14));
        return;
      }
      if (place.banen.length) {
        var coords = [place.coord];
        place.banen.forEach(function (b) { coords = coords.concat(b.lijn); });
        // The tracks clear and sweep onto the ice again once the camera is there.
        if (ms) holdTracks();
        state.map.fitBounds(boundsOf(coords), { padding: pad, maxZoom: 14, duration: ms, essential: false });
        if (ms) state.map.once("moveend", sweepTracks);
      } else {
        // An entry point without its own tracks: come close enough to see the markings around it.
        var minZoom = kind === "opstap" ? MARK_ZOOM + 1.5 : onlyClose(place) ? 14 : 11;
        // Close to another place (accommodation next to an ice entry): come close enough that both can be tapped.
        flyTo({ center: place.coord, zoom: zoomApart(place, Math.max(state.map.getZoom(), minZoom)), offset: offsetFor(pad), duration: ms, essential: false });
      }
    });
  }

  function setText(node, value) {
    if (typeof value === "string" && value) { node.textContent = value; node.hidden = false; }
    else { node.textContent = ""; node.hidden = true; }
  }

  /* Photos of a place: one, or a strip to swipe through with a dot per
     photo. All are site photos in /images/, in the sizes `bouw` found
     (the largest has no size in its name, as everywhere on the site). */
  var PHOTO_SIZES = "(min-width: 64rem) 23rem, 88vw";

  function photoFile(foto, i, format) {
    var last = foto.breedtes.length - 1;
    return "/images/" + foto.beeld + (i === last ? "" : "-" + foto.breedtes[i]) + "." + format;
  }

  function photoSrcset(foto, format) {
    return foto.breedtes.map(function (w, i) { return photoFile(foto, i, format) + " " + w + "w"; }).join(", ");
  }

  function renderPhotos(fotos) {
    var strip = els.detailPhotoStrip;
    strip.textContent = "";
    strip.scrollLeft = 0;
    fotos.forEach(function (foto) {
      var fig = el("figure", "rg-photo");
      var picture = document.createElement("picture");
      ["avif", "webp"].forEach(function (format) {
        var source = document.createElement("source");
        source.type = "image/" + format;
        source.sizes = PHOTO_SIZES;
        source.srcset = photoSrcset(foto, format);
        picture.appendChild(source);
      });
      var img = document.createElement("img");
      img.alt = foto.alt;
      img.draggable = false;
      img.decoding = "async";
      if (foto.focus) img.style.objectPosition = foto.focus;
      img.addEventListener("load", function () { fig.classList.add("is-geladen"); });
      // A photo that does not load is left out rather than shown broken.
      img.addEventListener("error", function () {
        if (fig.parentNode !== strip) return;
        strip.removeChild(fig);
        photoDots();
      });
      img.sizes = PHOTO_SIZES;
      img.srcset = photoSrcset(foto, "jpg");
      img.src = photoFile(foto, 0, "jpg");
      picture.appendChild(img);
      fig.appendChild(picture);
      // Not taken at this place: say so, so nobody expects exactly this view.
      if (foto.sfeerbeeld) fig.appendChild(el("figcaption", "rg-photo__label", "Sfeerbeeld"));
      strip.appendChild(fig);
    });
    photoDots();
  }

  function photoDots() {
    var strip = els.detailPhotoStrip, dots = els.detailPhotoDots;
    var n = strip.children.length;
    els.detailPhotos.hidden = !n;
    els.detailPhotos.classList.toggle("is-meer", n > 1);
    dots.textContent = "";
    dots.hidden = n < 2;
    if (n > 1) {
      strip.tabIndex = 0;
      strip.setAttribute("role", "group");
      strip.setAttribute("aria-label", n + " foto's, veeg of gebruik de pijltjestoetsen");
    } else {
      strip.removeAttribute("tabindex");
      strip.removeAttribute("role");
      strip.removeAttribute("aria-label");
      return;
    }
    for (var i = 0; i < n; i++) {
      var dot = el("button", "rg-photos__dot");
      dot.type = "button";
      dot.setAttribute("aria-label", "Foto " + (i + 1) + " van " + n);
      dot.addEventListener("click", showPhoto.bind(null, i));
      dots.appendChild(dot);
    }
    markPhotoDot();
  }

  function photoOffset(i) {
    var strip = els.detailPhotoStrip;
    return strip.children[i].offsetLeft - strip.children[0].offsetLeft;
  }

  function showPhoto(i) {
    els.detailPhotoStrip.scrollTo({ left: photoOffset(i), behavior: reduceMotion ? "auto" : "smooth" });
  }

  function markPhotoDot() {
    var strip = els.detailPhotoStrip;
    var n = strip.children.length, current = 0;
    for (var i = 1; i < n; i++) {
      if (Math.abs(photoOffset(i) - strip.scrollLeft) < Math.abs(photoOffset(current) - strip.scrollLeft)) current = i;
    }
    Array.prototype.forEach.call(els.detailPhotoDots.children, function (dot, k) {
      if (k === current) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
  }

  function addFact(list, label, value) {
    if (typeof value !== "string" || !value) return;
    var row = el("div");
    row.appendChild(el("dt", null, label));
    var dd = el("dd");
    setRich(dd, value);
    row.appendChild(dd);
    list.appendChild(row);
  }

  /* Phone numbers of a place (hospitals): each one a tap-to-call link. */
  function addPhones(list, phones) {
    if (!Array.isArray(phones)) return;
    var valid = phones.filter(function (t) {
      return t && typeof t.label === "string" && typeof t.nummer === "string" && /^(\+\d{1,3}[\d ]{5,16}\d|\d{3,6})$/.test(t.nummer);
    });
    if (!valid.length) return;
    var row = el("div");
    row.appendChild(el("dt", null, "Telefoon"));
    var dd = el("dd");
    var ul = el("ul", "rg-phones");
    valid.forEach(function (t) {
      var li = el("li");
      var a = el("a", "rg-phones__nr", t.nummer);
      a.href = "tel:" + t.nummer.replace(/ /g, "");
      li.appendChild(a);
      li.appendChild(el("span", "rg-phones__label", t.label));
      ul.appendChild(li);
    });
    dd.appendChild(ul);
    row.appendChild(dd);
    list.appendChild(row);
  }

  function travelTime(place) {
    if (kindOf(place) === "verblijf" || !state.region || !Array.isArray(place.reistijden)) return "";
    var stays = state.region.plekken.filter(function (p) { return kindOf(p) === "verblijf"; })
      .map(function (p) { return p.id; });
    var match = place.reistijden.filter(function (t) {
      return t && stays.indexOf(t.vanaf) !== -1 && typeof t.duur === "string";
    })[0];
    return match ? match.duur : "";
  }

  function hidePlace() {
    state.place = null;
    clearPlaceRoutes();
    setCollapsed(els.sheet, false);
    els.sheet.classList.remove("is-detail");
    els.detail.hidden = true;
    els.sheetList.hidden = false;
    regroup();
    updateBack(); // stays on the region's name until the camera is back out
  }

  /* ------------------------------------------------------------------------
     Journey: the trip step by step
     ------------------------------------------------------------------------ */
  function leaveJourney() {
    if (state.mode !== "reis") return;
    clearStep();
    state.journey = null;
    state.step = -1;
    els.journey.classList.remove("is-open");
    window.setTimeout(function () { if (state.mode !== "reis") els.journey.hidden = true; }, 650);
  }

  function clearStep() {
    state.stepMarkers.forEach(function (m) { m.marker.remove(); });
    state.stepMarkers = [];
    layoutLabels();
    if (state.routeAnim) { window.cancelAnimationFrame(state.routeAnim); state.routeAnim = null; }
    if (state.map && state.map.getSource("reis-route")) state.map.getSource("reis-route").setData(EMPTY);
  }

  function openJourney(journey, index) {
    var fromOverview = state.mode !== "reis";
    if (state.mode === "regio") leaveRegion();
    leaveOverview();
    state.mode = "reis";
    state.journey = journey;
    els.welcome.classList.add("is-weg");
    els.back.hidden = true;
    updateVeil();
    updateDecorVisibility();
    els.journeyName.textContent = journey.naam;
    els.journey.hidden = false;
    window.requestAnimationFrame(function () { els.journey.classList.add("is-open"); });
    showStep(Math.max(0, Math.min(index, journey.stappen.length - 1)), fromOverview);
  }

  function journeyCoords(journey) {
    var coords = [];
    journey.stappen.forEach(function (s) { coords = coords.concat(stepCoords(s)); });
    return coords;
  }

  function stepCoords(s) {
    var coords = [];
    if (s.route) coords = coords.concat(s.route.lijn);
    s.punten.forEach(function (p) { coords.push(p.coord); });
    s.plekken.forEach(function (id) { var f = findPlace(id); if (f) coords.push(f.place.coord); });
    return coords;
  }

  function showStep(index, fromOverview) {
    var journey = state.journey;
    var step = journey.stappen[index];
    var total = journey.stappen.length;
    els.stepBody.dataset.richting = index < state.step ? "terug" : "vooruit";
    state.step = index;
    clearStep();
    els.journey.classList.remove("is-ingeklapt");

    els.stepCount.textContent = "Stap " + (index + 1) + " van " + total;
    els.journeyDone.style.strokeDashoffset = String(100 - ((index + 1) / total) * 100);
    glidePuck((index + 1) / total);
    els.stepArt.textContent = "";
    els.stepArt.appendChild(art(STEP_ART[step.soort]));
    setTitle(els.stepTitle, step.titel);
    setRich(els.stepText, step.tekst);

    els.stepList.textContent = "";
    step.lijst.forEach(function (item) {
      var li = el("li");
      setRich(li, item);
      els.stepList.appendChild(li);
    });
    els.stepList.hidden = !step.lijst.length;
    $("stepListTitle").hidden = !(step.lijst.length && step.groepen.length);

    renderPackList(journey, step);

    if (step.tip) {
      setRich(els.stepTip, step.tip);
      els.stepTipWrap.classList.toggle("is-invullen", step.tip.indexOf(PLACEHOLDER) !== -1);
      els.stepTipWrap.hidden = false;
    } else {
      els.stepTipWrap.hidden = true;
    }

    els.stepFacts.textContent = "";
    if (step.route) addFact(els.stepFacts, "Reistijd (zonder pauzes)", step.route.duur);

    els.stepPlaces.textContent = "";
    step.plekken.forEach(function (id) {
      var f = findPlace(id);
      if (!f) return;
      var li = el("li");
      var btn = el("button", "rg-step-place");
      btn.type = "button";
      var disc = el("span", "rg-place__art");
      disc.appendChild(art(artOf(f.place)));
      btn.appendChild(disc);
      var text = el("span");
      text.appendChild(el("span", "rg-place__kind", KINDS[kindOf(f.place)].label));
      text.appendChild(el("span", "rg-place__name", f.place.naam));
      if (f.place.adres) text.appendChild(el("span", "rg-step-place__addr", f.place.adres));
      btn.appendChild(text);
      btn.addEventListener("click", function () { navigate(f.region.id + "/" + f.place.id); });
      li.appendChild(btn);
      els.stepPlaces.appendChild(li);
    });
    els.stepPlaces.hidden = !els.stepPlaces.children.length;

    if (step.navigatie) {
      var links = mapsLinks(step.navigatie.naar, isCoord(step.navigatie.van) ? step.navigatie.van : null, step.navigatie.modus);
      els.stepRouteGoogle.href = links.google;
      els.stepRouteApple.href = links.apple;
      els.stepRouteApple.hidden = !isApple();
      els.stepActions.hidden = false;
    } else {
      els.stepActions.hidden = true;
    }

    els.stepPrev.disabled = index === 0;
    var last = index === total - 1;
    var target = last ? journeyRegion(journey) : null;
    els.stepNext.textContent = last ? (target ? "Naar je plekken in " + target.naam : "Klaar") : "Volgende stap";
    els.stepBody.scrollTop = 0;
    // Each new step builds up again from the top.
    els.stepBody.classList.remove("is-nieuw");
    void els.stepBody.offsetWidth;
    els.stepBody.classList.add("is-nieuw");

    setCollapsed(els.journey, false);
    drawStep(step, fromOverview);
  }

  function journeyRegion(journey) {
    var region = null;
    journey.stappen.forEach(function (s) {
      s.plekken.forEach(function (id) { var f = findPlace(id); if (f && !region) region = f.region; });
    });
    return region || state.guide.regios[0] || null;
  }

  function renderPackList(journey, step) {
    els.stepPack.textContent = "";
    if (!step.groepen.length) { els.stepPack.hidden = true; return; }
    els.stepPack.hidden = false;
    var key = PACK_KEY + ":" + journey.id + ":" + step.id;
    var checked = {};
    try { checked = JSON.parse(readStored(key) || "{}") || {}; } catch (e) { checked = {}; }

    step.groepen.forEach(function (g, gi) {
      var details = el("details", "rg-pack__group");
      if (gi === 0) details.open = true;
      var summary = el("summary");
      summary.appendChild(el("span", "rg-pack__title", g.titel));
      var count = el("span", "rg-pack__count");
      summary.appendChild(count);
      details.appendChild(summary);
      var ul = el("ul");
      function updateCount() {
        var n = 0;
        g.items.forEach(function (item, ii) { if (checked[gi + "-" + ii]) n += 1; });
        count.textContent = n + " van " + g.items.length;
        details.classList.toggle("is-klaar", n === g.items.length && n > 0);
      }
      g.items.forEach(function (item, ii) {
        var li = el("li");
        var label = el("label", "rg-pack__item");
        var box = el("input");
        box.type = "checkbox";
        box.checked = !!checked[gi + "-" + ii];
        box.addEventListener("change", function () {
          if (box.checked) checked[gi + "-" + ii] = true; else delete checked[gi + "-" + ii];
          writeStored(key, JSON.stringify(checked));
          updateCount();
        });
        label.appendChild(box);
        label.appendChild(el("span", null, item));
        li.appendChild(label);
        ul.appendChild(li);
      });
      details.appendChild(ul);
      updateCount();
      els.stepPack.appendChild(details);
    });
  }

  /* A pin for a point of a journey step (airport, bus stop) that is not a place of its own. */
  function pointPin(p) {
    var btn = el("div", "rg-pin rg-pin--punt");
    btn.setAttribute("role", "img");
    btn.setAttribute("aria-label", p.naam);
    var inner = el("span", "rg-pin__inner");
    var disc = el("span", "rg-pin__disc");
    disc.appendChild(art(POINT_ART[p.soort] || "sneeuwvlok"));
    inner.appendChild(disc);
    inner.appendChild(el("span", "rg-pin__label", p.naam));
    btn.appendChild(inner);
    btn.classList.add("is-vast-label");
    return btn;
  }

  function drawStep(step, fromOverview) {
    var map = state.map;

    step.punten.forEach(function (p) {
      var btn = pointPin(p);
      var marker = addMarker(btn, "bottom", p.coord);
      state.stepMarkers.push({ marker: marker, el: btn });
      reveal_(btn);
    });
    step.plekken.forEach(function (id) {
      var f = findPlace(id);
      if (!f) return;
      var entry = placeMarker(f.place, true);
      entry.el.classList.add("is-vast-label");
      state.stepMarkers.push(entry);
      reveal_(entry.el);
    });

    state.stepMarkers.forEach(function (m, i) { m.el.style.setProperty("--rg-delay", i * 140 + "ms"); });
    layoutLabels();

    if (step.route) {
      map.getSource("reis-route").setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: step.route.lijn } });
      var dash = ROUTE_DASH[step.route.modus];
      map.setLayoutProperty("reis-stippel", "visibility", dash ? "visible" : "none");
      map.setLayoutProperty("reis-lijn", "visibility", dash ? "none" : "visible");
      if (dash) map.setPaintProperty("reis-stippel", "line-dasharray", dash);
      animateRoute(step.route.lijn, !dash);
    }

    var coords = stepCoords(step);
    if (!coords.length) coords = journeyCoords(state.journey); // e.g. the packing list: show the whole trip
    window.requestAnimationFrame(function () {
      var pad = padding(els.journey);
      setAttributionOffset(els.journey);
      var ms = duration(1400);
      if (!coords.length) { if (state.atlas.isShown()) diveFromAtlas(null); return; }
      if (state.atlas.isShown() && diveFromAtlas(cameraFor(coords, els.journey, 13))) return;
      if (coords.length === 1) {
        flyTo({ center: coords[0], zoom: 12, offset: offsetFor(pad), duration: ms, essential: false });
      } else {
        map.fitBounds(boundsOf(coords), { padding: pad, maxZoom: 13, duration: ms, essential: false });
      }
    });
  }

  /* The route is travelled from start to end: a dot moves along it (it
     shows the direction) and a solid route draws itself behind the dot.
     Lengths are measured in Web Mercator, as the map measures line-progress,
     so the dot and the drawn line stay together. */
  function animateRoute(coords, grow) {
    var map = state.map;
    var ms = duration(2100);
    var path = measureLine(coords);
    var head = el("div", "rg-route-head");
    head.setAttribute("aria-hidden", "true");
    head.appendChild(el("span", "rg-route-head__dot"));
    var marker = addMarker(head, "center", coords[0]);
    state.stepMarkers.push({ marker: marker, el: head });
    var startAt = null;
    function frame(now) {
      if (startAt === null) startAt = now;
      var p = ms ? Math.min(1, (now - startAt) / ms) : 1;
      var eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      if (grow) {
        map.setPaintProperty("reis-lijn", "line-gradient",
          ["step", ["line-progress"], ROUTE_COLOR, Math.max(0.0001, eased), "rgba(0,0,0,0)"]);
      }
      marker.setLngLat(pointAlong(path, eased));
      if (p >= 1) head.classList.add("is-aangekomen");
      state.routeAnim = p < 1 ? window.requestAnimationFrame(frame) : null;
    }
    if (state.routeAnim) window.cancelAnimationFrame(state.routeAnim);
    state.routeAnim = window.requestAnimationFrame(frame);
  }

  function measureLine(coords) {
    var merc = coords.map(function (c) {
      return [c[0] * Math.PI / 180, Math.log(Math.tan(Math.PI / 4 + c[1] * Math.PI / 360))];
    });
    var cum = [0];
    for (var i = 1; i < merc.length; i++) {
      cum.push(cum[i - 1] + Math.hypot(merc[i][0] - merc[i - 1][0], merc[i][1] - merc[i - 1][1]));
    }
    return { coords: coords, cum: cum, total: cum[cum.length - 1] };
  }

  function pointAlong(path, t) {
    var c = path.coords;
    if (c.length < 2 || !path.total) return c[0];
    var d = Math.min(1, Math.max(0, t)) * path.total;
    var i = 0;
    while (i < c.length - 2 && path.cum[i + 1] < d) i++;
    var seg = path.cum[i + 1] - path.cum[i];
    var f = seg ? (d - path.cum[i]) / seg : 0;
    return [c[i][0] + (c[i + 1][0] - c[i][0]) * f, c[i][1] + (c[i + 1][1] - c[i][1]) * f];
  }

  els.stepPrev.addEventListener("click", function () {
    if (state.journey && state.step > 0) navigate("reis/" + state.journey.id + "/" + state.step);
  });
  els.stepNext.addEventListener("click", function () {
    if (!state.journey) return;
    if (state.step < state.journey.stappen.length - 1) {
      navigate("reis/" + state.journey.id + "/" + (state.step + 2));
    } else {
      var region = journeyRegion(state.journey);
      navigate(region ? region.id : "");
    }
  });
  els.journeyClose.addEventListener("click", function () { navigate(""); });

  /* ------------------------------------------------------------------------
     A ski area in 3D (js/skigebied3d.js, with its own stylesheet; both
     loaded the first time). The live map tilts towards the mountain while
     the view loads, then the 3D view takes over from exactly that camera.
     Closing sinks the mountain back into the map, which then levels out.
     ------------------------------------------------------------------------ */
  function loadSki3D() {
    if (!state.ski3dModule) {
      if (!document.querySelector("link[data-skigebied3d]")) {
        var css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = "/reisgids/skigebied3d.css?v=" + SKI_3D_VERSION;
        css.setAttribute("data-skigebied3d", "");
        document.head.appendChild(css);
      }
      state.ski3dModule = import("/reisgids/js/skigebied3d.js?v=" + SKI_3D_VERSION);
      state.ski3dModule.catch(function () { state.ski3dModule = null; });
    }
    return state.ski3dModule;
  }

  // While the guest reads the place, fetch the 3D code and data already, so
  // opening the view does not have to wait for them (not on data saver).
  function prefetchSki3D(place) {
    var ski = SKI_3D[place.id];
    var link = navigator.connection;
    if (!ski || (link && link.saveData)) return;
    loadSki3D().then(function (m) {
      return m.preload(ski.scene, SKI_3D_VERSION).then(function () {
        // On the satellite map also the picture for its ground.
        if (state.satellite && m.preloadSkin) return m.preloadSkin(ski.scene, satelliteFor3D(), SKI_3D_VERSION);
      });
    }).catch(function () {});
  }

  function zoomedInOnSkiArea() {
    var map = state.map;
    if (state.mode !== "regio" || !state.region || state.diving || state.ski3d || map.getZoom() < SKI_3D_ZOOM) return;
    // Somewhere over the slopes or the valley station (within 2 km of the middle).
    var here = map.getCenter();
    var hit = null;
    state.region.plekken.forEach(function (p) {
      if (hit || !SKI_3D[p.id]) return;
      if (here.distanceTo(maplibregl.LngLat.convert(SKI_3D[p.id].center)) < 2000) hit = p;
    });
    if (hit) navigate(state.region.id + "/" + hit.id + "/3d");
  }

  function openSki3D(place) {
    var ski = SKI_3D[place.id];
    if (state.ski3d && state.ski3d.place === place) return;
    var token = ++state.ski3dToken;
    var map = state.map;
    state.ski3d = { place: place, view: null };
    state.diving = true;

    var note = el("p", "rg3d-laden", "Skigebied in 3D laden");
    note.setAttribute("role", "status");
    var noteTimer = window.setTimeout(function () { document.body.appendChild(note); }, 400);

    /* One movement, no waiting: the 3D view is built straight away (still
       invisible, so the work is done before anything moves). Then the map flies
       the first part of the view's way in (view.mapPose) and, once close enough
       that the 3D surroundings fill the view (HANDOVER_ZOOM), the 3D view takes
       over on the same curve: speed and direction run on without a jolt, while
       the mountain, forest and pistes come up. */
    var HANDOVER_ZOOM = 12.3;
    var pose = function () {
      var c = map.getCenter();
      return { center: [c.lng, c.lat], zoom: map.getZoom(), pitch: map.getPitch(), bearing: map.getBearing(), height: els.map.clientHeight };
    };
    var ready = loadSki3D().then(function (m) {
      return m.preload(ski.scene, SKI_3D_VERSION).then(function () { return m; });
    }).then(function (m) {
      // One frame first, so the tap shows (the button springs back) before the build.
      return new Promise(function (resolve) {
        window.requestAnimationFrame(function () { window.setTimeout(function () { resolve(m); }, 0); });
      });
    });
    var built = ready.then(function (m) {
      if (token !== state.ski3dToken) return null;
      var rink = ski.ijsbanen ? findPlace(ski.ijsbanen) : null;
      return m.open({
        scene: ski.scene,
        version: SKI_3D_VERSION,
        title: place.naam,
        ijsbanen: rink ? rink.place.banen.map(function (b) { return { naam: b.naam, lijn: b.lijn }; }) : [],
        satelliet: state.satellite ? satelliteFor3D() : null,
        onSatellite: function () { setSatellite(!state.satellite); },
        hold: true,
        from: pose(),
        onClose: function () {
          if (location.hash.split("/")[2] === "3d") history.back();
          else route(false);
        }
      }).then(function (view) {
        if (token !== state.ski3dToken) { view.close(); return null; }
        state.ski3d.view = view;
        return view;
      });
    });
    built.then(function () { window.clearTimeout(noteTimer); }, function () {});

    built.then(function (view) {
      if (!view || token !== state.ski3dToken) return;
      if (reduceMotion) {
        view.begin();
        window.setTimeout(function () { if (token === state.ski3dToken) sleepMap(true); }, 400);
        return;
      }
      // The map follows the curve under the fade-in too, then stays put (no work
      // for it during the rest of the intro): the way back out sinks the mountain
      // to there.
      // A low window ends the way in further out: then take over a little before its end.
      var handAt = Math.min(HANDOVER_ZOOM, view.mapPose(Infinity).zoom - 0.4);
      var set = 0, handed = 0;
      window.requestAnimationFrame(function step(now) {
        if (token !== state.ski3dToken) return;
        // The first frame's time can be from before the view was built: count from now.
        if (!set) set = Math.max(now, performance.now() - 8);
        var at = view.mapPose((now - set) / 1000);
        map.jumpTo(at);
        if (!handed && at.zoom >= handAt) { handed = now; view.begin(set); }
        if (handed && now - handed > 350) { view.returnTo(pose()); sleepMap(true); return; }
        window.requestAnimationFrame(step);
      });
    }).catch(function () {
      if (token !== state.ski3dToken) return;
      // No 3D on this device (or the data did not load): stay on the map.
      sleepMap(false);
      state.ski3d = null;
      state.diving = false;
      history.replaceState(null, "", location.pathname + location.search + "#" + state.region.id + "/" + place.id);
      levelOut();
      note.textContent = "De 3D-weergave werkt niet op dit toestel. Je ziet het skigebied op de kaart.";
      document.body.appendChild(note);
      window.setTimeout(function () { note.remove(); }, 4500);
      return "melding";
    }).then(function (shown) {
      window.clearTimeout(noteTimer);
      if (shown !== "melding") note.remove();
    });
  }

  /* While the 3D view covers the map, the map need not draw: tiles still coming
     in after the zoom would otherwise keep it drawing, unseen, and take that
     time from the 3D view. Waking up draws it as it is by then. */
  function sleepMap(on) {
    var map = state.map;
    if (on && !state.mapAsleep) {
      state.mapAsleep = true;
      map.triggerRepaint = function () {};
    } else if (!on && state.mapAsleep) {
      state.mapAsleep = false;
      delete map.triggerRepaint;
      map.triggerRepaint();
    }
  }

  function closeSki3D(done) {
    sleepMap(false);
    var open = state.ski3d;
    var token = ++state.ski3dToken;
    state.ski3d = null;
    state.ski3dLeft = open ? open.place : null;
    var finish = function () {
      if (token !== state.ski3dToken) return;
      state.diving = false;
      done();
    };
    if (open && open.view) open.view.close().then(finish);
    else finish();
  }

  /* ------------------------------------------------------------------------
     Navigation: #region, #region/place and #reis/journey/step, so the
     phone's back button works.
     ------------------------------------------------------------------------ */
  function navigate(hash) {
    var url = location.pathname + location.search + (hash ? "#" + hash : "");
    history.pushState(null, "", url);
    if (state.mapReady) route(false); // otherwise the map's load event routes
    else initMap();

  }

  function route(firstLoad) {
    var parts = location.hash.replace(/^#/, "").split("/");

    /* #region/place/3d: the ski area in 3D. Leaving it, the mountain first
       sinks back into the map; then the rest of the route follows. */
    var want3d = parts[2] === "3d";
    if (state.ski3d && !(want3d && state.ski3d.place.id === parts[1])) {
      closeSki3D(function () { route(false); });
      return;
    }
    if (want3d && (firstLoad === true || state.atlas.isShown())) {
      // Not straight from the start or the drawn map: begin at the place itself.
      history.replaceState(null, "", location.pathname + location.search + "#" + parts[0] + "/" + parts[1]);
      want3d = false;
    }

    if (parts[0] === "reis") {
      var journey = null;
      state.guide.reisverlopen.forEach(function (j) { if (j.id === parts[1]) journey = j; });
      if (journey) {
        var n = parseInt(parts[2], 10);
        openJourney(journey, isFinite(n) ? n - 1 : 0);
        if (firstLoad !== true) focusQuietly(els.stepTitle);
        return;
      }
    }

    var region = findRegion(parts[0]);
    if (!region) {
      if (state.place) hidePlace();
      showOverview(firstLoad === true);
      return;
    }

    var place = null;
    if (parts[1]) region.plekken.forEach(function (p) { if (p.id === parts[1]) place = p; });

    var fromElsewhere = state.mode !== "regio" || state.region !== region;
    openRegion(region, !place);
    if (place && want3d && SKI_3D[place.id]) {
      if (state.place !== place) showPlace(place, fromElsewhere);
      openSki3D(place);
    } else if (place && state.ski3dLeft === place && state.place === place) {
      // Back from the 3D view: out to where the whole ski area shows, flat again.
      state.ski3dLeft = null;
      flyTo({ center: place.coord, zoom: SKI_3D_ZOOM - 1.4, pitch: 0, bearing: 0, offset: offsetFor(padding(els.sheet)), duration: duration(1050), essential: false });
      focusQuietly(els.detailTitle);
    } else if (place) {
      state.ski3dLeft = null;
      showPlace(place, fromElsewhere);
      focusQuietly(els.detailTitle);
    } else {
      if (state.place) {
        hidePlace();
        fitRegion(false, false);
      }
      if (fromElsewhere && firstLoad !== true) focusQuietly(els.sheetTitle);
    }
  }

  function focusQuietly(node) {
    node.setAttribute("tabindex", "-1");
    try { node.focus({ preventScroll: true }); } catch (e) { node.focus(); }
  }

  /* ------------------------------------------------------------------------
     Buttons, menu, install
     ------------------------------------------------------------------------ */
  /* One level up: from a place (or closer in) to the whole region, from
     there to the country. */
  els.back.addEventListener("click", function () {
    if (!closeToRegion()) navigate("");
    else if (state.place) navigate(state.region.id);
    else fitRegion(false, false);
  });
  attachDrag(els.sheet, els.sheetToggle);
  attachDrag(els.journey, els.journeyToggle);
  // Desktop: a soft light follows the pointer over the place tiles.
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    els.placeList.addEventListener("pointermove", function (e) {
      var tile = e.target.closest(".rg-place__btn");
      if (!tile) return;
      var r = tile.getBoundingClientRect();
      tile.style.setProperty("--mx", (e.clientX - r.left).toFixed(0) + "px");
      tile.style.setProperty("--my", (e.clientY - r.top).toFixed(0) + "px");
    });
    els.placeList.addEventListener("pointerout", function (e) {
      var tile = e.target.closest(".rg-place__btn");
      if (tile && !tile.contains(e.relatedTarget)) { tile.style.removeProperty("--mx"); tile.style.removeProperty("--my"); }
    });
  }
  els.sheetToggle.addEventListener("click", function () {
    setCollapsed(els.sheet, !els.sheet.classList.contains("is-ingeklapt"));
  });
  els.journeyToggle.addEventListener("click", function () {
    setCollapsed(els.journey, !els.journey.classList.contains("is-ingeklapt"));
  });
  els.detailClose.addEventListener("click", function () { navigate(state.region ? state.region.id : ""); });
  $("layerBtn").addEventListener("click", function () { setSatellite(!state.satellite); });
  syncLayerButton();
  var photoFrame = 0;
  els.detailPhotoStrip.addEventListener("scroll", function () {
    if (photoFrame) return;
    photoFrame = window.requestAnimationFrame(function () { photoFrame = 0; markPhotoDot(); });
  }, { passive: true });
  els.zoomBtn.addEventListener("click", function () {
    if (!state.place) return;
    if (SKI_3D[state.place.id] && state.region) { navigate(state.region.id + "/" + state.place.id + "/3d"); return; }
    flyTo({ center: state.place.coord, zoom: 15, offset: offsetFor(padding(els.sheet)), duration: duration(1250) });
  });

  function openMenu() {
    els.menu.hidden = false;
    els.menuBtn.setAttribute("aria-expanded", "true");
    els.menuClose.focus();
  }
  function closeMenu() {
    els.menu.hidden = true;
    els.menuBtn.setAttribute("aria-expanded", "false");
    els.menuBtn.focus();
  }
  els.menuBtn.addEventListener("click", openMenu);
  els.menuClose.addEventListener("click", closeMenu);
  els.menu.addEventListener("click", function (e) { if (e.target === els.menu) closeMenu(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !els.menu.hidden) closeMenu();
  });

  els.logout.addEventListener("click", function () {
    writeStored(STORE_KEY, null);
    location.replace(location.pathname);
  });

  function setupInstall() {
    var standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
    if (standalone) return;
    els.installBlock.hidden = false;
    if (/iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) {
      els.installText.textContent = "Tik in Safari op het deel-icoon (vierkantje met pijl) en kies 'Zet op beginscherm'. Dan open je de reisgids voortaan als app.";
    } else {
      els.installText.textContent = "Kies in het menu van je browser 'Toevoegen aan startscherm' of 'App installeren'. Dan open je de reisgids voortaan als app.";
    }
  }

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    state.installPrompt = e;
    els.installBtn.hidden = false;
  });
  els.installBtn.addEventListener("click", function () {
    if (!state.installPrompt) return;
    state.installPrompt.prompt();
    state.installPrompt = null;
    els.installBtn.hidden = true;
  });

  /* ------------------------------------------------------------------------
     Privacy: hide the guide while the app is in the background (app switcher
     previews), and no right-click menu on the guide.
     ------------------------------------------------------------------------ */
  function shield(on) { els.app.classList.toggle("is-verborgen", on); }
  document.addEventListener("visibilitychange", function () { shield(document.hidden); });
  window.addEventListener("pagehide", function () { shield(true); });
  window.addEventListener("pageshow", function () { shield(false); });
  els.app.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  els.app.addEventListener("dragstart", function (e) { e.preventDefault(); });

  /* ------------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------------ */
  els.codeForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var code = extractCode(els.codeInput.value);
    if (!code) {
      gate("fout", "Dit lijkt geen geldige code. Plak de hele link uit je bevestiging.", { form: true, help: true });
      return;
    }
    openGuide(code);
  });

  if (typeof window.maplibregl === "undefined") {
    gate("fout", "De kaart kon niet worden geladen. Ververs de pagina.", { help: true });
    return;
  }

  startSnow();
  var initial = extractCode(location.search) || extractCode(readStored(STORE_KEY));
  if (initial) openGuide(initial);
  else gate("code", "Open de persoonlijke link uit je bevestiging, of plak hem hieronder.", { form: true, help: true });
})();

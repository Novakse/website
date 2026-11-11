/* ==========================================================================
   Novakse reisgids: a ski area in 3D (2026-10-30, first: Romme Alpin).

   Loaded on demand by reisgids.js (dynamic import) when a guest opens the
   ski area or zooms in on it. The live map tilts towards the mountain, this
   view fades in over it and the mountain rises out of the flat map: the
   forest grows in a wave, the pistes sweep down in their colours, the lifts
   appear and the chairs start to run. Then the camera circles slowly; guests
   turn, tilt and zoom themselves (the circling stops while they do).

   Data in vormen/<scene>/ (built beforehand, sources in <scene>.json _bron):
     hoogte.webp           heights of the ski area, terrarium RGB, 10 m grid
     omgeving.webp         heights of the surroundings (32 km), 125 m grid
     masker.webp           ski area surface: R forest, G groomed piste, B road/built
     omgeving-masker.webp  surroundings: R forest, G water, B built
     <scene>.json          pistes, lifts, pylons, buildings, peaks (local metres)
   Local metres: x east, y north of the scene origin. In the 3D world
   X = x, Z = -y and Y = (height - lowest point) x the exaggeration.
   ========================================================================== */
import * as THREE from "../vendor/three.module.min.js";
import { OrbitControls } from "../vendor/OrbitControls.js";

const SCENES = {
  romme: {
    dir: "/reisgids/vormen/romme/",
    json: "romme.json",
    /* The view of the official piste map: from the valley (Romme Dal)
       towards Snöberget, looking east-south-east. */
    view: { target: [-120, 20], bearing: 115, polar: 72, dist: 3900, lift: 110 },
    dense: [40, -120],                  // the forest is fullest around here (local metres)
    wave: [-1050, 640]                  // the trees grow from the valley station outwards
  },
  gronklitt: {
    dir: "/reisgids/vormen/gronklitt/",
    json: "gronklitt.json",
    /* Wide screens from the west-south-west: the Gästcenter and the village
       in front on the right, the top of Grönklitt in the middle, the north
       side on the left. */
    view: { target: [-150, 0], bearing: 65, polar: 69, dist: 2800, lift: 80 },
    // On an upright phone: along the ridge from the south, so both sides fit.
    portrait: { target: [-260, -230], bearing: 12, polar: 70, dist: 2450, lift: 70 },
    exag: 2.4,                          // a lower mountain (165 m): a little more height
    /* Orsasjön, 9.5 to 21 km south: the lake where the guests skate. The
       whole lake is in the surroundings; the label sits in the middle of it. */
    lake: { naam: "Orsasjön", at: [320, -15400] },
    dense: [0, -100],
    wave: [-590, -1110]                 // from the Gästcenter
  },
  /* The ski areas around Sälen (2026-11-01). Their slopes come down from
     the high fell, so the camera stands in the valley and looks up. */
  tandadalen: {
    dir: "/reisgids/vormen/tandadalen/",
    json: "tandadalen.json",
    // From the north, over the village: the west slopes on the left, the east slopes on the right, Hundfjället behind.
    view: { target: [-250, -600], bearing: 180, polar: 66, dist: 5600, lift: 120 },
    // On an upright phone: from the north-east along the fell, so both groups of slopes fit.
    portrait: { target: [-550, -450], bearing: 235, polar: 64, dist: 5800, lift: 100 },
    exag: 1.6,                          // a high fell (370 m from the valley): less extra height
    dense: [-200, 300],
    wave: [-215, 356]                   // from the village of Tandådalen
  },
  lindvallen: {
    dir: "/reisgids/vormen/lindvallen/",
    json: "lindvallen.json",
    // From Lindvallen in the north-east up the long slopes of Sälfjället; Högfjället further west on the right.
    view: { target: [520, -80], bearing: 235, polar: 66, dist: 5200, lift: 120 },
    portrait: { target: [820, -130], bearing: 215, polar: 64, dist: 4600, lift: 100 },
    exag: 1.6,
    dense: [420, 420],
    wave: [1700, 520]                   // from the village of Lindvallen
  },
  stoten: {
    dir: "/reisgids/vormen/stoten/",
    json: "stoten.json",
    // From the village in the north-east up to Granfjällsstöten.
    view: { target: [0, -500], bearing: 215, polar: 67, dist: 3900, lift: 100 },
    portrait: { target: [0, -500], bearing: 215, polar: 66, dist: 4000, lift: 90 },
    exag: 1.6,
    dense: [200, 0],
    wave: [134, 0]                      // from the village of Stöten
  },
  klappen: {
    dir: "/reisgids/vormen/klappen/",
    json: "klappen.json",
    // From the valley in the west towards the top of Kläppen.
    view: { target: [250, -100], bearing: 80, polar: 68, dist: 3200, lift: 90 },
    // On an upright phone: the same side, a little further back and more from the north-west, so the village fits.
    portrait: { target: [30, 100], bearing: 105, polar: 66, dist: 3900, lift: 80 },
    exag: 1.8,                          // about 350 m from the valley to the top
    dense: [200, 0],
    wave: [-884, 167]                   // from the hamlet of Kläppen
  },
  /* Bjursås Berg & Sjö (2026-11-04). The base area lies in the east, the lifts
     climb west; the north and south slopes lie side by side. */
  bjursas: {
    dir: "/reisgids/vormen/bjursas/",
    json: "bjursas.json",
    // From the base area in the east up the slopes: the south side on the left, the north side on the right.
    view: { target: [-40, 110], bearing: 270, polar: 68, dist: 2200, lift: 80 },
    // On an upright phone: from the south-east, so the whole length of the slopes fits.
    portrait: { target: [-20, 100], bearing: 300, polar: 66, dist: 2350, lift: 70 },
    exag: 2.3,                          // a low hill (about 160 m of slope): a little more height
    dense: [-60, 120],
    wave: [340, -100]                   // from the base area
  }
};

const EXAG_DEFAULT = 2;                 // height exaggeration (Romme: 275 m from valley to top); a scene can set its own
const MAP_FOV = 36.87;                  // MapLibre's vertical field of view (degrees)
const SUN = { azimuth: 235, elevation: 20 };
const SKY = { zenith: "#1a56a2", high: "#4b92d6", horizon: "#bcd7ee", haze: "#b9d3ea" };
const FOG_DENSITY = 0.000042;
const RINK_ICE = "#1d4a66";             // swept black ice

const LEVELS = {
  novice: { color: "#2f9a49", name: "Groen", text: "zeer makkelijk" },
  easy: { color: "#1f6cd1", name: "Blauw", text: "makkelijk" },
  intermediate: { color: "#d7362c", name: "Rood", text: "gemiddeld" },
  advanced: { color: "#121517", name: "Zwart", text: "moeilijk" },
  expert: { color: "#121517", name: "Zwart", text: "moeilijk" }
};
const LIFT_KINDS = {
  chair_lift: "Stoeltjeslift", gondola: "Gondel", "t-bar": "Ankerlift", platter: "Schotellift",
  drag_lift: "Sleeplift", rope_tow: "Touwlift", magic_carpet: "Loopband"
};
const LIFT_HEIGHT = { chair_lift: 9.5, gondola: 12, "t-bar": 5, platter: 4.5, drag_lift: 4.5, rope_tow: 1.5, magic_carpet: 0.4 };

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------------------
   Data
   ------------------------------------------------------------------------ */
const loaded = {};

function okJson(r) {
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}

/* RGB pixels of an image, exactly as stored (heights are encoded in them). */
function pixels(url) {
  return fetch(url).then(function (r) {
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.blob();
  }).then(function (blob) {
    if (window.createImageBitmap) {
      return createImageBitmap(blob, { premultiplyAlpha: "none", colorSpaceConversion: "none" })
        .catch(function () { return imageOf(blob); });
    }
    return imageOf(blob);
  }).then(function (img) {
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const g = c.getContext("2d", { willReadFrequently: true });
    g.drawImage(img, 0, 0);
    if (img.close) img.close();
    return g.getImageData(0, 0, c.width, c.height);
  });
}

function imageOf(blob) {
  return new Promise(function (resolve, reject) {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("Beeld niet te lezen")); };
    img.src = url;
  });
}

function heightGrid(image, half) {
  const n = image.width;
  const d = image.data;
  const h = new Float32Array(n * n);
  for (let i = 0; i < n * n; i++) h[i] = d[i * 4] * 256 + d[i * 4 + 1] + d[i * 4 + 2] / 256 - 32768;
  return { n: n, half: half, cell: (2 * half) / (n - 1), h: h };
}

/* Bilinear height at local metres (x east, y north). */
function sampleGrid(g, x, y) {
  let fx = (x + g.half) / g.cell;
  let fy = (g.half - y) / g.cell;
  fx = Math.min(Math.max(fx, 0), g.n - 1.0001);
  fy = Math.min(Math.max(fy, 0), g.n - 1.0001);
  const i = fx | 0, j = fy | 0, tx = fx - i, ty = fy - j, k = j * g.n + i;
  const a = g.h[k] * (1 - tx) + g.h[k + 1] * tx;
  const b = g.h[k + g.n] * (1 - tx) + g.h[k + g.n + 1] * tx;
  return a * (1 - ty) + b * ty;
}

/* One channel of a mask (0..1) at local metres. */
function sampleMask(img, half, x, y, channel) {
  const n = img.width;
  const i = Math.round(((x + half) / (2 * half)) * (n - 1));
  const j = Math.round(((half - y) / (2 * half)) * (n - 1));
  if (i < 0 || j < 0 || i >= n || j >= n) return 0;
  return img.data[(j * n + i) * 4 + channel] / 255;
}

export function preload(name, version) {
  const def = SCENES[name];
  if (!def) return Promise.reject(new Error("Onbekend skigebied: " + name));
  if (!loaded[name]) {
    const v = version ? "?v=" + encodeURIComponent(version) : "";
    const url = function (file) { return def.dir + file + v; };
    loaded[name] = Promise.all([
      fetch(url(def.json)).then(okJson),
      pixels(url("hoogte.webp")),
      pixels(url("omgeving.webp")),
      pixels(url("masker.webp")),
      pixels(url("omgeving-masker.webp"))
    ]).then(function (r) {
      const meta = r[0];
      const core = heightGrid(r[1], meta.core);
      const wide = heightGrid(r[2], meta.wide);
      let low = Infinity;
      for (let i = 0; i < core.h.length; i++) low = Math.min(low, core.h[i]);
      return { def: def, meta: meta, core: core, wide: wide, mask: r[3], wideMask: r[4], base: Math.floor(low) - 2 };
    });
    loaded[name].catch(function () { delete loaded[name]; });
  }
  return loaded[name];
}

/* ------------------------------------------------------------------------
   Satellite ground (2026-11-07): on the satellite map the ground of the 3D
   view is the same winter picture as the map (the guide's own tiles, 512 px,
   Web Mercator), with the pistes and roads of the mask crisp on top and the
   3D trees standing in it. options.satelliet = { maxzoom, tile(z, x, y) ->
   Promise<ImageBitmap | null> } (see satelliteFor3D in reisgids.js).
   ------------------------------------------------------------------------ */
const SAT_TILE = 512;
const skins = {};

function mercPx(lon, lat, world) {
  const s = Math.sin((lat * Math.PI) / 180);
  return [((lon + 180) / 360) * world, (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * world];
}

/* One tile on the canvas: the tile itself, or the part of a tile further out, larger. */
async function drawSatTile(sat, g, z, tx, ty, dx, dy) {
  for (let up = 0; up <= 3; up++) {
    const k = 1 << up;
    const img = await sat.tile(z - up, tx >> up, ty >> up);
    if (!img) continue;
    const s = SAT_TILE / k;
    g.drawImage(img, (tx % k) * s, (ty % k) * s, s, s, dx, dy, SAT_TILE, SAT_TILE);
    if (img.close) img.close();
    return true;
  }
  return false;
}

/* The picture under a square of `half` metres around the scene's origin, at zoom z. */
async function skinPart(sat, origin, half, z) {
  const R = 6378137;
  const kx = (R * Math.cos((origin[1] * Math.PI) / 180) * Math.PI) / 180;
  const ky = (R * Math.PI) / 180;
  const world = SAT_TILE * Math.pow(2, z);
  const edge = half * 1.02;
  const nw = mercPx(origin[0] - edge / kx, origin[1] + edge / ky, world);
  const se = mercPx(origin[0] + edge / kx, origin[1] - edge / ky, world);
  const tx0 = Math.floor(nw[0] / SAT_TILE), ty0 = Math.floor(nw[1] / SAT_TILE);
  const tx1 = Math.floor(se[0] / SAT_TILE), ty1 = Math.floor(se[1] / SAT_TILE);
  const canvas = document.createElement("canvas");
  canvas.width = (tx1 - tx0 + 1) * SAT_TILE;
  canvas.height = (ty1 - ty0 + 1) * SAT_TILE;
  const g = canvas.getContext("2d");
  g.fillStyle = "#8e9ca2";
  g.fillRect(0, 0, canvas.width, canvas.height);
  const jobs = [];
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) jobs.push(drawSatTile(sat, g, z, tx, ty, (tx - tx0) * SAT_TILE, (ty - ty0) * SAT_TILE));
  }
  const got = await Promise.all(jobs);
  if (!got.every(Boolean)) return null;
  return { canvas: canvas, box: [tx0 * SAT_TILE, ty0 * SAT_TILE, canvas.width, canvas.height], world: world };
}

/* Both parts: the ski area at the sharpest zoom, the surroundings one zoom
   further out (two on small screens: a smaller picture to hold). */
export function preloadSkin(name, sat, version) {
  const def = SCENES[name];
  if (!def || !sat) return Promise.resolve(null);
  if (!skins[name]) {
    const small = Math.min(window.innerWidth, window.innerHeight) < 700 || window.matchMedia("(pointer: coarse)").matches;
    const top = sat.maxzoom || 12;
    skins[name] = preload(name, version).then(function (data) {
      const meta = data.meta;
      return Promise.all([
        skinPart(sat, meta.origin, meta.core, top),
        skinPart(sat, meta.origin, meta.wide, top - (small ? 2 : 1))
      ]);
    }).then(function (parts) {
      if (!parts[0] || !parts[1]) throw new Error("Geen satellietbeeld voor " + name);
      return { core: parts[0], wide: parts[1] };
    });
    skins[name].catch(function () { delete skins[name]; });
  }
  return skins[name];
}

/* ------------------------------------------------------------------------
   Small helpers
   ------------------------------------------------------------------------ */
const clamp = function (v, a, b) { return Math.min(Math.max(v, a), b); };
const lerp = function (a, b, t) { return a + (b - a) * t; };
const smooth = function (a, b, v) { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const easeInOut = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
const DEG = Math.PI / 180;

function rng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function linear(hex) { return new THREE.Color(hex); } // sRGB hex -> linear working colour

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function quality() {
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 700;
  return coarse || small
    ? { step: 2, trees: 24000, shadow: 2048, dpr: 1.5 }
    : { step: 1, trees: 52000, shadow: 4096, dpr: 2 };
}

/* GLSL value noise, shared by the ground shaders. */
const NOISE = `
float rgHash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float rgNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(rgHash(i), rgHash(i + vec2(1.0, 0.0)), u.x), mix(rgHash(i + vec2(0.0, 1.0)), rgHash(i + vec2(1.0, 1.0)), u.x), u.y);
}
`;

/* The look of the snowy ground, for the ski area and the surroundings. */
const SURFACE = `
uniform vec3 cSnow; uniform vec3 cForestDark; uniform vec3 cForestMid; uniform vec3 cRoad; uniform vec3 cIce; uniform vec3 cPiste;
vec3 rgSurface(vec2 p, float forest, float piste, float road, float water, float trees) {
  float drift = rgNoise(p * 0.03) * 0.6 + rgNoise(p * 0.12) * 0.4;
  vec3 col = cSnow * (0.95 + 0.05 * drift);
  float crowns = smoothstep(0.38, 0.72, rgNoise(p * 0.17) * 0.6 + rgNoise(p * 0.5) * 0.4);
  vec3 woods = mix(cForestMid, cForestDark, crowns);
  col = mix(col, woods, forest * mix(0.9, 0.7, trees));
  col = mix(col, cIce * (0.96 + 0.04 * drift), water);
  col = mix(col, cPiste * (0.985 + 0.015 * drift), piste);
  col = mix(col, cRoad * (0.94 + 0.06 * drift), road * 0.85);
  return col;
}
`;

/* ------------------------------------------------------------------------
   The view
   ------------------------------------------------------------------------ */
export async function open(options) {
  const data = await preload(options.scene, options.version);
  let skin = null;
  if (options.satelliet) {
    skin = await Promise.race([
      preloadSkin(options.scene, options.satelliet, options.version).catch(function () { return null; }),
      new Promise(function (resolve) { window.setTimeout(function () { resolve(null); }, 4000); })
    ]);
  }
  return createView(data, options, skin);
}

function createView(data, options, firstSkin) {
  const def = data.def;
  const meta = data.meta;
  const EXAG = def.exag || EXAG_DEFAULT;
  const CORE = meta.core;
  const WIDE = meta.wide;
  const q = quality();
  const motion = !reduceMotion;

  const R_EARTH = 6378137;
  const blank = new THREE.DataTexture(new Uint8Array([200, 208, 212, 255]), 1, 1, THREE.RGBAFormat);
  blank.needsUpdate = true;
  let wantSat = !!firstSkin;      // the guest's choice (the button)
  let satTarget = firstSkin ? 1 : 0; // where the picture fades to (only 1 once it is there)
  let skin = null;
  const U = {
    uSatOn: { value: firstSkin ? 1 : 0 },
    uSatGain: { value: 1.08 },
    uSatCore: { value: blank },
    uSatWide: { value: blank },
    uSatCoreBox: { value: new THREE.Vector4(0, 0, 1, 1) },
    uSatWideBox: { value: new THREE.Vector4(0, 0, 1, 1) },
    uSatWorld: { value: new THREE.Vector2(1, 1) },
    uOrigin: { value: new THREE.Vector4(meta.origin[0], meta.origin[1], (R_EARTH * Math.cos(meta.origin[1] * DEG) * Math.PI) / 180, (R_EARTH * Math.PI) / 180) },
    uExag: { value: 0 },
    uRise: { value: 0 },
    uGrow: { value: motion ? 0 : 2 },
    uSweep: { value: motion ? 0 : 2 },
    uPx: { value: 0.001 },
    uFogColor: { value: linear(SKY.haze) },
    uFogDensity: { value: FOG_DENSITY },
    cSnow: { value: linear("#f6f9fb") },
    cForestDark: { value: linear("#2c4442") },
    cForestMid: { value: linear("#8ea4ae") },
    cRoad: { value: linear("#b9c1c6") },
    cIce: { value: linear("#d9e8f0") },
    cPiste: { value: linear("#fdfeff") }
  };

  /* The detailed heights run over into the coarser surroundings along the
     last 250 m, so the two meet without a step. */
  const BLEND = 250;
  const coreEdge = function (x, y) { return smooth(CORE - BLEND, CORE - 10, Math.max(Math.abs(x), Math.abs(y))); };
  const groundRaw = function (x, y) {
    const inCore = Math.abs(x) < CORE && Math.abs(y) < CORE;
    if (!inCore) return sampleGrid(data.wide, x, y) - data.base;
    const k = coreEdge(x, y);
    const h = sampleGrid(data.core, x, y);
    return (k > 0 ? lerp(h, sampleGrid(data.wide, x, y), k) : h) - data.base;
  };
  const groundY = function (x, y) { return groundRaw(x, y) * U.uExag.value; };

  /* DOM ------------------------------------------------------------------ */
  const root = el("div", "rg3d");
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-labelledby", "rg3dTitle");
  root.setAttribute("aria-describedby", "rg3dHint");
  const canvas = el("canvas", "rg3d__canvas");
  canvas.setAttribute("aria-hidden", "true");
  const labelLayer = el("div", "rg3d__labels");
  labelLayer.setAttribute("aria-hidden", "true");

  const top = el("header", "rg3d__top");
  const closeBtn = el("button", "rg3d__btn rg3d__close");
  closeBtn.type = "button";
  closeBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 5l-7 7 7 7" /></svg>';
  closeBtn.appendChild(el("span", null, "Terug naar de kaart"));
  const titleWrap = el("div", "rg3d__title");
  titleWrap.appendChild(el("p", "rg3d__eyebrow", "Skigebied in 3D"));
  const title = el("h2", "rg3d__name", options.title || "Skigebied");
  title.id = "rg3dTitle";
  titleWrap.appendChild(title);
  const pauseBtn = el("button", "rg3d__btn rg3d__pause");
  pauseBtn.type = "button";
  top.appendChild(closeBtn);
  top.appendChild(titleWrap);
  top.appendChild(pauseBtn);
  // The same switch as on the map: drawn ground or the satellite picture.
  const layerBtn = el("button", "rg3d__btn rg3d__layer");
  layerBtn.type = "button";
  const layerThumb = el("span", "rg3d__layer-thumb");
  layerThumb.setAttribute("aria-hidden", "true");
  const layerText = el("span", "rg3d__layer-text");
  layerBtn.appendChild(layerThumb);
  layerBtn.appendChild(layerText);
  if (options.onSatellite) {
    top.appendChild(layerBtn);
    layerBtn.addEventListener("click", function () { options.onSatellite(); });
  }

  const legend = el("ul", "rg3d__legend");
  legend.setAttribute("aria-label", "Kleuren van de pistes");
  ["novice", "easy", "intermediate", "advanced"].forEach(function (k) {
    const li = el("li");
    const dot = el("span", "rg3d__dot");
    dot.style.background = LEVELS[k].color;
    li.appendChild(dot);
    li.appendChild(el("span", null, LEVELS[k].text));
    legend.appendChild(li);
  });
  const liftKey = el("li", "rg3d__legend-lift");
  // The letter, if the lifts have one here; otherwise the lift symbol.
  const firstRef = meta.liften.map(function (l) { return l.ref; }).filter(Boolean).sort()[0];
  liftKey.appendChild(el("span", "rg3d__lift-key", firstRef || ""));
  liftKey.appendChild(el("span", null, "lift"));
  legend.appendChild(liftKey);

  if ((options.ijsbanen || []).length) {
    const rinkKey = el("li");
    const rinkDot = el("span", "rg3d__dot");
    rinkDot.style.background = RINK_ICE;
    rinkKey.appendChild(rinkDot);
    rinkKey.appendChild(el("span", null, "geveegde schaatsbaan"));
    legend.appendChild(rinkKey);
  }

  const hint = el("p", "rg3d__hint", "Sleep om te draaien, knijp of scroll om te zoomen. Tik op een nummer of letter voor de naam.");
  hint.id = "rg3dHint";
  const info = el("p", "rg3d__info");
  info.setAttribute("aria-live", "polite");
  const CREDIT = "Kaartdata © OpenStreetMap-bijdragers · hoogtes: Mapzen Terrain Tiles";
  const credit = el("p", "rg3d__credit", CREDIT);
  function syncSatellite() {
    layerText.textContent = wantSat ? "Kaart" : "Satelliet";
    layerBtn.classList.toggle("is-satelliet", wantSat);
    layerBtn.setAttribute("aria-label", wantSat ? "Toon de getekende ondergrond" : "Toon het satellietbeeld");
    credit.textContent = CREDIT + (skin && wantSat ? " · satellietbeeld: bevat aangepaste Copernicus Sentinel-gegevens" : "");
  }
  const list = el("div", "rg3d__sr");      // the pistes and lifts as text, for screen readers

  root.appendChild(canvas);
  root.appendChild(labelLayer);
  root.appendChild(top);
  root.appendChild(legend);
  root.appendChild(hint);
  root.appendChild(info);
  root.appendChild(credit);
  root.appendChild(list);

  /* Renderer -------------------------------------------------------------- */
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: "high-performance" });
  } catch (e) {
    throw new Error("WebGL niet beschikbaar");
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, q.dpr));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  const shadowSize = Math.min(q.shadow, renderer.capabilities.maxTextureSize);
  const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(new THREE.Color(SKY.haze), FOG_DENSITY);
  scene.background = new THREE.Color(SKY.horizon);

  const camera = new THREE.PerspectiveCamera(MAP_FOV, 1, 8, 90000);
  const disposables = [];
  const keep = function (thing) { disposables.push(thing); return thing; };

  /* Light: a low winter sun from the south-west and a cold blue sky. */
  const sunDir = new THREE.Vector3(
    Math.sin(SUN.azimuth * DEG) * Math.cos(SUN.elevation * DEG),
    Math.sin(SUN.elevation * DEG),
    -Math.cos(SUN.azimuth * DEG) * Math.cos(SUN.elevation * DEG)
  ).normalize();
  const sun = new THREE.DirectionalLight(new THREE.Color("#ffedd2"), 5.0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 1.2;
  const sc = sun.shadow.camera;
  sc.left = -3400; sc.right = 3400; sc.top = 1900; sc.bottom = -1900; sc.near = 1000; sc.far = 13000;
  sun.position.copy(sunDir).multiplyScalar(7000);
  sun.target.position.set(0, 0, 0);
  scene.add(sun);
  scene.add(sun.target);
  scene.add(new THREE.HemisphereLight(new THREE.Color("#98bdea"), new THREE.Color("#f2f6f9"), 1.4));

  /* Shader injection: everything that stands on the ground follows the
     rising terrain (attribute "ground" x uExag). */
  function onGround(material, key, extra) {
    material.customProgramCacheKey = function () { return key; };
    material.onBeforeCompile = function (shader) {
      Object.keys(U).forEach(function (k) { shader.uniforms[k] = U[k]; });
      shader.vertexShader = "attribute float ground;\nuniform float uExag;\nuniform float uRise;\nvarying vec3 vWorld;\n" +
        shader.vertexShader.replace("#include <begin_vertex>",
          "vec3 transformed = vec3( position );\ntransformed.y += ground * uExag;\nvWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      if (extra) extra(shader);
    };
    return material;
  }

  function depthFor(key, inject) {
    const m = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
    m.customProgramCacheKey = function () { return key + "-depth"; };
    m.onBeforeCompile = function (shader) {
      Object.keys(U).forEach(function (k) { shader.uniforms[k] = U[k]; });
      inject(shader);
    };
    return keep(m);
  }

  /* Ground ---------------------------------------------------------------- */
  function maskTexture(img) {
    const t = new THREE.DataTexture(new Uint8Array(img.data.buffer.slice(0)), img.width, img.height, THREE.RGBAFormat);
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.anisotropy = anisotropy;
    t.colorSpace = THREE.NoColorSpace;
    t.needsUpdate = true;
    return keep(t);
  }
  const maskTex = maskTexture(data.mask);
  const wideMaskTex = maskTexture(data.wideMask);

  function skinTexture(part) {
    const t = new THREE.CanvasTexture(part.canvas);
    t.colorSpace = THREE.SRGBColorSpace;   // a photo: shown as it is, lit like the rest
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    t.anisotropy = anisotropy;
    return keep(t);
  }
  function applySkin(next) {
    skin = next;
    U.uSatCore.value = skinTexture(next.core);
    U.uSatWide.value = skinTexture(next.wide);
    U.uSatCoreBox.value.set(next.core.box[0], next.core.box[1], next.core.box[2], next.core.box[3]);
    U.uSatWideBox.value.set(next.wide.box[0], next.wide.box[1], next.wide.box[2], next.wide.box[3]);
    U.uSatWorld.value.set(next.core.world, next.wide.world);
  }
  if (firstSkin) applySkin(firstSkin);
  keep(blank);
  syncSatellite();

  /* Where a point of the ground lies on the satellite pictures (core, wide). */
  const SAT_VERTEX = [
    "uniform vec4 uOrigin;",
    "uniform vec4 uSatCoreBox;",
    "uniform vec4 uSatWideBox;",
    "uniform vec2 uSatWorld;",
    "varying vec2 vSatCore;",
    "varying vec2 vSatWide;",
    "vec2 rgMerc(vec3 w, float world) {",
    "  float lon = uOrigin.x + w.x / uOrigin.z;",
    "  float lat = radians(uOrigin.y - w.z / uOrigin.w);",
    "  return vec2((lon + 180.0) / 360.0, 0.5 - log(tan(0.7853981634 + 0.5 * lat)) / 6.2831853072) * world;",
    "}",
    ""
  ].join("\n");
  const SAT_FRAGMENT = "uniform sampler2D uSatCore;\nuniform sampler2D uSatWide;\nuniform float uSatOn;\nuniform float uSatGain;\nvarying vec2 vSatCore;\nvarying vec2 vSatWide;\n";
  function satVertex(shader) {
    shader.vertexShader = SAT_VERTEX + shader.vertexShader.replace("#include <fog_vertex>",
      "#include <fog_vertex>\nvSatCore = (rgMerc(vWorld, uSatWorld.x) - uSatCoreBox.xy) / uSatCoreBox.zw;\nvSatWide = (rgMerc(vWorld, uSatWorld.y) - uSatWideBox.xy) / uSatWideBox.zw;");
  }

  /* Grid mesh: positions in metres with y = 0 (+ skirt), heights in "ground",
     normals for the full exaggeration. */
  function gridGeometry(grid, step, opts) {
    const n = Math.floor((grid.n - 1) / step) + 1;
    const cell = grid.cell * step;
    const count = n * n + (opts.skirt ? 4 * (n - 1) : 0);
    const pos = new Float32Array(count * 3);
    const nor = new Float32Array(count * 3);
    const gr = new Float32Array(count);
    const at = function (i, j) {
      i = clamp(i, 0, grid.n - 1); j = clamp(j, 0, grid.n - 1);
      return grid.h[j * grid.n + i] - data.base;
    };
    let v = 0;
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const gi = i * step, gj = j * step;
        const x = -grid.half + i * cell;
        const y = grid.half - j * cell;
        let h = at(gi, gj);
        if (opts.flatten) h = opts.flatten(x, y, h);
        pos[v * 3] = x; pos[v * 3 + 1] = 0; pos[v * 3 + 2] = -y;
        gr[v] = h;
        const dx = (at(gi + step, gj) - at(gi - step, gj)) * EXAG / (2 * cell);
        const dz = (at(gi, gj + step) - at(gi, gj - step)) * EXAG / (2 * cell);
        const len = Math.hypot(dx, 1, dz);
        nor[v * 3] = -dx / len; nor[v * 3 + 1] = 1 / len; nor[v * 3 + 2] = -dz / len;
        v++;
      }
    }
    const idx = [];
    for (let j = 0; j < n - 1; j++) {
      for (let i = 0; i < n - 1; i++) {
        const a = j * n + i, b = a + 1, c = a + n, d = c + 1;
        if (opts.skipCell && opts.skipCell(-grid.half + (i + 0.5) * cell, grid.half - (j + 0.5) * cell)) continue;
        idx.push(a, c, b, b, c, d);
      }
    }
    if (opts.skirt) {
      // A wall down along the edge hides the seam with the wider ground.
      const ring = [];
      for (let i = 0; i < n - 1; i++) ring.push(i);
      for (let j = 0; j < n - 1; j++) ring.push(j * n + n - 1);
      for (let i = n - 1; i > 0; i--) ring.push((n - 1) * n + i);
      for (let j = n - 1; j > 0; j--) ring.push(j * n);
      const first = v;
      ring.forEach(function (k) {
        pos[v * 3] = pos[k * 3]; pos[v * 3 + 1] = -opts.skirt; pos[v * 3 + 2] = pos[k * 3 + 2];
        nor[v * 3] = nor[k * 3]; nor[v * 3 + 1] = nor[k * 3 + 1]; nor[v * 3 + 2] = nor[k * 3 + 2];
        gr[v] = gr[k];
        v++;
      });
      for (let r = 0; r < ring.length; r++) {
        const a = ring[r], b = ring[(r + 1) % ring.length];
        const a2 = first + r, b2 = first + ((r + 1) % ring.length);
        idx.push(a, b, a2, b, b2, a2);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
    g.setAttribute("ground", new THREE.BufferAttribute(gr, 1));
    g.setIndex(idx);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 300, 0), grid.half * 1.6);
    return keep(g);
  }

  const terrainVertex = function (shader) {
    shader.vertexShader = shader.vertexShader.replace("#include <beginnormal_vertex>",
      "vec3 objectNormal = normalize(mix(vec3(0.0, 1.0, 0.0), normal, uRise));");
  };
  const coreDepth = depthFor("terrain", function (shader) {
    shader.vertexShader = "attribute float ground;\nuniform float uExag;\n" +
      shader.vertexShader.replace("#include <begin_vertex>", "vec3 transformed = vec3( position );\ntransformed.y += ground * uExag;");
  });

  const coreMat = keep(onGround(new THREE.MeshLambertMaterial({ color: 0xffffff }), "terrain-core", function (shader) {
    terrainVertex(shader);
    satVertex(shader);
    shader.uniforms.uMask = { value: maskTex };
    shader.uniforms.uWideMask = { value: wideMaskTex };
    shader.uniforms.uCore = { value: CORE };
    shader.uniforms.uWide = { value: WIDE };
    shader.uniforms.uDense = { value: new THREE.Vector4(def.dense[0], -def.dense[1], 1500, 2500) };
    shader.fragmentShader = "uniform sampler2D uMask;\nuniform sampler2D uWideMask;\nuniform float uCore;\nuniform float uWide;\nuniform vec4 uDense;\nvarying vec3 vWorld;\n" + SAT_FRAGMENT + NOISE + SURFACE +
      shader.fragmentShader.replace("vec4 diffuseColor = vec4( diffuse, opacity );", [
        "vec4 m = texture2D(uMask, (vWorld.xz + uCore) / (2.0 * uCore));",
        "float water = texture2D(uWideMask, (vWorld.xz + uWide) / (2.0 * uWide)).g;",
        "float trees = (1.0 - smoothstep(uDense.z, uDense.w, length(vWorld.xz - uDense.xy))) * smoothstep(0.35, 0.8, m.r);",
        "vec3 ground = rgSurface(vWorld.xz, m.r, m.g, m.b, water * (1.0 - m.g), trees);",
        // On the satellite picture the groomed pistes and the roads stay crisp on top.
        "if (uSatOn > 0.001) {",
        "  vec3 sat = texture2D(uSatCore, vSatCore).rgb * uSatGain;",
        "  sat = mix(sat, cPiste, m.g * 0.9);",
        "  sat = mix(sat, cRoad, m.b * 0.45);",
        "  ground = mix(ground, sat, uSatOn);",
        "}",
        "vec4 diffuseColor = vec4(ground, opacity);"
      ].join("\n"));
  }));
  const coreGeo = gridGeometry(data.core, q.step, {
    skirt: 60,
    flatten: function (x, y, h) {
      const k = coreEdge(x, y);
      return k > 0 ? lerp(h, sampleGrid(data.wide, x, y) - data.base, k) : h;
    }
  });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  coreMesh.receiveShadow = true;
  coreMesh.castShadow = true;
  coreMesh.customDepthMaterial = coreDepth;
  scene.add(coreMesh);

  /* The surroundings: 32 km of hills, lakes and Borlänge in the distance,
     sinking towards a far plain at the edge; hidden under the ski area. */
  const plain = (function () {
    let s = 0, c = 0;
    const g = data.wide;
    for (let i = 0; i < g.n; i++) {
      s += g.h[i] + g.h[(g.n - 1) * g.n + i] + g.h[i * g.n] + g.h[i * g.n + g.n - 1];
      c += 4;
    }
    return s / c - data.base;
  })();
  const wideMat = keep(onGround(new THREE.MeshLambertMaterial({ color: 0xffffff }), "terrain-wide", function (shader) {
    terrainVertex(shader);
    satVertex(shader);
    shader.uniforms.uWideMask = { value: wideMaskTex };
    shader.uniforms.uCore = { value: CORE - 20 };
    shader.uniforms.uWide = { value: WIDE };
    shader.fragmentShader = "uniform sampler2D uWideMask;\nuniform float uCore;\nuniform float uWide;\nvarying vec3 vWorld;\n" + SAT_FRAGMENT + NOISE + SURFACE +
      shader.fragmentShader.replace("vec4 diffuseColor = vec4( diffuse, opacity );", [
        "if (abs(vWorld.x) < uCore && abs(vWorld.z) < uCore) discard;",
        "vec2 wuv = (vWorld.xz + uWide) / (2.0 * uWide);",
        "vec4 m = (wuv.x < 0.0 || wuv.y < 0.0 || wuv.x > 1.0 || wuv.y > 1.0) ? vec4(0.85, 0.0, 0.0, 1.0) : texture2D(uWideMask, wuv);",
        "vec3 ground = rgSurface(vWorld.xz, m.r, 0.0, m.b * 0.6, m.g, 0.0);",
        // The picture fades into the drawn plain towards the far edge.
        "if (uSatOn > 0.001) {",
        "  float rim = 1.0 - smoothstep(0.84, 0.98, max(abs(vWorld.x), abs(vWorld.z)) / uWide);",
        "  ground = mix(ground, texture2D(uSatWide, vSatWide).rgb * uSatGain, uSatOn * rim);",
        "}",
        "vec4 diffuseColor = vec4(ground, opacity);"
      ].join("\n"));
  }));
  const wideGeo = gridGeometry(data.wide, 1, {
    flatten: function (x, y, h) {
      const edge = Math.max(Math.abs(x), Math.abs(y)) / WIDE;
      // Lakes keep their own level, otherwise a far lake would tilt into the plain.
      const wet = sampleMask(data.wideMask, WIDE, x, y, 1);
      return lerp(h, plain, smooth(0.72, 1, edge) * (1 - wet));
    }
  });
  const wideMesh = new THREE.Mesh(wideGeo, wideMat);
  wideMesh.receiveShadow = false;
  scene.add(wideMesh);

  // Beyond: a plain that disappears in the haze, with low blue ridges on the horizon.
  const plainGeo = keep(new THREE.RingGeometry(WIDE * 0.98, 80000, 64, 1));
  plainGeo.rotateX(-Math.PI / 2);
  plainGeo.setAttribute("ground", new THREE.BufferAttribute(new Float32Array(plainGeo.attributes.position.count).fill(plain - 15), 1));
  const plainMesh = new THREE.Mesh(plainGeo, keep(onGround(new THREE.MeshLambertMaterial({ color: 0xffffff }), "terrain-plain", function (shader) {
    terrainVertex(shader);
    shader.fragmentShader = "varying vec3 vWorld;\n" + NOISE + SURFACE +
      shader.fragmentShader.replace("vec4 diffuseColor = vec4( diffuse, opacity );",
        "vec4 diffuseColor = vec4(rgSurface(vWorld.xz, 0.8, 0.0, 0.0, 0.0, 0.0), opacity);");
  })));
  scene.add(plainMesh);

  function ridges(radius, height, seed, strength) {
    const g = keep(new THREE.CylinderGeometry(radius, radius, height, 160, 1, true));
    g.translate(0, height / 2 - 60, 0);
    const m = keep(new THREE.ShaderMaterial({
      side: THREE.BackSide,
      fog: false,
      depthWrite: false,
      uniforms: {
        uHaze: { value: linear(SKY.horizon) }, uRidge: { value: linear("#7d9db5") },
        uSeed: { value: seed }, uStrength: { value: strength }, uHeight: { value: height }, uLift: { value: 0 }
      },
      vertexShader: "varying vec3 vPos;\nvoid main() { vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: NOISE + [
        "uniform vec3 uHaze; uniform vec3 uRidge; uniform float uSeed; uniform float uStrength; uniform float uHeight; uniform float uLift;",
        "varying vec3 vPos;",
        "void main() {",
        "  float a = atan(vPos.z, vPos.x);",
        "  float r = rgNoise(vec2(a * 9.0 + uSeed, uSeed)) * 0.55 + rgNoise(vec2(a * 31.0 + uSeed * 2.0, 1.0)) * 0.3 + rgNoise(vec2(a * 90.0, uSeed)) * 0.15;",
        "  float top = uHeight * (0.18 + 0.62 * r) - 60.0 + uLift;",
        "  if (vPos.y > top) discard;",
        "  float k = uStrength * smoothstep(-60.0, top, vPos.y);",
        "  gl_FragColor = vec4(mix(uHaze, uRidge, k), 1.0);",
        "  #include <colorspace_fragment>",
        "}"
      ].join("\n")
    }));
    const mesh = new THREE.Mesh(g, m);
    mesh.renderOrder = -1;
    mesh.position.y = plain * EXAG;
    return mesh;
  }
  const farRidges = ridges(52000, 1400, 3.7, 0.38);
  const nearRidges = ridges(40000, 1000, 8.1, 0.5);
  scene.add(farRidges);
  scene.add(nearRidges);

  /* Sky: a deep winter blue overhead, pale along the horizon. */
  const skyMat = keep(new THREE.ShaderMaterial({
    side: THREE.BackSide,
    fog: false,
    depthWrite: false,
    uniforms: {
      uZenith: { value: linear(SKY.zenith) }, uHigh: { value: linear(SKY.high) },
      uHorizon: { value: linear(SKY.horizon) }, uSun: { value: sunDir }
    },
    vertexShader: "varying vec3 vDir;\nvoid main() { vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }",
    fragmentShader: [
      "uniform vec3 uZenith; uniform vec3 uHigh; uniform vec3 uHorizon; uniform vec3 uSun;",
      "varying vec3 vDir;",
      "void main() {",
      "  float h = clamp(vDir.y, -1.0, 1.0);",
      "  vec3 col = mix(uHorizon, uHigh, smoothstep(0.0, 0.13, h));",
      "  col = mix(col, uZenith, smoothstep(0.12, 0.75, h));",
      "  float s = max(dot(normalize(vDir), uSun), 0.0);",
      "  col += vec3(1.0, 0.86, 0.66) * (pow(s, 12.0) * 0.22 + pow(s, 400.0) * 0.6);",
      "  gl_FragColor = vec4(col, 1.0);",
      "  #include <colorspace_fragment>",
      "}"
    ].join("\n")
  }));
  const sky = new THREE.Mesh(keep(new THREE.SphereGeometry(80000, 32, 16)), skyMat);
  sky.renderOrder = -2;
  sky.frustumCulled = false;
  scene.add(sky);

  /* Forest ------------------------------------------------------------------
     Frosted spruces: three tiers of cones, white on top, dark needles
     underneath. One geometry, drawn tens of thousands of times. */
  function spruceGeometry() {
    const P = [], N = [], C = [];
    const snow = linear("#eef4f8"), frost = linear("#c6d6de"), needle = linear("#1f4436"), under = linear("#142a22");
    const seg = 7;
    function tri(a, b, c, na, nb, nc, ca, cb, cc) {
      P.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
      N.push(na[0], na[1], na[2], nb[0], nb[1], nb[2], nc[0], nc[1], nc[2]);
      C.push(ca.r, ca.g, ca.b, cb.r, cb.g, cb.b, cc.r, cc.g, cc.b);
    }
    function cone(y0, y1, r, twist) {
      const slope = r / (y1 - y0);
      for (let i = 0; i < seg; i++) {
        const a0 = (i / seg) * Math.PI * 2 + twist, a1 = ((i + 1) / seg) * Math.PI * 2 + twist, am = (a0 + a1) / 2;
        const p0 = [Math.cos(a0) * r, y0, Math.sin(a0) * r], p1 = [Math.cos(a1) * r, y0, Math.sin(a1) * r];
        const n = function (a) { const v = new THREE.Vector3(Math.cos(a), slope, Math.sin(a)).normalize(); return [v.x, v.y, v.z]; };
        // Streaks of frost and dark needles down the cone.
        const rim0 = i % 2 ? needle : frost, rim1 = (i + 1) % 2 ? needle : frost;
        tri([0, y1, 0], p1, p0, n(am), n(a1), n(a0), snow, rim1, rim0);
        tri(p0, p1, [0, y0 + (y1 - y0) * 0.08, 0], [0, -1, 0], [0, -1, 0], [0, -1, 0], under, under, under);
      }
    }
    // A short trunk
    for (let i = 0; i < 5; i++) {
      const a0 = (i / 5) * Math.PI * 2, a1 = ((i + 1) / 5) * Math.PI * 2, r = 0.035;
      const b0 = [Math.cos(a0) * r, 0, Math.sin(a0) * r], b1 = [Math.cos(a1) * r, 0, Math.sin(a1) * r];
      const t0 = [b0[0], 0.14, b0[2]], t1 = [b1[0], 0.14, b1[2]];
      const nn = [Math.cos((a0 + a1) / 2), 0, Math.sin((a0 + a1) / 2)];
      const bark = linear("#3a2a20");
      tri(b0, t1, b1, nn, nn, nn, bark, bark, bark);
      tri(b0, t0, t1, nn, nn, nn, bark, bark, bark);
    }
    cone(0.1, 0.58, 0.36, 0);
    cone(0.32, 0.8, 0.27, 0.4);
    cone(0.55, 1.0, 0.17, 0.9);
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(N, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(C, 3));
    return keep(g);
  }

  function plantTrees() {
    const r = rng(20261030);
    const cell = 7.5;
    const dense = def.dense;
    const cand = [];
    let sum = 0;
    for (let y = -CORE + 20; y < CORE - 20; y += cell) {
      for (let x = -CORE + 20; x < CORE - 20; x += cell) {
        const px = x + (r() - 0.5) * cell * 0.9;
        const py = y + (r() - 0.5) * cell * 0.9;
        const forest = smooth(0.45, 0.85, sampleMask(data.mask, CORE, px, py, 0));
        if (forest <= 0) continue;
        if (sampleMask(data.mask, CORE, px, py, 1) > 0.15 || sampleMask(data.mask, CORE, px, py, 2) > 0.25) continue;
        const d = Math.hypot(px - dense[0], py - dense[1]);
        const w = forest * (1 - smooth(1500, 2500, d) * 0.85);
        cand.push(px, py, w);
        sum += w;
      }
    }
    // A wider ski area (Sälen: core 3000 to 3300 m) gets a few more trees, otherwise the forest is thin.
    const budget = q.trees * Math.min(1.35, CORE / 2400);
    const k = Math.min(1, budget / Math.max(sum, 1));
    const out = [];
    const wave = def.wave;
    const far = Math.hypot(CORE + Math.abs(wave[0]), CORE + Math.abs(wave[1]));
    for (let i = 0; i < cand.length; i += 3) {
      if (r() > cand[i + 2] * k) continue;
      const x = cand[i], y = cand[i + 1];
      const height = 11 + r() * 10 + r() * r() * 6;
      out.push({
        x: x, y: y, g: groundRaw(x, y), h: height, w: 0.85 + r() * 0.35, rot: r() * Math.PI * 2,
        delay: (Math.hypot(x - wave[0], y - wave[1]) / far) * 0.85 + r() * 0.1,
        shade: 0.82 + r() * 0.26, snow: r() < 0.3 ? 0.5 + r() * 0.5 : r() * 0.35
      });
    }
    return out;
  }

  /* Shuffled, so the first n of them are spread over the whole forest
     (a slow device keeps only part of them, see the speed check). */
  const trees = plantTrees();
  const shuffle = rng(7);
  for (let i = trees.length - 1; i > 0; i--) {
    const j = Math.floor(shuffle() * (i + 1));
    const t = trees[i]; trees[i] = trees[j]; trees[j] = t;
  }
  const treeGeo = spruceGeometry();
  const tPos = new Float32Array(trees.length * 3), tSize = new Float32Array(trees.length * 2);
  const tRot = new Float32Array(trees.length), tDelay = new Float32Array(trees.length), tTint = new Float32Array(trees.length * 2);
  trees.forEach(function (t, i) {
    tPos[i * 3] = t.x; tPos[i * 3 + 1] = t.g; tPos[i * 3 + 2] = -t.y;
    tSize[i * 2] = t.h; tSize[i * 2 + 1] = t.w;
    tRot[i] = t.rot; tDelay[i] = t.delay;
    tTint[i * 2] = t.shade; tTint[i * 2 + 1] = t.snow;
  });
  treeGeo.setAttribute("aPos", new THREE.InstancedBufferAttribute(tPos, 3));
  treeGeo.setAttribute("aSize", new THREE.InstancedBufferAttribute(tSize, 2));
  treeGeo.setAttribute("aRot", new THREE.InstancedBufferAttribute(tRot, 1));
  treeGeo.setAttribute("aDelay", new THREE.InstancedBufferAttribute(tDelay, 1));
  treeGeo.setAttribute("aTint", new THREE.InstancedBufferAttribute(tTint, 2));
  treeGeo.instanceCount = trees.length;

  const TREE_VERTEX = [
    "float tg = clamp((uGrow - aDelay) / 0.32, 0.0, 1.0);",
    "float grow = tg >= 1.0 ? 1.0 : (1.0 - pow(1.0 - tg, 3.0)) * (1.0 + 0.22 * sin(tg * 3.14159));",
    "float tc = cos(aRot), ts = sin(aRot);",
    "vec3 transformed = position;",
    "transformed.xz = mat2(tc, -ts, ts, tc) * transformed.xz;",
    "transformed *= vec3(aSize.y, 1.0, aSize.y) * aSize.x * grow;",
    "transformed += vec3(aPos.x, aPos.y * uExag - 0.6, aPos.z);"
  ].join("\n");
  const TREE_ATTRS = "attribute vec3 aPos;\nattribute vec2 aSize;\nattribute float aRot;\nattribute float aDelay;\nattribute vec2 aTint;\nuniform float uExag;\nuniform float uGrow;\n";
  const treeMat = keep(new THREE.MeshLambertMaterial({ vertexColors: true }));
  treeMat.customProgramCacheKey = function () { return "spruce"; };
  treeMat.onBeforeCompile = function (shader) {
    shader.uniforms.uExag = U.uExag;
    shader.uniforms.uGrow = U.uGrow;
    shader.uniforms.uSatOn = U.uSatOn;
    // On the satellite picture the forest is dark (the snow had blown off the trees): less snow on them.
    shader.vertexShader = "uniform float uSatOn;\n" + TREE_ATTRS + shader.vertexShader
      .replace("#include <beginnormal_vertex>", "float nc = cos(aRot), ns = sin(aRot);\nvec3 objectNormal = normal;\nobjectNormal.xz = mat2(nc, -ns, ns, nc) * objectNormal.xz;")
      .replace("#include <begin_vertex>", TREE_VERTEX)
      .replace("#include <color_vertex>", "#include <color_vertex>\nvColor.rgb = mix(vColor.rgb, vec3(0.86, 0.9, 0.93), aTint.y * 0.4 * (1.0 - 0.7 * uSatOn) * smoothstep(-0.2, 0.6, normal.y)) * aTint.x;");
  };
  const treeDepth = depthFor("spruce", function (shader) {
    shader.vertexShader = TREE_ATTRS + shader.vertexShader.replace("#include <begin_vertex>", TREE_VERTEX);
  });
  const forest = new THREE.Mesh(treeGeo, treeMat);
  forest.castShadow = true;
  forest.receiveShadow = true;
  forest.frustumCulled = false;
  forest.customDepthMaterial = treeDepth;
  scene.add(forest);

  /* Lines: pistes flat on the snow, lift cables in the air. Kept at least
     a couple of pixels wide at any distance, like on a printed piste map. */
  const lineMat = function (billboard, halfPx, minHalf, opacity, far) {
    return keep(new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: far ? THREE.DoubleSide : THREE.FrontSide,   // widened on the screen, the winding can turn round
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -6,
      uniforms: {
        uExag: U.uExag, uPx: U.uPx, uSweep: U.uSweep, uFogColor: U.uFogColor, uFogDensity: U.uFogDensity,
        uHalfPx: { value: halfPx }, uMinHalf: { value: minHalf }, uBillboard: { value: billboard ? 1 : 0 },
        uOpacity: { value: opacity },
        // Far lines (the track on the lake, 10 to 30 km away): lifted further towards
        // the camera against the coarse depth there, and less lost in the haze.
        uPushMax: { value: far ? 60 : 6 }, uFogK: { value: far ? 0.3 : 1 }, uScreen: { value: far ? 1 : 0 }
      },
      vertexShader: [
        "attribute float ground; attribute float side; attribute vec3 aTan; attribute vec3 aTint; attribute float along; attribute float delay;",
        "uniform float uExag; uniform float uPx; uniform float uHalfPx; uniform float uMinHalf; uniform float uBillboard; uniform float uFogDensity; uniform float uPushMax; uniform float uFogK; uniform float uScreen;",
        "varying vec3 vTint; varying float vAlong; varying float vDelay; varying float vSide; varying float vFog;",
        "void main() {",
        "  vec3 p = position; p.y += ground * uExag;",
        "  vec3 w = (modelMatrix * vec4(p, 1.0)).xyz;",
        "  vec3 toCam = cameraPosition - w;",
        "  float dist = length(toCam);",
        "  float hw = max(uMinHalf, dist * uPx * uHalfPx);",
        "  vec3 off = uBillboard > 0.5 ? normalize(cross(aTan, toCam)) : normalize(vec3(-aTan.z, 0.0, aTan.x));",
        "  if (uScreen < 0.5) w += off * side * hw;",
        "  w += normalize(toCam) * min(dist * 0.002, uPushMax);",
        "  vec4 clip = projectionMatrix * viewMatrix * vec4(w, 1.0);",
        // Far lines: the width is taken on the screen, not on the ground, so a flat line seen
        // along the ice (a grazing angle) does not shrink to a sliver and break up.
        "  if (uScreen > 0.5) {",
        "    vec4 ahead = projectionMatrix * viewMatrix * vec4(w + aTan * max(20.0, dist * 0.03), 1.0);",
        "    float asp = projectionMatrix[1][1] / projectionMatrix[0][0];",
        "    vec2 dir = (ahead.xy / ahead.w - clip.xy / clip.w) * vec2(asp, 1.0);",
        "    dir = length(dir) > 1e-6 ? normalize(dir) : vec2(1.0, 0.0);",
        "    float px = max(uHalfPx, uMinHalf / max(dist * uPx, 1e-5));",
        "    clip.xy += vec2(-dir.y / asp, dir.x) * side * px * uPx * projectionMatrix[1][1] * clip.w;",
        "  }",
        "  gl_Position = clip;",
        "  vTint = aTint; vAlong = along; vDelay = delay; vSide = side;",
        "  vFog = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist * uFogK);",
        "}"
      ].join("\n"),
      fragmentShader: [
        "uniform vec3 uFogColor; uniform float uSweep; uniform float uOpacity;",
        "varying vec3 vTint; varying float vAlong; varying float vDelay; varying float vSide; varying float vFog;",
        "void main() {",
        "  float reveal = clamp((uSweep - vDelay) * 2.4, 0.0, 1.0);",
        "  if (vAlong > reveal) discard;",
        "  float a = 1.0 - smoothstep(0.45, 1.0, abs(vSide));",
        "  gl_FragColor = vec4(mix(vTint, uFogColor, vFog), a * uOpacity);",
        "  #include <colorspace_fragment>",
        "}"
      ].join("\n")
    }));
  };

  /* A ribbon along a polyline of { x, y (north), g (ground), lift }. */
  function ribbon(paths) {
    const P = [], G = [], S = [], T = [], K = [], A = [], D = [], I = [];
    paths.forEach(function (path) {
      const pts = path.points;
      const total = pts.length > 1 ? pts[pts.length - 1].s : 1;
      const color = linear(path.color);
      pts.forEach(function (p, i) {
        const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
        const tx = b.x - a.x, tz = -(b.y - a.y), ty = (b.g - a.g) * EXAG + (b.lift - a.lift);
        const tl = Math.hypot(tx, ty, tz) || 1;
        const base = P.length / 3;
        for (let s = -1; s <= 1; s += 2) {
          P.push(p.x, p.lift, -p.y);
          G.push(p.g);
          S.push(s);
          T.push(tx / tl, ty / tl, tz / tl);
          K.push(color.r, color.g, color.b);
          A.push(p.s / total);
          D.push(path.delay || 0);
        }
        if (i > 0) I.push(base - 2, base - 1, base, base - 1, base + 1, base);
      });
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
    g.setAttribute("ground", new THREE.Float32BufferAttribute(G, 1));
    g.setAttribute("side", new THREE.Float32BufferAttribute(S, 1));
    g.setAttribute("aTan", new THREE.Float32BufferAttribute(T, 3));
    g.setAttribute("aTint", new THREE.Float32BufferAttribute(K, 3));
    g.setAttribute("along", new THREE.Float32BufferAttribute(A, 1));
    g.setAttribute("delay", new THREE.Float32BufferAttribute(D, 1));
    g.setIndex(I);
    return keep(g);
  }

  /* Points every `step` metres along a line of [x, y] (local metres). */
  function resample(line, step) {
    const out = [];
    let s = 0;
    for (let i = 0; i < line.length - 1; i++) {
      const a = line[i], b = line[i + 1];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const n = Math.max(1, Math.ceil(len / step));
      for (let k = 0; k < n; k++) {
        const t = k / n;
        out.push({ x: lerp(a[0], b[0], t), y: lerp(a[1], b[1], t), s: s + len * t });
      }
      s += len;
    }
    const last = line[line.length - 1];
    out.push({ x: last[0], y: last[1], s: s });
    return out;
  }

  /* Pistes: one coloured line per piste, sweeping down in turn. */
  const pisteLines = meta.pistes.filter(function (p) { return LEVELS[p.niveau] && p.lijn.length > 1; });
  const pistePaths = pisteLines.map(function (p, i) {
    const pts = resample(p.lijn, 6).map(function (pt) { pt.g = groundRaw(pt.x, pt.y); pt.lift = 1.2; return pt; });
    return { points: pts, color: LEVELS[p.niveau].color, delay: (i % 12) / 12 * 0.5 };
  });
  const pisteMesh = new THREE.Mesh(ribbon(pistePaths), lineMat(false, 1.5, 2.2, 0.95));
  pisteMesh.frustumCulled = false;
  pisteMesh.renderOrder = 2;
  scene.add(pisteMesh);

  /* The swept skating track on the lake (the guest's own data, passed in by
     the app): dark glassy ice between two snow banks, drawn flat on the ice
     and kept a few pixels wide at any distance. It sweeps open with the pistes. */
  const rkx = 6378137 * Math.cos(meta.origin[1] * DEG) * DEG, rky = 6378137 * DEG;
  const rinks = (options.ijsbanen || []).filter(function (b) { return b && Array.isArray(b.lijn) && b.lijn.length > 1; });
  const rinkPaths = rinks.map(function (b, i) {
    const line = b.lijn.map(function (c) { return [(c[0] - meta.origin[0]) * rkx, (c[1] - meta.origin[1]) * rky]; });
    const pts = resample(line, 30).map(function (pt) { pt.g = groundRaw(pt.x, pt.y); pt.lift = 0.5; return pt; });
    return { points: pts, delay: 0.1 + (i % 6) * 0.05 };
  });
  if (rinkPaths.length) {
    const banks = new THREE.Mesh(ribbon(rinkPaths.map(function (p) { return { points: p.points, color: "#ffffff", delay: p.delay }; })), lineMat(false, 4.2, 7, 0.95, true));
    banks.frustumCulled = false;
    banks.renderOrder = 1;
    scene.add(banks);
    const ice = new THREE.Mesh(ribbon(rinkPaths.map(function (p) { return { points: p.points, color: RINK_ICE, delay: p.delay }; })), lineMat(false, 2.4, 3.6, 1, true));
    ice.frustumCulled = false;
    ice.renderOrder = 2;
    scene.add(ice);
  }

  /* Lifts: a cable over towers, stations at both ends, chairs or hangers
     running round. Heights along the cable are smoothed like a real line. */
  const lifts = meta.liften.filter(function (l) { return l.lijn.length > 1 && LIFT_KINDS[l.soort]; }).map(function (l) {
    const pts = resample(l.lijn, 8);
    const raw = pts.map(function (p) { return groundRaw(p.x, p.y); });
    const span = l.soort === "magic_carpet" ? 0 : 6;
    pts.forEach(function (p, i) {
      let s = 0, c = 0;
      for (let k = Math.max(0, i - span); k <= Math.min(pts.length - 1, i + span); k++) { s += raw[k]; c++; }
      p.ground = raw[i];
      p.g = Math.max(s / c, raw[i] - 1);
      p.lift = LIFT_HEIGHT[l.soort];
    });
    // Ends sit on their stations.
    [0, pts.length - 1].forEach(function (i) { pts[i].g = raw[i]; });
    return { def: l, pts: pts, length: pts[pts.length - 1].s };
  });

  const cablePaths = [];
  lifts.forEach(function (lift) {
    const chair = lift.def.soort === "chair_lift" || lift.def.soort === "gondola";
    const offsets = chair ? [-2.3, 2.3] : [0];
    offsets.forEach(function (o) {
      cablePaths.push({ points: offsetPath(lift.pts, o), color: "#ef9f2f", delay: 0 });
    });
  });
  function offsetPath(pts, o) {
    if (!o) return pts;
    return pts.map(function (p, i) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
      return { x: p.x + (dy / len) * o, y: p.y - (dx / len) * o, s: p.s, g: p.g, lift: p.lift };
    });
  }
  const cableMesh = new THREE.Mesh(ribbon(cablePaths), lineMat(true, 0.75, 0.12, 0.9));
  cableMesh.frustumCulled = false;
  cableMesh.renderOrder = 3;
  cableMesh.visible = false;
  scene.add(cableMesh);

  // Towers (OpenStreetMap pylons on a lift line, otherwise every ~110 m) and stations.
  const towers = [];
  const stations = [];
  lifts.forEach(function (lift) {
    if (lift.def.soort === "magic_carpet") return;
    const pts = lift.pts;
    const near = meta.masten.filter(function (m) {
      return pts.some(function (p) { return Math.hypot(p.x - m[0], p.y - m[1]) < 9; });
    });
    const at = function (x, y) {
      let best = pts[0], bd = Infinity;
      pts.forEach(function (p) { const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = p; } });
      return best;
    };
    const spots = near.length ? near.map(function (m) { return at(m[0], m[1]); })
      : pts.filter(function (p) { return p.s > 30 && p.s < lift.length - 30 && Math.round(p.s / 8) % 14 === 0; });
    const dir = Math.atan2(pts[pts.length - 1].y - pts[0].y, pts[pts.length - 1].x - pts[0].x);
    spots.forEach(function (p) { towers.push({ x: p.x, y: p.y, base: groundRaw(p.x, p.y), top: p.g * EXAG + p.lift + 0.8, dir: dir, wide: lift.def.soort === "chair_lift" }); });
    [0, pts.length - 1].forEach(function (i) {
      stations.push({ x: pts[i].x, y: pts[i].y, base: pts[i].ground, dir: dir, big: lift.def.soort === "chair_lift" });
    });
  });

  const towerMat = keep(new THREE.MeshLambertMaterial({ color: new THREE.Color("#3b4247") }));
  const towerGeo = keep(new THREE.BoxGeometry(0.9, 1, 0.9).translate(0, 0.5, 0));
  const towerMesh = new THREE.InstancedMesh(towerGeo, towerMat, Math.max(1, towers.length));
  const armGeo = keep(new THREE.BoxGeometry(1, 0.45, 0.45));
  const armMesh = new THREE.InstancedMesh(armGeo, towerMat, Math.max(1, towers.length));
  const stationGeo = keep(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0));
  const stationMat = keep(new THREE.MeshLambertMaterial({ color: new THREE.Color("#4a3a30") }));
  const stationMesh = new THREE.InstancedMesh(stationGeo, stationMat, Math.max(1, stations.length));
  [towerMesh, armMesh, stationMesh].forEach(function (m) { m.castShadow = true; m.receiveShadow = true; m.visible = false; scene.add(m); });

  const tmp = new THREE.Object3D();
  function placeStatics(k) {
    towers.forEach(function (t, i) {
      const base = t.base * EXAG;
      tmp.position.set(t.x, base, -t.y);
      tmp.rotation.set(0, -t.dir, 0);
      tmp.scale.set(1, Math.max(0.01, (t.top - base) * k), 1);
      tmp.updateMatrix();
      towerMesh.setMatrixAt(i, tmp.matrix);
      tmp.position.set(t.x, base + (t.top - base) * k, -t.y);
      tmp.rotation.set(0, -t.dir + Math.PI / 2, 0);
      tmp.scale.set((t.wide ? 5.6 : 2) * Math.max(k, 0.01), 1, 1);
      tmp.updateMatrix();
      armMesh.setMatrixAt(i, tmp.matrix);
    });
    stations.forEach(function (s, i) {
      tmp.position.set(s.x, s.base * EXAG - 1, -s.y);
      tmp.rotation.set(0, -s.dir, 0);
      tmp.scale.set(s.big ? 14 : 6, Math.max(0.01, (s.big ? 7 : 3.5) * k), s.big ? 9 : 4.5);
      tmp.updateMatrix();
      stationMesh.setMatrixAt(i, tmp.matrix);
    });
    towerMesh.instanceMatrix.needsUpdate = true;
    armMesh.instanceMatrix.needsUpdate = true;
    stationMesh.instanceMatrix.needsUpdate = true;
  }

  /* Chairs and hangers going round: up on one side, down on the other. */
  const riders = [];
  lifts.forEach(function (lift) {
    const kind = lift.def.soort;
    if (kind === "magic_carpet" || lift.length < 40) return;
    const chair = kind === "chair_lift" || kind === "gondola";
    const spacing = chair ? 26 : 16;
    const up = offsetPath(lift.pts, chair ? 2.3 : 0);
    const down = offsetPath(lift.pts, chair ? -2.3 : 0).slice().reverse().map(function (p) {
      return { x: p.x, y: p.y, g: p.g, lift: p.lift, s: lift.length - p.s };
    });
    const count = Math.floor((2 * lift.length) / spacing);
    for (let i = 0; i < count; i++) riders.push({ lift: lift, up: up, down: down, chair: chair, offset: i * spacing, speed: chair ? 4.6 : 3 });
  });
  const chairGeo = keep(new THREE.BoxGeometry(2.2, 0.7, 1));
  const hangerGeo = keep(new THREE.BoxGeometry(0.3, 2.4, 0.3));
  const chairMat = keep(new THREE.MeshLambertMaterial({ color: new THREE.Color("#2b3236") }));
  const chairs = riders.filter(function (r) { return r.chair; });
  const hangers = riders.filter(function (r) { return !r.chair; });
  const chairMesh = new THREE.InstancedMesh(chairGeo, chairMat, Math.max(1, chairs.length));
  const hangerMesh = new THREE.InstancedMesh(hangerGeo, chairMat, Math.max(1, hangers.length));
  chairMesh.count = chairs.length;
  hangerMesh.count = hangers.length;
  [chairMesh, hangerMesh].forEach(function (m) { m.visible = false; m.frustumCulled = false; scene.add(m); });

  function pointOn(path, s) {
    let lo = 0, hi = path.length - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (path[mid].s <= s) lo = mid; else hi = mid; }
    const a = path[lo], b = path[hi];
    const t = clamp((s - a.s) / Math.max(b.s - a.s, 0.001), 0, 1);
    return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), h: lerp(a.g, b.g, t) * EXAG + lerp(a.lift, b.lift, t), dir: Math.atan2(b.y - a.y, b.x - a.x) };
  }
  function placeRiders(time) {
    [[chairs, chairMesh, 2.4], [hangers, hangerMesh, 1.6]].forEach(function (set) {
      set[0].forEach(function (r, i) {
        const L = r.lift.length;
        const s = (r.offset + time * r.speed) % (2 * L);
        const p = s < L ? pointOn(r.up, s) : pointOn(r.down, s - L);
        tmp.position.set(p.x, p.h - set[2], -p.y);
        tmp.rotation.set(0, -p.dir, 0);
        tmp.scale.set(1, 1, 1);
        tmp.updateMatrix();
        set[1].setMatrixAt(i, tmp.matrix);
      });
      set[1].instanceMatrix.needsUpdate = true;
    });
  }

  /* Buildings: walls of dark wood, snow on the roofs. */
  const buildingMesh = (function () {
    const P = [], N = [], C = [];
    const wall = linear("#5b4232"), wallLight = linear("#6e5240"), roof = linear("#f1f5f8");
    meta.gebouwen.forEach(function (b, bi) {
      let ring = b.ring;
      if (ring.length < 3) return;
      let area = 0;
      for (let i = 0; i < ring.length; i++) {
        const p = ring[i], q2 = ring[(i + 1) % ring.length];
        area += p[0] * q2[1] - q2[0] * p[1];
      }
      if (area < 0) ring = ring.slice().reverse();
      let base = Infinity;
      ring.forEach(function (p) { base = Math.min(base, groundRaw(p[0], p[1])); });
      base = base * EXAG - 1.5;
      const height = b.h || ({ barn: 7, industrial: 8, roof: 4, house: 6.5, detached: 6.5, residential: 9 }[b.soort] || 6.5) + (bi % 3);
      const top = base + 1.5 + height;
      const col = bi % 2 ? wall : wallLight;
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i], c = ring[(i + 1) % ring.length];
        const nx = c[1] - a[1], ny = -(c[0] - a[0]), nl = Math.hypot(nx, ny) || 1;
        const n = [nx / nl, 0, -ny / nl];
        const v = [[a[0], base, -a[1]], [c[0], base, -c[1]], [c[0], top, -c[1]], [a[0], top, -a[1]]];
        [[0, 1, 2], [0, 2, 3]].forEach(function (t) {
          t.forEach(function (k) { P.push(v[k][0], v[k][1], v[k][2]); N.push(n[0], n[1], n[2]); C.push(col.r, col.g, col.b); });
        });
      }
      const contour = ring.map(function (p) { return new THREE.Vector2(p[0], p[1]); });
      THREE.ShapeUtils.triangulateShape(contour, []).forEach(function (t) {
        // Facing up in the 3D world (x, -y): counter-clockwise on the map.
        const a = ring[t[0]], b2 = ring[t[1]], c = ring[t[2]];
        if ((b2[0] - a[0]) * (c[1] - a[1]) - (b2[1] - a[1]) * (c[0] - a[0]) < 0) t = [t[0], t[2], t[1]];
        t.forEach(function (k) { P.push(ring[k][0], top, -ring[k][1]); N.push(0, 1, 0); C.push(roof.r, roof.g, roof.b); });
      });
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(N, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(C, 3));
    keep(g);
    const m = new THREE.Mesh(g, keep(new THREE.MeshLambertMaterial({ vertexColors: true })));
    m.castShadow = true;
    m.receiveShadow = true;
    m.visible = false;
    return m;
  })();
  scene.add(buildingMesh);

  /* Labels -------------------------------------------------------------------
     Piste numbers in their colour, lift letters, the two tops with a lift
     station. Hidden behind the mountain, and when they would overlap. */
  const labels = [];
  (function () {
    const byRef = {};
    pisteLines.forEach(function (p) {
      if (!p.ref) return;
      let len = 0;
      for (let i = 1; i < p.lijn.length; i++) len += Math.hypot(p.lijn[i][0] - p.lijn[i - 1][0], p.lijn[i][1] - p.lijn[i - 1][1]);
      if (!byRef[p.ref] || byRef[p.ref].len < len) byRef[p.ref] = { p: p, len: len };
    });
    Object.keys(byRef).sort(function (a, b) { return Number(a) - Number(b); }).forEach(function (ref) {
      const p = byRef[ref].p;
      const pts = resample(p.lijn, 5);
      const mid = pts[Math.floor(pts.length * 0.42)];
      const lvl = LEVELS[p.niveau];
      labels.push({
        kind: "piste", x: mid.x, y: mid.y, lift: 7, text: ref, color: lvl.color, prio: 1,
        info: "Piste " + ref + (p.naam ? " · " + p.naam : "") + " · " + lvl.name.toLowerCase() + " (" + lvl.text + ")"
      });
    });
    // One label per lift letter, or per lift name where the lifts have no letters.
    const liftsByKey = {};
    lifts.forEach(function (l) {
      const key = l.def.ref || l.def.naam;
      if (key && !liftsByKey[key]) liftsByKey[key] = l;
    });
    Object.keys(liftsByKey).sort().forEach(function (key) {
      const l = liftsByKey[key];
      const ref = l.def.ref;
      const p = l.pts[Math.min(l.pts.length - 1, 2)];
      labels.push({
        kind: "lift", x: p.x, y: p.y, lift: 14, text: ref || "", prio: 2,
        info: (ref ? "Lift " + ref + (l.def.naam ? " · " + l.def.naam : "") : l.def.naam) + " · " + LIFT_KINDS[l.def.soort].toLowerCase()
      });
    });
    meta.toppen.forEach(function (t) {
      const station = lifts.some(function (l) {
        const e = l.pts[l.pts.length - 1];
        return Math.hypot(e.x - t.xy[0], e.y - t.xy[1]) < 220;
      });
      if (!station) return;
      labels.push({ kind: "top", x: t.xy[0], y: t.xy[1], lift: 26, text: t.naam, prio: 3, info: t.naam + (t.ele ? " · " + t.ele + " m" : "") });
    });
    if (def.lake) {
      labels.push({
        kind: "top", x: def.lake.at[0], y: def.lake.at[1], lift: 30, text: def.lake.naam, prio: 4,
        info: def.lake.naam + (rinks.length ? " · hier ligt de geveegde schaatsbaan" : "")
      });
    }
    labels.forEach(function (l, i) {
      const node = el("span", "rg3d-label rg3d-label--" + l.kind, l.text);
      if (l.color) node.style.setProperty("--c", l.color);
      node.style.setProperty("--d", (i % 14) * 45 + "ms");
      node.dataset.index = String(i);
      labelLayer.appendChild(node);
      l.node = node;
      l.shown = false;
    });
  })();

  // The same, as text for screen readers.
  (function () {
    const lh = el("h3", null, "Liften");
    const ll = el("ul");
    labels.filter(function (l) { return l.kind === "lift"; }).forEach(function (l) { ll.appendChild(el("li", null, l.info)); });
    const ph = el("h3", null, "Pistes");
    const pl = el("ul");
    labels.filter(function (l) { return l.kind === "piste"; }).forEach(function (l) { pl.appendChild(el("li", null, l.info)); });
    list.appendChild(lh); list.appendChild(ll); list.appendChild(ph); list.appendChild(pl);
    if (rinks.length) {
      const rh = el("h3", null, "Geveegde schaatsbaan op de " + (def.lake ? def.lake.naam : "het meer"));
      const rl = el("ul");
      rinks.forEach(function (b) { if (b.naam) rl.appendChild(el("li", null, b.naam)); });
      list.appendChild(rh); list.appendChild(rl);
    }
  })();

  let labelsOn = false;
  let labelTick = 0;
  const vec = new THREE.Vector3();
  function updateLabels(force) {
    if (!labelsOn) return;
    if (!force && (labelTick++ % 3)) {
      // Only the positions in between the visibility checks.
      labels.forEach(function (l) { if (l.shown) moveLabel(l); });
      return;
    }
    const placed = [];
    const W = root.clientWidth, H = root.clientHeight;
    labels.slice().sort(function (a, b) { return b.prio - a.prio; }).forEach(function (l) {
      const ok = moveLabel(l) && visibleFrom(l) && l.sx > -20 && l.sx < W + 20 && l.sy > 60 && l.sy < H + 20;
      let free = ok;
      if (ok) {
        const w = l.kind === "top" ? l.text.length * 8 + 18 : 26, h = 24;
        const box = [l.sx - w / 2, l.sy - h, l.sx + w / 2, l.sy];
        free = !placed.some(function (b) { return box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1]; });
        if (free) placed.push(box);
      }
      if (free !== l.shown) {
        l.shown = free;
        l.node.classList.toggle("is-zichtbaar", free);
      }
    });
  }
  function moveLabel(l) {
    vec.set(l.x, groundY(l.x, l.y) + l.lift, -l.y);
    vec.project(camera);
    if (vec.z > 1) return false;
    l.sx = (vec.x * 0.5 + 0.5) * root.clientWidth;
    l.sy = (-vec.y * 0.5 + 0.5) * root.clientHeight;
    l.node.style.transform = "translate3d(" + l.sx.toFixed(1) + "px," + l.sy.toFixed(1) + "px,0)";
    return true;
  }
  /* Is the line from the camera to the label free of the mountain? */
  function visibleFrom(l) {
    const tx = l.x, ty = l.y, th = groundY(l.x, l.y) + l.lift;
    const cx = camera.position.x, cy = -camera.position.z, ch = camera.position.y;
    for (let i = 1; i < 14; i++) {
      const t = i / 14;
      const x = lerp(tx, cx, t), y = lerp(ty, cy, t), h = lerp(th, ch, t);
      if (groundY(x, y) > h + 2) return false;
    }
    return true;
  }
  labelLayer.addEventListener("click", function (e) {
    const node = e.target.closest(".rg3d-label");
    if (!node) return;
    showInfo(labels[Number(node.dataset.index)].info);
  });
  let infoTimer = 0;
  function showInfo(text) {
    info.textContent = text;
    info.classList.add("is-zichtbaar");
    window.clearTimeout(infoTimer);
    infoTimer = window.setTimeout(function () { info.classList.remove("is-zichtbaar"); }, 4200);
  }

  /* Camera ------------------------------------------------------------------ */
  const controls = new OrbitControls(camera, canvas);
  controls.enabled = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.rotateSpeed = 0.55;
  controls.zoomSpeed = 0.9;
  controls.panSpeed = 0.8;
  controls.screenSpacePanning = false;
  controls.minDistance = 160;
  controls.maxDistance = 9000;
  controls.minPolarAngle = 8 * DEG;
  controls.maxPolarAngle = 80 * DEG;
  controls.autoRotateSpeed = -0.32;     // a full circle in about three minutes

  function poseCamera(p) {
    const ty = p.ty != null ? p.ty : groundY(p.x, p.y) + (p.lift || 0);
    const target = new THREE.Vector3(p.x, ty, -p.y);
    const theta = p.theta, phi = p.polar;
    camera.position.set(
      target.x + p.dist * Math.sin(phi) * Math.sin(theta),
      target.y + p.dist * Math.cos(phi),
      target.z + p.dist * Math.sin(phi) * Math.cos(theta)
    );
    camera.fov = p.fov;
    camera.updateProjectionMatrix();
    camera.lookAt(target);
    controls.target.copy(target);
  }

  // Seen from far above (the start, where the map left off) the haze stays as thin as
  // from 11 km, so the view does not start out milky.
  function fogFor(dist) {
    const d = FOG_DENSITY * Math.min(1, 11000 / dist);
    scene.fog.density = d;
    U.uFogDensity.value = d;
  }

  // Where the live map left off (MapLibre: same field of view, flat ground).
  const origin = meta.origin;
  const kx = 6378137 * Math.cos(origin[1] * DEG) * DEG, ky = 6378137 * DEG;
  function startPose() {
    const f = options.from;
    if (!f || !f.center) return null;
    const mpp = (40075016.686 * Math.cos(f.center[1] * DEG)) / (512 * Math.pow(2, f.zoom));
    return {
      x: (f.center[0] - origin[0]) * kx, y: (f.center[1] - origin[1]) * ky, ty: 0,
      // Same scale as the map, so the 3D view lies exactly on it; never so far out that the edge of the data shows.
      dist: Math.min(26000, (0.5 / Math.tan((MAP_FOV / 2) * DEG)) * (f.height || window.innerHeight) * mpp),
      polar: Math.max(f.pitch || 0, 0.5) * DEG, theta: -(f.bearing || 0) * DEG, fov: MAP_FOV
    };
  }
  function heroPose() {
    // Asked before the view is on the page: the window has the same shape.
    const portrait = (root.clientWidth || window.innerWidth) < (root.clientHeight || window.innerHeight);
    const v = (portrait && def.portrait) || def.view;
    return {
      x: v.target[0], y: v.target[1], lift: v.lift || 0, dist: v.dist * (portrait ? 0.95 : 1), polar: v.polar * DEG,
      theta: -v.bearing * DEG, fov: portrait ? 56 : 42
    };
  }

  /* Size ------------------------------------------------------------------- */
  function resize() {
    const w = root.clientWidth || window.innerWidth, h = root.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    U.uPx.value = (2 * Math.tan((camera.fov / 2) * DEG)) / h;
  }
  window.addEventListener("resize", resize);

  /* Motion ------------------------------------------------------------------ */
  let raf = 0, t0 = 0, last = 0, closing = null, intro = motion, paused = !motion, lastInput = 0, shadowFrames = 6;
  let clock = 0;           // time the chairs have run
  let introFrames = 0;
  const speed = { frames: 0, time: 0, step: 0 };   // after the intro: lighter if the device is slow
  const hero = heroPose();
  let from = hero;
  // The intro starts where the live map is (options.from), turning the shortest way round.
  function aim() {
    const start = startPose();
    from = motion && start ? start : hero;
    if (motion && start) {
      let d = hero.theta - from.theta;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      hero.theta = from.theta + d;
    }
  }
  aim();

  /* The way in: one curve from where the live map is (from) to the view of the
     piste map (hero), in seconds since it set off. The live map flies the first
     part of it (mapPose) and the 3D view, laid exactly over the map, carries on
     along the same curve: speed and direction run on, no jolt where they meet.
     Zoom and the move to the mountain go fast first and settle slowly; tilt a
     little softer; the turn starts gently. */
  const WAY_IN = 2.4;
  let wayStart = 0;        // when the way in set off (performance.now), see begin()
  function along(t) {
    const k = clamp(t / WAY_IN, 0, 1);
    const kd = 1 - Math.pow(1 - k, 4), kp = 1 - (1 - k) * (1 - k), kb = 0.5 - 0.5 * Math.cos(Math.PI * k);
    const tyFrom = from.ty != null ? from.ty : groundY(from.x, from.y);
    return {
      x: lerp(from.x, hero.x, kd), y: lerp(from.y, hero.y, kd),
      ty: lerp(tyFrom, groundY(hero.x, hero.y) + hero.lift, kd),
      dist: Math.exp(lerp(Math.log(from.dist), Math.log(hero.dist), kd)),
      polar: lerp(from.polar, hero.polar, kp), theta: lerp(from.theta, hero.theta, kb),
      fov: lerp(from.fov, hero.fov, kd)   // with the distance, so the zoom never turns back
    };
  }
  // The same point on the way in as a MapLibre camera: same spot, tilt and turn,
  // and the same ground scale in the middle of the view.
  function mapPose(t) {
    const p = along(t);
    const lat = origin[1] + p.y / ky;
    const h = (options.from && options.from.height) || window.innerHeight;
    const mpp = (2 * p.dist * Math.tan((p.fov / 2) * DEG)) / h;
    return {
      center: [origin[0] + p.x / kx, lat],
      zoom: Math.log2((40075016.686 * Math.cos(lat * DEG)) / (512 * mpp)),
      pitch: p.polar / DEG, bearing: -p.theta / DEG
    };
  }

  function setPaused(on) {
    paused = on;
    controls.autoRotate = !on && !intro;
    pauseBtn.innerHTML = on
      ? '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5.5v13l11-6.5z" /></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></svg>';
    pauseBtn.appendChild(el("span", "rg3d__sr-text", on ? "Beweging starten" : "Beweging pauzeren"));
  }
  pauseBtn.addEventListener("click", function () { setPaused(!paused); });

  controls.addEventListener("start", function () { controls.autoRotate = false; lastInput = performance.now(); });
  controls.addEventListener("end", function () { lastInput = performance.now(); });

  function finishIntro() {
    intro = false;
    U.uExag.value = EXAG; U.uRise.value = 1; U.uGrow.value = 2; U.uSweep.value = 2;
    fogFor(hero.dist);
    placeStatics(1);
    controls.enabled = true;
    controls.update();
    setPaused(paused);
    shadowFrames = 2;
  }

  function lighten() {
    speed.step++;
    if (speed.step === 1 && renderer.getPixelRatio() > 1) {
      renderer.setPixelRatio(1);
      resize();
    } else {
      treeGeo.instanceCount = Math.floor(trees.length * 0.55);
      shadowFrames = 2;
      speed.step = 2;
    }
  }

  function showStatics(on) {
    [cableMesh, towerMesh, armMesh, stationMesh, buildingMesh, chairMesh, hangerMesh].forEach(function (m) { m.visible = on; });
  }

  function frame(now) {
    raf = window.requestAnimationFrame(frame);
    if (!t0) { t0 = now; last = now; }
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const t = (now - t0) / 1000;
    if (U.uSatOn.value !== satTarget) {
      const k = reduceMotion ? 1 : dt * 2.4;
      U.uSatOn.value = satTarget > U.uSatOn.value ? Math.min(satTarget, U.uSatOn.value + k) : Math.max(satTarget, U.uSatOn.value - k);
    }

    if (closing) {
      const k = clamp((now - closing.t0) / closing.ms, 0, 1);
      const e = easeInOut(k);
      U.uExag.value = lerp(closing.exag, 0, e);
      U.uRise.value = U.uExag.value / EXAG;
      const dist = Math.exp(lerp(Math.log(closing.a.dist), Math.log(closing.b.dist), e));
      fogFor(dist);
      poseCamera({
        x: lerp(closing.a.x, closing.b.x, e), y: lerp(closing.a.y, closing.b.y, e), ty: lerp(closing.a.ty, 0, e),
        dist: dist,
        polar: lerp(closing.a.polar, closing.b.polar, e), theta: lerp(closing.a.theta, closing.b.theta, e),
        fov: lerp(closing.a.fov, closing.b.fov, e)
      });
      U.uPx.value = (2 * Math.tan((camera.fov / 2) * DEG)) / (root.clientHeight || 1);
      renderer.shadowMap.needsUpdate = true;
      renderer.render(scene, camera);
      if (k >= 1) { const done = closing.done; closing = null; done(); }
      return;
    }

    if (intro) {
      // The camera carries on along the way in (the map flew the first part), and
      // meanwhile the mountain rises (0-1.3 s), the forest grows (0.15-1.45 s), the
      // pistes sweep down (0.3-1.6 s) and the lifts go up (0.6-1.4 s).
      const kr = easeInOut(clamp(t / 1.3, 0, 1));
      U.uExag.value = EXAG * kr;
      U.uRise.value = kr;
      U.uGrow.value = clamp((t - 0.15) / 1.3, 0, 1) * 1.35;
      U.uSweep.value = clamp((t - 0.3) / 1.3, 0, 1) * 1.5;
      const way = (now - wayStart) / 1000;
      const pose = along(way);
      poseCamera(pose);
      fogFor(pose.dist);
      U.uPx.value = (2 * Math.tan((camera.fov / 2) * DEG)) / (root.clientHeight || 1);
      if (t > 0.6) {
        if (!cableMesh.visible) showStatics(true);
        placeStatics(easeOut(clamp((t - 0.6) / 0.8, 0, 1)));
      }
      if (t > 1.5 && !labelsOn) { labelsOn = true; root.classList.add("toon-labels"); }
      // Shadows of the rising mountain and growing trees: every other frame is enough.
      if (++introFrames % 2) renderer.shadowMap.needsUpdate = true;
      if (t > 1.7 && way > WAY_IN) finishIntro();
    } else {
      if (!paused && !controls.autoRotate && performance.now() - lastInput > 7000) controls.autoRotate = true;
      // Keep the point we turn around on the snow, and the camera above it.
      const tx = controls.target.x, ty = -controls.target.z;
      const lim = 2100;
      if (Math.abs(tx) > lim || Math.abs(ty) > lim) {
        controls.target.x = clamp(tx, -lim, lim);
        controls.target.z = -clamp(ty, -lim, lim);
      }
      controls.target.y = lerp(controls.target.y, groundY(controls.target.x, -controls.target.z) + hero.lift, 0.1);
      controls.update(dt);
      const floor = groundY(camera.position.x, -camera.position.z) + 25;
      if (camera.position.y < floor) camera.position.y = floor;
      if (shadowFrames > 0) { renderer.shadowMap.needsUpdate = true; shadowFrames--; }
    }

    if (!intro && speed.step < 2 && dt > 0) {
      speed.frames++;
      speed.time += dt;
      if (speed.frames === 40) {
        if (speed.time / speed.frames > 0.04) lighten();
        speed.frames = 0;
        speed.time = 0;
      }
    }
    if (!paused) clock += dt;
    if (chairMesh.visible) placeRiders(clock);
    updateLabels(false);
    // Far away the depth buffer is coarse (the lake 10 to 30 km out): a nearer clip plane
    // keeps flat things like the track on the ice from flickering, and costs nothing
    // when the camera is close.
    const near = clamp(camera.position.distanceTo(controls.target) * 0.008, 8, 80);
    if (Math.abs(near - camera.near) > 0.5) { camera.near = near; camera.updateProjectionMatrix(); }
    renderer.render(scene, camera);
  }

  /* Keyboard: arrows turn and tilt, + and - zoom, Escape closes. */
  function onKey(e) {
    if (e.key === "Escape") { e.preventDefault(); requestClose(); return; }
    if (e.key === "Tab") {
      // Keep the focus inside this view.
      const stops = options.onSatellite ? [closeBtn, layerBtn, pauseBtn] : [closeBtn, pauseBtn];
      const i = stops.indexOf(document.activeElement);
      e.preventDefault();
      stops[(i + (e.shiftKey ? stops.length - 1 : 1) + stops.length) % stops.length].focus();
      return;
    }
    if (intro || closing) return;
    const step = 6 * DEG;
    const offset = camera.position.clone().sub(controls.target);
    const sph = new THREE.Spherical().setFromVector3(offset);
    let used = true;
    if (e.key === "ArrowLeft") sph.theta -= step;
    else if (e.key === "ArrowRight") sph.theta += step;
    else if (e.key === "ArrowUp") sph.phi = clamp(sph.phi - step, controls.minPolarAngle, controls.maxPolarAngle);
    else if (e.key === "ArrowDown") sph.phi = clamp(sph.phi + step, controls.minPolarAngle, controls.maxPolarAngle);
    else if (e.key === "+" || e.key === "=") sph.radius = clamp(sph.radius * 0.85, controls.minDistance, controls.maxDistance);
    else if (e.key === "-") sph.radius = clamp(sph.radius / 0.85, controls.minDistance, controls.maxDistance);
    else used = false;
    if (!used) return;
    e.preventDefault();
    controls.autoRotate = false;
    lastInput = performance.now();
    camera.position.copy(controls.target).add(offset.setFromSpherical(sph));
    camera.lookAt(controls.target);
  }
  root.tabIndex = -1;
  root.addEventListener("keydown", onKey);

  let disposed = false;
  function requestClose() {
    if (closing || disposed) return;
    if (options.onClose) options.onClose(); else close();
  }
  closeBtn.addEventListener("click", requestClose);

  canvas.addEventListener("webglcontextlost", function (e) {
    e.preventDefault();
    requestClose();
  });

  /* Close: the mountain sinks back into the map and the view fades out. */
  function close() {
    return new Promise(function (resolve) {
      if (!root.isConnected) { resolve(); return; }
      window.clearTimeout(infoTimer);
      labelsOn = false;
      root.classList.remove("toon-labels");
      controls.enabled = false;
      controls.autoRotate = false;
      showStatics(false);
      const end = function () {
        root.classList.add("is-weg");
        window.setTimeout(function () { dispose(); resolve(); }, reduceMotion ? 0 : 420);
      };
      const back = startPose();
      if (!motion || !back) { end(); return; }
      const offset = camera.position.clone().sub(controls.target);
      const sph = new THREE.Spherical().setFromVector3(offset);
      let theta = sph.theta;
      let d = back.theta - theta;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      closing = {
        t0: performance.now(), ms: 1100, exag: U.uExag.value, done: end,
        a: { x: controls.target.x, y: -controls.target.z, ty: controls.target.y, dist: sph.radius, polar: sph.phi, theta: theta, fov: camera.fov },
        b: { x: back.x, y: back.y, dist: back.dist, polar: back.polar, theta: theta + d, fov: back.fov }
      };
      if (!raf) raf = window.requestAnimationFrame(frame);
    });
  }

  function dispose() {
    disposed = true;   // forceContextLoss below fires webglcontextlost: not a new close
    window.cancelAnimationFrame(raf);
    raf = 0;
    window.removeEventListener("resize", resize);
    controls.dispose();
    [towerMesh, armMesh, stationMesh, chairMesh, hangerMesh].forEach(function (m) { m.dispose(); });
    disposables.forEach(function (d) { if (d && d.dispose) d.dispose(); });
    renderer.dispose();
    renderer.forceContextLoss();
    root.remove();
  }

  /* Go ---------------------------------------------------------------------- */
  (options.container || document.body).appendChild(root);
  resize();
  setPaused(paused);
  poseCamera(from);
  fogFor(from.dist);
  renderer.shadowMap.needsUpdate = true;
  renderer.compile(scene, camera);
  root.classList.add("is-open");

  /* With options.hold the view is built and drawn once, still invisible, and
     waits for begin(since): the map flies the first part of the way in
     meanwhile (mapPose), and the heavy first frame is already behind us when
     the 3D takes over. since: when that way in set off (performance.now). */
  let begun = false;
  function begin(since) {
    if (begun || disposed) return;
    begun = true;
    wayStart = since || performance.now();
    if (!motion) {
      poseCamera(hero);
      showStatics(true);
      labelsOn = true;
      root.classList.add("toon-labels");
      finishIntro();
    } else {
      const pose = along((performance.now() - wayStart) / 1000);
      poseCamera(pose);
      fogFor(pose.dist);
    }
    window.requestAnimationFrame(function () { root.classList.add("is-zichtbaar"); });
    raf = window.requestAnimationFrame(frame);
    closeBtn.focus({ preventScroll: true });
  }
  if (options.hold) renderer.render(scene, camera);
  else begin();

  // Where the way back out ends: where the live map was left (options.from by default).
  function returnTo(f) { options.from = f; }

  /* The guest switched the map: the satellite picture fades in (once it is
     there) or out. sat: what options.satelliet holds, or null. */
  function setSatellite(sat) {
    wantSat = !!sat;
    if (!sat) satTarget = 0;
    else if (skin) satTarget = 1;
    else {
      preloadSkin(options.scene, sat, options.version).then(function (next) {
        if (disposed || !wantSat || !next) return;
        applySkin(next);
        satTarget = 1;
        syncSatellite();
      }).catch(function () { /* stays drawn */ });
    }
    syncSatellite();
  }

  return { begin: begin, mapPose: mapPose, returnTo: returnTo, close: close, setSatellite: setSatellite, element: root, camera: camera };
}

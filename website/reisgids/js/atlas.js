/* Illustrated overview map of Sweden for the travel guide.
   Flat, hand-made look: snow-cream land with a soft offset shadow and pale
   shallows on a deep teal sea, the Gulf of Bothnia frozen over, light lakes,
   the booked provinces in their own warm colour (tap to fly in), soft
   shaded relief of the mountains, and drawings scattered over the land.
   Drawn as SVG in screen pixels (Web Mercator, like the live map) and
   rebuilt on resize.
   Four stacked layers, so a moving part only repaints its own layer:
   sea (shallows, ice), base (countries, provinces, lakes), relief and top
   (borders, drawings, names).
   Outlines: vormen/zweden.json (Natural Earth + OpenStreetMap lakes),
   vormen/omgeving.json (the countries around, Natural Earth),
   vormen/relief.webp + relief.json (relief worked out beforehand from
   Mapzen Terrain Tiles) and vormen/<region>.json (OpenStreetMap county
   outline). */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var SHAPES_URL = "/reisgids/vormen/";

  /* Drawings on the land, [lng, lat], size relative to the map width. */
  var DECOR = [
    { art: "noorderlicht", at: [20.2, 67.9], size: 0.34 },
    { art: "bergen", at: [17.0, 67.15], size: 0.2 },
    { art: "eland", at: [19.4, 65.75], size: 0.24 },
    { art: "dennen", at: [21.9, 66.55], size: 0.15 },
    { art: "bergen", at: [13.75, 63.85], size: 0.17 },
    { art: "dennen", at: [16.9, 64.35], size: 0.18 },
    { art: "stenen", at: [18.8, 64.6], size: 0.12 },
    { art: "dennen", at: [15.4, 62.95], size: 0.13 },
    { art: "dennen", at: [15.6, 57.0], size: 0.13 },
    { art: "lavvu", at: [16.2, 66.25], size: 0.15 }
  ];
  var SEA_LABELS = [
    { text: "Oostzee", at: [19.7, 55.95] },
    { text: "Botnische Golf", at: [20.9, 63.0], rotate: -62, ice: true },
    { text: "Noordzee", at: [5.4, 57.3] },
    { text: "Noorse Zee", at: [6.4, 64.7], rotate: -48 },
    { text: "Finse Golf", at: [27.4, 59.55], fi: true }
  ];
  /* Stockholm: the old-town drawing stands a little inland, the dot and name
     sit on the real spot. Arlanda: a small plane on the airport itself. */
  var CITIES = [{ naam: "Stockholm", at: [18.07, 59.33], art: "stockholm", artAt: [16.25, 58.5], artSize: 0.19 }];
  var AIRPORTS = [
    { naam: "Arlanda", at: [17.92, 59.65], art: "vliegtuig", size: 0.12 }
  ];
  var SWEDEN_BOX = [[10.9, 55.2], [24.3, 69.2]];
  /* A Swedish trip always shows the sea beyond the Norwegian coast and the
     Gulf of Bothnia up to the Finnish coast (Joey). */
  var SEA_WEST = 4.2, SEA_EAST = 23.2;
  /* ...and reaches up to the frozen bay at Luleå. */
  var NORTH_MIN = 66.4;
  /* Areas in Finland: for a Finland trip, Finland is the main country. */
  var FINNISH = ["helsinki", "punkaharju"];

  /* Every booked area gets its own colour (not one flat colour for all):
     [fill, edge, light centre of the gradient]. */
  var REGION_COLORS = {
    dalarna: ["#f2b064", "#cf7a33", "#fad9aa"],
    // The others in the Novakse colours of the logo (Joey).
    stockholm: ["#509ea5", "#245d74", "#a8d3d3"],
    norrbotten: ["#8ec5b1", "#398798", "#cbe6dc"],
    helsinki: ["#2a7188", "#1b3e51", "#7fb3c4"],
    punkaharju: ["#fbca76", "#aa692e", "#fde7bd"]
  };
  var REGION_COLOR_FALLBACK = ["#f4c97f", "#d29a41", "#fae4bb"];
  /* Every province its own tint (Joey: all a little different, and only in
     the Novakse colours): the colours of the logo and the website, mixed
     with the land colour so the map stays calm. Neighbours never share one
     (worked out in provincies.json). */
  var NOVAKSE_COLORS = [
    ["#fdde9c", 1],     // logo light yellow
    ["#8ec5b1", 1],     // logo mint
    ["#eb993b", 0.9],   // logo light orange
    ["#509ea5", 0.85],  // logo teal (a touch lighter: the land stays lighter than the sea)
    ["#d8d19c", 1],     // logo khaki
    ["#859a7a", 0.85],  // logo sage
    ["#aa692e", 0.7]    // logo brown
  ];
  var LAND_COLOR = "#f7f1e5";
  var PROVINCE_TINTS = NOVAKSE_COLORS.map(function (entry) { return mixHex(LAND_COLOR, entry[0], entry[1]); });
  /* A booked province stands up from the map like a raised tile (Joey: it
     has to jump out, a little 3D): its height relative to the map width,
     and the dark colour its side is shaded towards. */
  var SLAB_HEIGHT = 0.032;
  var SLAB_SHADE = "#0f3542";
  /* Camera tilt (perspective px, degrees) for the opening and the way back
     out of a region. The dive in stays flat (Joey 2026-10-30: the 3D goes
     away while you zoom in). */
  var PERSPECTIVE = 1500;
  var DIVE_TILT = 14;
  /* A small province gets its drawing beside it, with a dotted line to it. */
  var BADGE_ANCHOR = { stockholm: [17.75, 58.2] };
  /* A badge that would hang over a neighbour moves up inside its own area
     (fraction of the area's height). */
  var BADGE_LIFT = { punkaharju: 0.42 };
  var NEIGHBOUR_LABELS = [
    { text: "Zweden", at: [16.95, 61.95], rotate: -62, main: true },
    { text: "Noorwegen", at: [11.2, 64.1], rotate: -58 },
    { text: "Finland", at: [26.4, 63.4], rotate: 0, fiMain: true }
  ];

  /* Winter ice in the Gulf of Bothnia, the way it lies in January and
     February: the Bothnian Bay at Luleå frozen shut, and further south ice
     along both coasts with open water in the middle that widens towards
     Åland. Drawn as a band along the real coastline whose width (km) grows
     from the south to the north; north of `shut` the bay is closed. */
  var ICE = { box: [[15.4, 59.4], [27.2, 66.4]], shut: 64.4, minKm: 14, maxKm: 200, power: 3.6, step: 0.2 };
  var ICE_CRACKS = [
    [[21.0, 64.85], [21.8, 65.1], [22.6, 65.0], [23.4, 65.3]],
    [[20.2, 64.55], [21.0, 64.45], [21.5, 64.65]],
    [[22.0, 64.25], [22.4, 64.6], [23.2, 64.7], [24.0, 65.0]],
    [[19.6, 63.65], [20.3, 63.95], [20.8, 63.75]]
  ];
  var ICE_FLOES = [[19.5, 61.3], [19.9, 61.8], [20.2, 62.3], [19.2, 60.8], [20.5, 62.6], [19.7, 60.95], [19.0, 61.55]];
  /* The open side: the Norwegian Sea, the North Sea, Skagerrak and Kattegat
     stay free of ice in winter, so their coasts get no pale rim. The line
     runs over land (the mountains, Skåne, the Danish islands) and crosses
     the water only at the Øresund and the Belts. */
  var OPEN_SEA = [[-40, 45], [-40, 85], [60, 85], [60, 68.0], [28.5, 68.0], [20.0, 68.6], [18.0, 67.9], [16.5, 66.6],
    [15.0, 65.0], [13.5, 63.5], [13.5, 61.5], [13.0, 59.5], [13.5, 58.0], [13.6, 56.5], [13.2, 56.3], [12.7, 56.03],
    [12.3, 55.9], [12.1, 55.55], [11.2, 55.4], [10.4, 55.3], [9.3, 55.3], [9.3, 54.2], [10.5, 53.6], [10.5, 45]];
  /* The countries with provinces, by their name in zweden.json. */
  var COUNTRY_KEYS = { Zweden: "se", Noorwegen: "no", Finland: "fi" };


  function mercator(c) {
    return [c[0] * Math.PI / 180, -Math.log(Math.tan(Math.PI / 4 + c[1] * Math.PI / 360))];
  }

  function svg(tag, attrs, parent) {
    var node = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(node);
    return node;
  }

  function html(tag, className, text, parent) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    if (parent) parent.appendChild(node);
    return node;
  }

  /* Colour between two hex colours: t = 0 gives a, t = 1 gives b. */
  function mixHex(a, b, t) {
    return "#" + [1, 3, 5].map(function (i) {
      var ca = parseInt(a.substr(i, 2), 16), cb = parseInt(b.substr(i, 2), 16);
      return ("0" + Math.round(ca + (cb - ca) * t).toString(16)).slice(-2);
    }).join("");
  }

  /* Repeatable randomness: the same map every time it is drawn. */
  function hash(x, y) { var h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return h - Math.floor(h); }

  /* Calms a province border: drops the tiny zigzags of the source data
     (Douglas-Peucker, a few hundred metres) and rounds the corners that are
     left (Chaikin). Both ends stay put, so the lines still meet where three
     provinces touch. */
  var BORDER_TOLERANCE = 0.003;   // degrees of latitude; longitude is scaled to match
  var BORDER_BESIDE_EDGE = 0.004;  // degrees: closer than this to a booked province's own border, a drawn border is left out
  var BORDER_ROUNDING = 2;        // rounds of corner cutting
  function tidyBorder(line) {
    if (!Array.isArray(line) || line.length < 3) return line;
    var kx = Math.cos(line[Math.floor(line.length / 2)][1] * Math.PI / 180);
    var keep = [true];
    for (var i = 1; i < line.length; i++) keep.push(false);
    keep[line.length - 1] = true;
    (function split(a, b) {
      var ax = line[a][0] * kx, ay = line[a][1], dx = line[b][0] * kx - ax, dy = line[b][1] - ay;
      var len = Math.sqrt(dx * dx + dy * dy), far = -1, at = 0;
      for (var i = a + 1; i < b; i++) {
        var px = line[i][0] * kx - ax, py = line[i][1] - ay;
        var d = len ? Math.abs(px * dy - py * dx) / len : Math.sqrt(px * px + py * py);
        if (d > far) { far = d; at = i; }
      }
      if (far > BORDER_TOLERANCE) { keep[at] = true; split(a, at); split(at, b); }
    })(0, line.length - 1);
    var pts = line.filter(function (c, i) { return keep[i]; });
    for (var round = 0; round < BORDER_ROUNDING && pts.length > 2; round++) {
      var next = [pts[0]];
      for (var j = 0; j < pts.length - 1; j++) {
        var p = pts[j], q = pts[j + 1];
        next.push([p[0] * 0.75 + q[0] * 0.25, p[1] * 0.75 + q[1] * 0.25], [p[0] * 0.25 + q[0] * 0.75, p[1] * 0.25 + q[1] * 0.75]);
      }
      next.push(pts[pts.length - 1]);
      pts = next;
    }
    return pts;
  }

  function insideRing(c, ring) {
    var hit = false;
    for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      if ((ring[i][1] > c[1]) !== (ring[j][1] > c[1]) &&
          c[0] < (ring[j][0] - ring[i][0]) * (c[1] - ring[i][1]) / (ring[j][1] - ring[i][1]) + ring[i][0]) hit = !hit;
    }
    return hit;
  }

  function insideRings(c, rings) {
    var hit = false;
    rings.forEach(function (ring) { if (insideRing(c, ring)) hit = !hit; });
    return hit;
  }


  function create(options) {
    var lib = function () { return window.NovakseIllustraties || {}; };
    var root = html("div", "rg-atlas");
    root.hidden = true;
    root.setAttribute("aria-hidden", "true"); // the region buttons in the welcome card are the accessible way in
    var stage = html("div", "rg-atlas__stage", null, root);
    // The sea lives on the stage too (oversized), so it tilts with the land.
    html("div", "rg-atlas__sea-bg", null, stage);
    var seaLayer = svg("svg", { "class": "rg-atlas__layer rg-atlas__sea-layer" }, stage);
    var drawing = svg("svg", { "class": "rg-atlas__svg" }, stage);
    var land = svg("svg", { "class": "rg-atlas__layer rg-atlas__landscape" }, stage);
    // The raised tiles: small layers of their own, so they can settle onto
    // the map smoothly while the camera zooms (see slabs).
    var slabLayer = html("div", "rg-atlas__slabs", null, stage);
    var pings = html("div", "rg-atlas__pings", null, stage);
    var topLayer = svg("svg", { "class": "rg-atlas__layer rg-atlas__top" }, stage);
    // Slow cloud shadows drifting over the land.
    var weather = html("div", "rg-atlas__weather", null, stage);
    html("span", "rg-atlas__cloudshadow", null, weather);
    html("span", "rg-atlas__cloudshadow rg-atlas__cloudshadow--2", null, weather);
    var overlay = html("div", "rg-atlas__overlay", null, stage);
    // The Novakse pin in the sea, top left (no wordmark).
    var logo = html("div", "rg-atlas__logo", null, stage);
    var logoMark = html("img", "rg-atlas__logo-mark", null, logo);
    logoMark.src = "/images/logo-mark.webp"; logoMark.alt = ""; logoMark.width = 401; logoMark.height = 600;
    logoMark.decoding = "async";
    options.container.insertBefore(root, options.before || null);

    var data = { land: [], meren: [], buren: [], finland: [], merenFinland: [], provinces: [], regions: {}, omgeving: [], relief: null, grenzen: null };
    var view = null;       // last layout: { rect, project, scale }
    var fineLand = {};     // per country key: its land from the province shapes (see draw)
    var badges = {};
    var slabs = [];        // per raised tile: its parts and how high it stands (see draw)

    var ready = Promise.all([
      fetch(SHAPES_URL + "zweden.json?v=202611041215").then(function (r) { return r.ok ? r.json() : null; }),
      fetch(SHAPES_URL + "provincies.json?v=202611041240").then(function (r) { return r.ok ? r.json() : null; })
        .then(function (fc) { if (fc && Array.isArray(fc.features)) data.provinces = fc.features; })
        .catch(function () { /* the map works without province borders */ }),
      fetch(SHAPES_URL + "omgeving.json").then(function (r) { return r.ok ? r.json() : null; })
        .then(function (o) { if (o && Array.isArray(o.landen)) data.omgeving = o.landen; })
        .catch(function () { /* the map works without the countries around */ }),
      fetch(SHAPES_URL + "grenzen.json").then(function (r) { return r.ok ? r.json() : null; })
        .then(function (g) {
          if (!g) return;
          ["se", "no", "fi"].forEach(function (key) { if (Array.isArray(g[key])) g[key] = g[key].map(tidyBorder); });
          data.grenzen = g;
        })
        .catch(function () { /* the map works without province borders */ }),
      fetch(SHAPES_URL + "relief.json").then(function (r) { return r.ok ? r.json() : null; })
        .then(function (m) { if (m && isFinite(m.west) && isFinite(m.noord)) data.relief = m; })
        .catch(function () { /* the map works without relief */ }),
      Promise.all(options.regions.map(function (region) {
        return fetch(SHAPES_URL + encodeURIComponent(region.id) + ".json")
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (f) { if (f && f.geometry) data.regions[region.id] = f; })
          .catch(function () { /* region without outline still gets its badge */ });
      }))
    ]).then(function (results) {
      var se = results[0];
      if (se) {
        data.land = se.land || []; data.meren = se.meren || []; data.buren = se.buren || [];
        data.finland = se.finland || [];
        // The Finnish lakes keep their islands as extra rings: cut those out (even-odd).
        data.merenFinland = (se.merenFinland || []).map(function (lake) { lake.eo = true; return lake; });
      }
    }).catch(function () { /* no outline: the welcome card still works */ });

    function ringsOf(feature) {
      var g = feature.geometry;
      var polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
      return polys.map(function (p) { return p[0]; });
    }

    function bookedAt(c) {
      return options.regions.some(function (r) {
        var f = data.regions[r.id];
        return f && insideRings(c, ringsOf(f));
      });
    }

    function pathOf(rings, project) {
      return rings.map(function (ring) {
        return ring.map(function (c, i) {
          var p = project(c);
          return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1);
        }).join("") + "Z";
      }).join("");
    }

    /* Coastlines as open lines, split into the open side (OPEN_SEA) and the
       wintry side; each piece starts at the last point of the one before. */
    function coastsBySide(ringLists, project) {
      var out = { open: "", winter: "" };
      ringLists.forEach(function (rings) {
        rings.forEach(function (ring) {
          var side = null, last = null;
          ring.concat([ring[0]]).forEach(function (c) {
            var s = insideRing(c, OPEN_SEA) ? "open" : "winter";
            var p = project(c), xy = p[0].toFixed(1) + " " + p[1].toFixed(1);
            if (s !== side) { out[s] += "M" + (last || xy); side = s; }
            out[s] += "L" + xy;
            last = xy;
          });
        });
      });
      return out;
    }

    function centerOf(feature, project) {
      var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      ringsOf(feature).forEach(function (ring) {
        ring.forEach(function (c) {
          var p = project(c);
          minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]);
          minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]);
        });
      });
      return { x: (minX + maxX) / 2, y: (minY + maxY) / 2, w: maxX - minX, h: maxY - minY };
    }

    /* Screen point in the middle of the booked areas (or of the map). */
    function focusPoint(project) {
      var pts = [];
      options.regions.forEach(function (r) {
        var f = data.regions[r.id];
        if (f) { var c = centerOf(f, project); pts.push([c.x, c.y]); }
        else if (r.centrum) pts.push(project(r.centrum));
      });
      if (!pts.length) return [view.rect.left + view.rect.width / 2, view.rect.top + view.rect.height / 2];
      return [
        pts.reduce(function (s, p) { return s + p[0]; }, 0) / pts.length,
        pts.reduce(function (s, p) { return s + p[1]; }, 0) / pts.length
      ];
    }

    function placeArt(name, x, y, size, parent, className) {
      var markup = lib()[name];
      if (!markup) return null;
      var g = svg("g", { "class": className || "rg-atlas__art" }, parent);
      g.innerHTML = markup;
      var inner = g.querySelector("svg");
      if (!inner) return null;
      inner.setAttribute("x", (x - size / 2).toFixed(1));
      inner.setAttribute("y", (y - size / 2).toFixed(1));
      inner.setAttribute("width", size.toFixed(1));
      inner.setAttribute("height", size.toFixed(1));
      return g;
    }

    /* The part of the map to show: the booked areas with room around them
       (central Sweden for a Dalarna trip), or all of Sweden when that is
       what the areas span; always with the seas on both sides. */
    function focusBox() {
      var minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
      options.regions.forEach(function (r) {
        var f = data.regions[r.id];
        var coords = f ? [].concat.apply([], ringsOf(f)) : (r.centrum ? [r.centrum] : []);
        coords.forEach(function (c) {
          minLng = Math.min(minLng, c[0]); maxLng = Math.max(maxLng, c[0]);
          minLat = Math.min(minLat, c[1]); maxLat = Math.max(maxLat, c[1]);
        });
      });
      if (!isFinite(minLng)) return [[SEA_WEST, SWEDEN_BOX[0][1]], [SEA_EAST, SWEDEN_BOX[1][1]]];
      if (finlandMain()) {
        // A Finland trip: southern Finland around the booked areas.
        var padF = Math.max(0.8, (maxLat - minLat) * 0.25);
        return [[minLng - 2.2, Math.max(59.3, minLat - padF)], [maxLng + 1.6, maxLat + padF]];
      }
      /* Always the whole south (Joey: "zuiden wel zichtbaar"); the north
         stops a little above the most northern booked area. */
      var padLat = Math.max(0.9, (maxLat - minLat) * 0.12);
      return [
        [Math.min(SEA_WEST, minLng - 1.5), SWEDEN_BOX[0][1]],
        // East: the Finnish coast, or further when an area in Finland is booked too.
        [Math.max(SEA_EAST, hasFinnish() ? maxLng + 1.4 : maxLng + 1.5), Math.min(SWEDEN_BOX[1][1], Math.max(NORTH_MIN, maxLat + padLat))]
      ];
    }

    function hasFinnish() {
      return options.regions.some(function (r) { return FINNISH.indexOf(r.id) !== -1; });
    }
    function finlandMain() {
      return options.regions.length > 0 && options.regions.every(function (r) { return FINNISH.indexOf(r.id) !== -1; });
    }

    /* rect: the free area for the map in px, relative to the page. */
    function layout(rect) {
      var w = window.innerWidth, h = window.innerHeight;
      if (view && view.w === w && view.h === h && ["left", "top", "width", "height"].every(function (k) { return Math.abs(view.rect[k] - rect[k]) < 1; })) return;
      root.style.setProperty("--atlas-top", rect.top + "px");
      root.style.setProperty("--atlas-left", rect.left + "px");
      [seaLayer, drawing, land, topLayer].forEach(function (layer) {
        layer.setAttribute("width", w);
        layer.setAttribute("height", h);
        layer.setAttribute("viewBox", "0 0 " + w + " " + h);
      });

      var box = focusBox();
      var a = mercator(box[0]), b = mercator(box[1]);
      var minX = a[0], maxX = b[0], minY = b[1], maxY = a[1];
      var pad = Math.min(rect.width, rect.height) * 0.04;
      var scale = Math.min((rect.width - pad * 2) / (maxX - minX), (rect.height - pad * 2) / (maxY - minY));
      var offX = rect.left + (rect.width - (maxX - minX) * scale) / 2;
      // Spare height goes to the north (Sápmi, the frozen bay), not to the
      // countries south of the Baltic.
      var offY = rect.top + rect.height - pad - (maxY - minY) * scale;
      var project = function (c) {
        var m = mercator(c);
        return [offX + (m[0] - minX) * scale, offY + (m[1] - minY) * scale];
      };
      /* Drawing sizes follow Sweden's width on screen, capped so a close-up
         view does not blow the drawings up. */
      var sw = mercator(SWEDEN_BOX[0]), ne = mercator(SWEDEN_BOX[1]);
      var mapW = Math.min((ne[0] - sw[0]) * scale, 380);
      var unproject = function (p) {
        var mx = (p[0] - offX) / scale + minX, my = (p[1] - offY) / scale + minY;
        return [mx * 180 / Math.PI, (2 * Math.atan(Math.exp(-my)) - Math.PI / 2) * 180 / Math.PI];
      };
      view = { rect: rect, project: project, unproject: unproject, scale: scale, mapW: mapW, w: w, h: h };
      wholePicture = null;
      source = null;
      draw();
    }

    function clear(layer) { while (layer.firstChild) layer.removeChild(layer.firstChild); }

    function draw() {
      if (!view) return;
      var project = view.project, mapW = view.mapW;
      [seaLayer, drawing, land, slabLayer, topLayer].forEach(clear);
      overlay.textContent = "";
      pings.textContent = "";

      var defs = svg("defs", {}, drawing);
      var fiMain = finlandMain() && data.finland.length;
      var mainRings = fiMain ? data.finland : data.land;
      var clip = svg("clipPath", { id: "rg-atlas-land" }, defs);
      var landPath = pathOf(mainRings, project);
      svg("path", { d: landPath }, clip);
      // Booked areas abroad (Finland on a mixed trip) are clipped to that coast too.
      if (hasFinnish() && !fiMain && data.finland.length) svg("path", { d: pathOf(data.finland, project) }, clip);

      var shadowShift = Math.max(4, mapW * 0.022);
      var neighbours = data.buren.filter(function (b) { return !(fiMain && b.naam === "Finland"); });
      if (fiMain) neighbours.push({ naam: "Zweden", ringen: data.land });
      var neighbourPaths = neighbours.map(function (country) { return pathOf(country.ringen, project); });
      var aroundPaths = data.omgeving.map(function (country) { return pathOf(country.ringen, project); });

      /* Sea layer: pale shallows along the wintry coasts (Baltic, Gulf of
         Bothnia), only a deep glow along the open sea in the west, then the
         ice in the Gulf of Bothnia (it covers the shallows there). */
      var coasts = coastsBySide(data.omgeving.concat(neighbours).map(function (c) { return c.ringen; }).concat([mainRings]), project);
      var shallows = svg("g", { "class": "rg-atlas__shallows" }, seaLayer);
      [[0.1, 0.09], [0.055, 0.13], [0.024, 0.22]].forEach(function (band) {
        var width = Math.max(4, mapW * band[0]).toFixed(1);
        if (coasts.winter) svg("path", { d: coasts.winter, "stroke-width": width, "stroke-opacity": band[1] }, shallows);
        if (coasts.open) svg("path", { d: coasts.open, "class": "rg-atlas__shallows-open", "stroke-width": width, "stroke-opacity": band[1] }, shallows);
      });
      drawIce();

      /* Base layer: the countries around, Norway and Finland (quieter), then
         the main country with its soft offset shadow. Sweden, Norway and
         Finland are filled with their finer province shapes, cut off at the
         coast: the coarse outline fills the fjords, which then showed up as
         pale slivers (like ice) between the provinces. The coarse outline
         still draws the coast line. */
      var norwayRings = (data.buren.filter(function (b) { return b.naam === "Noorwegen"; })[0] || {}).ringen || [];
      var countries = { se: data.land, no: norwayRings, fi: data.finland };
      var mainLand = fiMain ? "fi" : "se";
      fineLand = {};
      Object.keys(countries).forEach(function (key) {
        if (countries[key].length) svg("path", { d: pathOf(countries[key], project) }, svg("clipPath", { id: "rg-atlas-land-" + key }, defs));
      });
      /* The provinces are cut off at the coast of all three countries together:
         the borders between the countries come from the provinces themselves
         (OpenStreetMap), not from the coarser outline of each country. */
      var allLand = svg("clipPath", { id: "rg-atlas-land-all" }, defs);
      Object.keys(countries).forEach(function (key) {
        if (countries[key].length) svg("path", { d: pathOf(countries[key], project) }, allLand);
      });
      data.provinces.forEach(function (f) {
        var key = (f.properties || {}).land;
        if (countries[key] && countries[key].length) fineLand[key] = (fineLand[key] || "") + pathOf(ringsOf(f), project);
      });
      var shift = "translate(" + shadowShift * 0.6 + " " + shadowShift + ")";
      function drawCountry(d, key, fillClass, shadowClass) {
        if (!fineLand[key]) {
          svg("path", { d: d, "class": shadowClass, transform: shift }, drawing);
          svg("path", { d: d, "class": fillClass }, drawing);
          return;
        }
        var cut = "url(#rg-atlas-land-" + key + ")";
        svg("path", { d: fineLand[key], "class": shadowClass, transform: shift, "clip-path": cut }, drawing);
        svg("path", { d: fineLand[key], "class": fillClass + " rg-atlas__fill", "clip-path": cut }, drawing);
        /* The coast line is for the sea only: where the coarse outline of this
           country runs over the land of another country (the border between
           them, now set by the provinces), it stays out. */
        var others = Object.keys(countries).filter(function (other) { return other !== key && countries[other].length; });
        var line = svg("path", { d: d, "class": fillClass + " rg-atlas__coastline" }, drawing);
        if (others.length) {
          var maskId = "rg-atlas-coast-" + key;
          var mask = svg("mask", { id: maskId, maskUnits: "userSpaceOnUse", x: -20000, y: -20000, width: 40000, height: 40000 }, defs);
          svg("rect", { x: -20000, y: -20000, width: 40000, height: 40000, fill: "#fff" }, mask);
          others.forEach(function (other) { svg("path", { d: pathOf(countries[other], project), fill: "#000" }, mask); });
          line.setAttribute("mask", "url(#" + maskId + ")");
        }
      }
      aroundPaths.forEach(function (d) { drawCountry(d, null, "rg-atlas__buur", "rg-atlas__shadow rg-atlas__shadow--buur"); });
      neighbours.forEach(function (country, i) {
        drawCountry(neighbourPaths[i], COUNTRY_KEYS[country.naam], "rg-atlas__buur", "rg-atlas__shadow rg-atlas__shadow--buur");
      });
      drawCountry(landPath, mainLand, "rg-atlas__land", "rg-atlas__shadow");

      /* The provinces of Sweden, Norway and Finland, each in its own soft
         tint, clipped to their country's coast (the neighbours a touch
         lighter, so the main country still leads). Then the booked ones in
         their own colour, clipped to the coast. */
      var bookedIds = options.regions.map(function (r) { return r.id; });
      // Twice the biggest gap between the two borders (about 5 km), in pixels.
      var bleedWidth = function () {
        var a = project([15, 61]), b = project([15, 61.1]);
        return Math.max(2, Math.hypot(a[0] - b[0], a[1] - b[1]));
      };
      Object.keys(countries).forEach(function (land) {
        if (!countries[land].length) return;
        var clipId = "rg-atlas-land-all";
        var group = svg("g", { "class": "rg-atlas__provinces" + (land === mainLand ? "" : " rg-atlas__provinces--buur"), "clip-path": "url(#" + clipId + ")" }, drawing);
        data.provinces.forEach(function (f) {
          var pr = f.properties || {};
          if (pr.land !== land || bookedIds.indexOf(pr.id) !== -1) return;
          var tint = PROVINCE_TINTS[(pr.tint || 0) % PROVINCE_TINTS.length];
          // The stroke in the same colour closes hairline seams between pieces.
          svg("path", { d: pathOf(ringsOf(f), project), "class": "rg-atlas__province", fill: tint, stroke: tint }, group);
        });
        /* The provinces of Sweden and Norway come from the same source as the
           tile of a booked province (OpenStreetMap), so they meet exactly.
           The Finnish ones are Natural Earth, a few km beside the border of
           a tile in Sweden (Norrbotten): where the two do not meet, bare land
           showed between them as a pale strip. So along the tile's border
           they reach a little further, under the tile. */
        var bleed = land === "fi" ? bleedWidth() : 0;
        if (bleed && bookedIds.some(function (id) { return data.regions[id]; })) {
          var maskId = "rg-atlas-bleed-" + land;
          var mask = svg("mask", { id: maskId, maskUnits: "userSpaceOnUse", x: -20000, y: -20000, width: 40000, height: 40000 }, defs);
          options.regions.forEach(function (region) {
            var f = data.regions[region.id];
            if (f) svg("path", { d: pathOf(ringsOf(f), project), fill: "none", stroke: "#fff", "stroke-width": bleed.toFixed(1), "stroke-linejoin": "round" }, mask);
          });
          var reach = svg("g", { mask: "url(#" + maskId + ")" }, group);
          data.provinces.forEach(function (f) {
            var pr = f.properties || {};
            if (pr.land !== land || bookedIds.indexOf(pr.id) !== -1) return;
            var tint = PROVINCE_TINTS[(pr.tint || 0) % PROVINCE_TINTS.length];
            svg("path", { d: pathOf(ringsOf(f), project), fill: tint, stroke: tint, "stroke-width": bleed.toFixed(1), "stroke-linejoin": "round" }, reach);
          });
        }
      });
      /* A booked province stands up from the map as a raised tile, above
         the relief and the province borders: a soft shadow on the map, a
         side that darkens towards the bottom, and on top a fill that is
         lighter in the middle, with its own relief and lakes, a light sheen
         and inner rim, and its own border (drawn in during the opening).
         Every part is a small layer of its own around the tile, so the tile
         can settle onto the map while the camera zooms in (see flatten)
         without the map being painted again on every frame. */
      var lift = Math.max(6, mapW * SLAB_HEIGHT);
      var outlines = [];
      slabs = [];
      options.regions.forEach(function (region, i) {
        var f = data.regions[region.id];
        if (!f) return;
        var colors = REGION_COLORS[region.id] || REGION_COLOR_FALLBACK;
        var rings = ringsOf(f);
        var d = pathOf(rings, project);
        var foot = centerOf(f, project);
        // The box of every part: the tile with room for the lift, the shadow and the rims.
        var margin = Math.ceil(lift * 2.2 + 6);
        var box = {
          x: Math.floor(foot.x - foot.w / 2 - margin), y: Math.floor(foot.y - foot.h / 2 - lift - margin),
          w: Math.ceil(foot.w + margin * 2), h: Math.ceil(foot.h + lift + margin * 2)
        };
        var wrap = html("div", "rg-atlas__region", null, slabLayer);
        wrap.style.left = box.x + "px";
        wrap.style.top = box.y + "px";
        wrap.style.width = box.w + "px";
        wrap.style.height = box.h + "px";
        wrap.style.setProperty("--edge", colors[1]);
        // The tile rises from its own foot during the opening.
        wrap.style.transformOrigin = (foot.x - box.x).toFixed(0) + "px " + (foot.y + foot.h / 2 - box.y).toFixed(0) + "px";
        // Drawn in the coordinates of the whole map, shown for the box only.
        var part = function (className, parent) {
          return svg("svg", { "class": className, width: box.w, height: box.h, viewBox: [box.x, box.y, box.w, box.h].join(" ") }, parent || wrap);
        };

        var shadowSvg = part("rg-atlas__slab-shadow");
        var blurId = "rg-atlas-slab-blur-" + i;
        svg("feGaussianBlur", { stdDeviation: (lift * 0.7).toFixed(1) }, svg("filter", { id: blurId, x: "-15%", y: "-15%", width: "130%", height: "130%" }, svg("defs", {}, shadowSvg)));
        var shadow = svg("g", { filter: "url(#" + blurId + ")", transform: "translate(" + (lift * 0.6).toFixed(1) + " " + (lift * 0.9).toFixed(1) + ")" }, shadowSvg);
        svg("path", { d: d }, svg("g", { "clip-path": "url(#rg-atlas-land)" }, shadow));

        /* The side: slices of the shape (cut off at the coast) stacked 1px
           apart, darker below. It lies in a frame cut to its own outline, so
           while it slides down under the settling top, only the part
           between the top and the map stays in view. */
        var steps = Math.ceil(lift);
        var outline = "";
        for (var s = 0; s <= steps; s++) {
          var dy = box.y + s * lift / steps;
          outline += pathOf(rings, function (c) { var p = project(c); return [p[0] - box.x, p[1] - dy]; });
        }
        var frame = html("div", "rg-atlas__slab-frame", null, wrap);
        frame.style.webkitClipPath = frame.style.clipPath = "path('" + outline + "')";
        var sides = part("rg-atlas__slab-sides", frame);
        var shapeId = "rg-atlas-slab-" + i;
        svg("path", { d: d }, svg("g", { id: shapeId, "clip-path": "url(#rg-atlas-land)" }, svg("defs", {}, sides)));
        for (var k = 0; k < steps; k++) {
          svg("use", { href: "#" + shapeId, fill: mixHex(colors[1], SLAB_SHADE, 0.7 - 0.4 * k / steps), transform: "translate(0 " + (-k * lift / steps).toFixed(2) + ")" }, sides);
        }

        // The top: the fill, the province's own relief and lakes.
        var top = part("rg-atlas__slab-top");
        var topDefs = svg("defs", {}, top);
        var gradientId = "rg-atlas-fill-" + i;
        var gradient = svg("radialGradient", { id: gradientId, cx: "50%", cy: "42%", r: "65%" }, topDefs);
        svg("stop", { offset: "0", "stop-color": colors[2] }, gradient);
        svg("stop", { offset: "1", "stop-color": colors[0] }, gradient);
        var insideId = "rg-atlas-slab-in-" + i;
        svg("path", { d: d }, svg("clipPath", { id: insideId }, topDefs));
        var face = svg("g", { "clip-path": "url(#rg-atlas-land)" }, top);
        var fill = svg("path", { d: d, "class": "rg-atlas__region-fill", fill: "url(#" + gradientId + ")" }, face);
        var onFace = svg("g", { "clip-path": "url(#" + insideId + ")" }, face);
        var relief = reliefBox();
        if (relief) {
          relief.href = SHAPES_URL + "relief.webp";
          relief["class"] = "rg-atlas__relief";
          relief.preserveAspectRatio = "none";
          var image = svg("image", relief, onFace);
          image.addEventListener("load", function () { image.classList.add("is-geladen"); });
        }
        lakesNear(f).forEach(function (lake) {
          svg("path", { d: pathOf(lake.ringen, project), "class": "rg-atlas__lake" + (lake.eo ? " rg-atlas__lake--fi" : ""), "fill-rule": lake.eo ? "evenodd" : "nonzero" }, onFace);
        });

        // Light from the top left, and a light rim only on the inside of the
        // border: the edge of the tile catching the light.
        var shine = part("rg-atlas__slab-shine");
        var shineDefs = svg("defs", {}, shine);
        var sheenId = "rg-atlas-slab-sheen-" + i;
        var sheen = svg("linearGradient", { id: sheenId, x1: "0", y1: "0", x2: "0.35", y2: "1" }, shineDefs);
        [["0", "#fff", 0.2], ["0.45", "#fff", 0], ["1", SLAB_SHADE, 0.12]].forEach(function (stop) {
          svg("stop", { offset: stop[0], "stop-color": stop[1], "stop-opacity": stop[2] }, sheen);
        });
        var shineInside = "rg-atlas-slab-glans-" + i;
        svg("path", { d: d }, svg("clipPath", { id: shineInside }, shineDefs));
        var lit = svg("g", { "clip-path": "url(#" + shineInside + ")" }, svg("g", { "clip-path": "url(#rg-atlas-land)" }, shine));
        svg("path", { d: d, "class": "rg-atlas__slab-sheen", fill: "url(#" + sheenId + ")" }, lit);
        svg("path", { d: d, "class": "rg-atlas__region-halo" }, lit);

        var edge = part("rg-atlas__slab-edge");
        svg("path", { d: d, "class": "rg-atlas__region-edge", pathLength: "1" }, svg("g", { "clip-path": "url(#rg-atlas-land)" }, edge));

        // Top, light and border stand `lift` above the map.
        [top, shine, edge].forEach(function (node) { node.style.transform = "translateY(" + (-lift).toFixed(2) + "px)"; });
        fill.addEventListener("click", function () { options.onRegion(region.id); });
        slabs.push({ lift: lift, box: box, shadow: shadowSvg, sides: sides, top: top, shine: shine, raised: [top, shine, edge] });
        outlines.push({ d: d, edge: colors[1], center: foot });
      });

      data.meren.forEach(function (lake) {
        svg("path", { d: pathOf(lake.ringen, project), "class": "rg-atlas__lake" + (fiMain ? " rg-atlas__lake--buur" : "") }, drawing);
      });
      if (hasFinnish()) data.merenFinland.forEach(function (lake) {
        svg("path", { d: pathOf(lake.ringen, project), "class": "rg-atlas__lake rg-atlas__lake--fi", "fill-rule": "evenodd" }, drawing);
      });

      /* Top layer: sea names and the compass on the water. */
      SEA_LABELS.forEach(function (l) {
        if (l.fi && !hasFinnish()) return;
        var p = project(l.at);
        var t = svg("text", {
          x: p[0].toFixed(1), y: p[1].toFixed(1), "class": "rg-atlas__sea" + (l.ice ? " rg-atlas__sea--ijs" : ""),
          "text-anchor": "middle",
          transform: l.rotate ? "rotate(" + l.rotate + " " + p[0].toFixed(1) + " " + p[1].toFixed(1) + ")" : ""
        }, topLayer);
        t.textContent = l.text;
      });
      var compassAt = project(fiMain ? [23.3, 58.6] : [6.7, 56.5]);
      placeArt("kompas", compassAt[0], compassAt[1], Math.max(48, mapW * 0.26), topLayer, "rg-atlas__compass");

      /* A copy of each raised border that slowly pings outwards. The ping
         is its own little SVG in a layer of its own, so the browser can
         scale it as a layer instead of repainting the whole map on every
         frame. */
      outlines.forEach(function (o) {
        var pingSvg = svg("svg", { "class": "rg-atlas__region-ping", width: view.w, height: view.h, viewBox: "0 0 " + view.w + " " + view.h }, pings);
        pingSvg.style.setProperty("--edge", o.edge);
        pingSvg.style.transformOrigin = o.center.x.toFixed(0) + "px " + (o.center.y - lift).toFixed(0) + "px";
        svg("path", { d: o.d, transform: "translate(0 " + (-lift).toFixed(2) + ")" }, pingSvg);
      });

      /* The drawings pop up in a wave that starts at the booked area. */
      var focus = focusPoint(project);
      // The opening camera comes down onto the booked area.
      root.style.setProperty("--focus-x", focus[0].toFixed(0) + "px");
      root.style.setProperty("--focus-y", focus[1].toFixed(0) + "px");
      var decor = svg("g", { "class": "rg-atlas__decor" }, topLayer);
      var placed = [];
      DECOR.forEach(function (d) {
        if (fiMain) return; // the drawings belong to the Swedish landscape
        if (bookedAt(d.at)) return; // the area's own drawing stands there
        var p = project(d.at);
        var size = Math.max(20, mapW * d.size);
        var g = placeArt(d.art, p[0], p[1], size, decor);
        if (g) placed.push({ g: g, dist: Math.hypot(p[0] - focus[0], p[1] - focus[1]) });
      });

      CITIES.forEach(function (c) {
        if (c.art && !bookedAt(c.at)) {
          var a = project(c.artAt);
          var size = Math.max(26, mapW * c.artSize);
          var g = placeArt(c.art, a[0], a[1], size, decor);
          if (g) placed.push({ g: g, dist: Math.hypot(a[0] - focus[0], a[1] - focus[1]) });
        }
        var p = project(c.at);
        svg("circle", { cx: p[0].toFixed(1), cy: p[1].toFixed(1), r: 3.2, "class": "rg-atlas__city" }, topLayer);
        var t = svg("text", { x: (p[0] + 7).toFixed(1), y: (p[1] + 13).toFixed(1), "class": "rg-atlas__city-name" }, topLayer);
        t.textContent = c.naam;
      });
      AIRPORTS.forEach(function (ap) {
        if (ap.fi && !hasFinnish()) return;
        var p = project(ap.at);
        var size = Math.max(20, mapW * ap.size);
        placeArt(ap.art, p[0], p[1], size, topLayer, "rg-atlas__airport");
        var t = svg("text", { x: (p[0] + size * 0.5 + 2).toFixed(1), y: (p[1] - 2).toFixed(1), "class": "rg-atlas__city-name" }, topLayer);
        t.textContent = ap.naam;
      });
      placed.sort(function (a, b) { return a.dist - b.dist; })
        .forEach(function (item, rank) { item.g.style.setProperty("--i", rank); });

      /* Country names */
      NEIGHBOUR_LABELS.forEach(function (l) {
        var main = fiMain ? l.fiMain : l.main;
        var p = project(l.at);
        var t = svg("text", {
          x: p[0].toFixed(1), y: p[1].toFixed(1), "class": "rg-atlas__buur-name" + (main ? " rg-atlas__buur-name--main" : ""), "text-anchor": "middle",
          transform: l.rotate ? "rotate(" + l.rotate + " " + p[0].toFixed(1) + " " + p[1].toFixed(1) + ")" : ""
        }, topLayer);
        t.textContent = l.text;
      });

      /* A badge per booked region: tap to fly in */
      options.regions.forEach(function (region, i) {
        var f = data.regions[region.id];
        var center = f ? centerOf(f, project) : null;
        if (!center && region.centrum) {
          var p = project(region.centrum);
          center = { x: p[0], y: p[1] };
        }
        if (!center) return;
        // The drawing stands on the raised tile.
        if (f) center = { x: center.x, y: center.y - lift, w: center.w, h: center.h };
        var spot = center;
        if (BADGE_LIFT[region.id] && f) spot = { x: center.x, y: center.y - center.h * BADGE_LIFT[region.id] };
        if (BADGE_ANCHOR[region.id]) {
          var anchor = project(BADGE_ANCHOR[region.id]);
          spot = { x: anchor[0], y: anchor[1] };
          svg("path", {
            d: "M" + spot.x.toFixed(1) + " " + spot.y.toFixed(1) + "L" + center.x.toFixed(1) + " " + center.y.toFixed(1),
            "class": "rg-atlas__leader"
          }, topLayer);
        }
        var art = Math.max(40, Math.min(88, mapW * 0.24));
        var btn = html("button", "rg-atlas__badge", null, overlay);
        btn.type = "button";
        btn.tabIndex = -1;
        btn.dataset.region = region.id;
        btn.style.left = spot.x + "px";
        btn.style.top = spot.y + "px";
        btn.style.setProperty("--i", i);
        btn.style.setProperty("--art", art + "px");
        btn.setAttribute("aria-label", region.naam + ", tik om in te zoomen");
        var disc = html("span", "rg-atlas__badge-art", null, btn);
        disc.appendChild(options.art(region.art));
        html("span", "rg-atlas__badge-name", region.naam, btn);
        var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
        html("span", "rg-atlas__badge-hint", (canHover ? "Klik" : "Tik") + " om in te zoomen", btn);
        btn.addEventListener("click", function () { options.onRegion(region.id); });
        badges[region.id] = { el: btn, center: center, box: center };
        if (f) badges[region.id].box = centerOf(f, project);
      });

      drawRelief();
      // Borders between the provinces, the same in all three countries, on
      // top of the relief (the mountains would hide them otherwise).
      ["se", "no", "fi"].forEach(function (key) { drawBorders(key, land); });
    }


    /* The frozen Gulf of Bothnia, in the sea layer. */
    function drawIce() {
      var project = view.project;
      var b = ICE.box;
      var defs = svg("defs", {}, seaLayer);
      // Only the coasts around the gulf, cut out of the land outlines.
      var coasts = data.land.concat(data.finland);
      var d = "";
      coasts.forEach(function (ring) {
        var open = false;
        ring.concat([ring[0]]).forEach(function (c) {
          var inBox = c[0] >= b[0][0] - 0.3 && c[0] <= b[1][0] + 0.3 && c[1] >= b[0][1] - 0.3 && c[1] <= b[1][1] + 0.3;
          if (!inBox) { open = false; return; }
          var p = project(c);
          d += (open ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1);
          open = true;
        });
      });
      if (!d) return;
      svg("path", { id: "rg-ice-coast", d: d }, defs);
      var top = project([b[0][0], b[1][1]]), bottom = project([b[1][0], b[0][1]]);
      var gradient = svg("linearGradient", { id: "rg-ice-glans", gradientUnits: "userSpaceOnUse", x1: 0, y1: top[1].toFixed(0), x2: 0, y2: bottom[1].toFixed(0) }, defs);
      svg("stop", { offset: "0", "stop-color": "#f7fbfc" }, gradient);
      svg("stop", { offset: "1", "stop-color": "#e3eff2" }, gradient);

      var ice = svg("g", { "class": "rg-atlas__ice" }, seaLayer);
      var rim = svg("g", { "class": "rg-atlas__ice-rim" }, ice);
      var sheet = svg("g", { "class": "rg-atlas__ice-sheet" }, ice);
      // North of `shut` the bay is closed: one sheet of ice under the land.
      var shutTop = project([b[0][0], b[1][1]]), shutBottom = project([b[1][0], ICE.shut]);
      svg("rect", { x: shutTop[0].toFixed(1), y: shutTop[1].toFixed(1), width: (shutBottom[0] - shutTop[0]).toFixed(1), height: (shutBottom[1] - shutTop[1]).toFixed(1), fill: "url(#rg-ice-glans)" }, sheet);
      // Further south: bands along the coast, wider the further north.
      var n = 0;
      for (var lat = b[0][1]; lat < ICE.shut + 0.001; lat += ICE.step, n++) {
        var t = (lat + ICE.step / 2 - b[0][1]) / (ICE.shut - b[0][1]);
        var km = ICE.minKm + (ICE.maxKm - ICE.minKm) * Math.pow(Math.max(0, Math.min(1, t)), ICE.power);
        var px = Math.max(3, km * view.scale / (6371 * Math.cos((lat + ICE.step / 2) * Math.PI / 180)));
        var y1 = project([b[0][0], Math.min(ICE.shut, lat + ICE.step)])[1], y2 = project([b[0][0], lat])[1];
        var x1 = project([b[0][0], lat])[0], x2 = project([b[1][0], lat])[0];
        var id = "rg-ice-zone-" + n;
        var zone = svg("clipPath", { id: id }, defs);
        svg("rect", { x: x1.toFixed(1), y: (y1 - 0.5).toFixed(1), width: (x2 - x1).toFixed(1), height: (y2 - y1 + 1).toFixed(1) }, zone);
        svg("use", { href: "#rg-ice-coast", "clip-path": "url(#" + id + ")", "stroke-width": (px * 2 + 2.4).toFixed(1) }, rim);
        svg("use", { href: "#rg-ice-coast", "clip-path": "url(#" + id + ")", "stroke-width": (px * 2).toFixed(1), stroke: "url(#rg-ice-glans)" }, sheet);
      }
      // Cracks in the closed ice, and loose floes in the open water.
      ICE_CRACKS.forEach(function (line) {
        svg("path", { d: line.map(function (c, i) { var p = project(c); return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(""), "class": "rg-atlas__ice-crack" }, ice);
      });
      var r = Math.max(2.2, view.mapW * 0.011);
      ICE_FLOES.forEach(function (c, i) {
        var p = project(c), pts = [];
        for (var k = 0; k < 6; k++) {
          var a = k / 6 * Math.PI * 2 + hash(i, k);
          var rr = r * (0.65 + hash(k, i) * 0.6);
          pts.push((p[0] + Math.cos(a) * rr).toFixed(1) + " " + (p[1] + Math.sin(a) * rr * 0.7).toFixed(1));
        }
        svg("path", { d: "M" + pts.join("L") + "Z", "class": "rg-atlas__ice-floe" }, ice);
      });
    }

    function drawBorders(key, layer) {
      var lines = data.grenzen && data.grenzen[key];
      if (!Array.isArray(lines)) return;
      var project = view.project;
      var d = lines.map(function (line) {
        return line.map(function (c, i) { var p = project(c); return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join("");
      }).join("");
      svg("path", { d: d, "class": "rg-atlas__grens" }, layer);
    }

    /* Shaded relief of the mountains (worked out beforehand from real
       heights, see vormen/relief.json), only on the land, in its own layer. */
    function drawRelief() {
      var r = data.relief;
      if (!r) return;
      var project = view.project;
      var defs = svg("defs", {}, land);
      /* A mask, not a clip path: the browser merges the paths of a clip into
         one shape, where overlapping countries can cancel each other out
         (Norway went missing); painting each country white always adds up. */
      var allLand = svg("mask", { id: "rg-atlas-alland", maskUnits: "userSpaceOnUse", x: 0, y: 0, width: view.w, height: view.h }, defs);
      [data.land, data.finland].concat(data.buren.map(function (b) { return b.ringen; }), data.omgeving.map(function (o) { return o.ringen; }))
        .forEach(function (rings) { if (rings && rings.length) svg("path", { d: pathOf(rings, project), fill: "#fff" }, allLand); });
      var attrs = reliefBox();
      attrs.href = SHAPES_URL + "relief.webp";
      attrs["class"] = "rg-atlas__relief";
      attrs.mask = "url(#rg-atlas-alland)";
      attrs.preserveAspectRatio = "none";
      var image = svg("image", attrs, land);
      // Fades in once loaded (it is the heaviest part of the drawing).
      image.addEventListener("load", function () { image.classList.add("is-geladen"); });
    }

    /* Where the relief image lies on screen (null without relief). */
    function reliefBox() {
      var r = data.relief;
      if (!r) return null;
      var nw = view.project([r.west, r.noord]), se = view.project([r.oost, r.zuid]);
      return { x: nw[0].toFixed(1), y: nw[1].toFixed(1), width: (se[0] - nw[0]).toFixed(1), height: (se[1] - nw[1]).toFixed(1) };
    }

    /* The lakes that may lie in a province (their box overlaps its box). */
    function lakesNear(feature) {
      var box = [Infinity, Infinity, -Infinity, -Infinity];
      var grow = function (b, c) { b[0] = Math.min(b[0], c[0]); b[1] = Math.min(b[1], c[1]); b[2] = Math.max(b[2], c[0]); b[3] = Math.max(b[3], c[1]); };
      ringsOf(feature).forEach(function (ring) { ring.forEach(function (c) { grow(box, c); }); });
      return data.meren.concat(hasFinnish() ? data.merenFinland : []).filter(function (lake) {
        var b = [Infinity, Infinity, -Infinity, -Infinity];
        lake.ringen.forEach(function (ring) { ring.forEach(function (c) { grow(b, c); }); });
        return b[0] <= box[2] && b[2] >= box[0] && b[1] <= box[3] && b[3] >= box[1];
      });
    }

    /* The drawing as a picture, for the live map to carry on with (see
       setUnderlay in reisgids.js): the sea, the ice, the land, the
       provinces, the relief and the top of the booked tile, without names
       and drawings, and without the province borders and the tile's
       border: the live map draws those itself (see borders and edges), so
       they stay thin and sharp at every zoom. The class styles are written
       onto a copy of each layer, so the picture looks the same outside this
       page. `box` is a part of the flat drawing in screen px { x, y, w, h },
       `width` the picture width in px. Resolves to { canvas, corners }
       (lng/lat, clockwise from top left) or to null when the browser cannot
       make it. */
    var PICTURE_STYLE = ["fill", "fill-opacity", "fill-rule", "stroke", "stroke-width", "stroke-opacity", "stroke-dasharray",
      "stroke-dashoffset", "stroke-linecap", "stroke-linejoin", "visibility"];   // inherited
    var PICTURE_OWN = { opacity: "1", display: "inline", "mix-blend-mode": "normal" }; // not inherited: value -> default
    var reliefUrl = null;
    function reliefDataUrl() {
      if (!reliefUrl) {
        reliefUrl = fetch(SHAPES_URL + "relief.webp")
          .then(function (r) { return r.ok ? r.blob() : null; })
          .then(function (blob) {
            if (!blob) return null;
            return new Promise(function (resolve) {
              var reader = new FileReader();
              reader.onload = function () { resolve(reader.result); };
              reader.onerror = function () { resolve(null); };
              reader.readAsDataURL(blob);
            });
          })
          .catch(function () { return null; });
      }
      return reliefUrl;
    }
    /* The tile always lies flat on the picture (as at the end of the dive),
       and the land casts no shadow: like the 3D, that belongs to the
       overview (zoomed in it became a wide grey band in the sea). `box`:
       the part of the map a tile's own layer covers (see draw). */
    /* The drawn Finnish lakes stay out of the picture too: they are coarse, so
       under the live map they showed as pale blue where the real map has the
       islands. The live map draws the real lakes itself. */
    var PICTURE_SKIP = ["rg-atlas__grens", "rg-atlas__region-edge", "rg-atlas__shadow", "rg-atlas__lake--fi"];
    /* The relief lies in the picture once (RELIEF_ID, in its <defs>), and
       every place that shows it points there: written out for the land and
       for every tile, it made the picture several MB to read each time. */
    var RELIEF_ID = "rg-atlas-picture-relief";
    function flatCopy(layer, relief, box) {
      var copy = layer.cloneNode(true);
      var from = [layer].concat([].slice.call(layer.querySelectorAll("*")));
      var to = [copy].concat([].slice.call(copy.querySelectorAll("*")));
      var styles = from.map(function (node) { return window.getComputedStyle(node); });
      var at = new Map();
      from.forEach(function (node, i) { at.set(node, i); });
      from.forEach(function (node, i) {
        var cs = styles[i], style = "";
        // Inherited values only where they change, so a <use> still passes
        // its own colour on to the shape it shows.
        var parent = i ? styles[at.get(node.parentNode)] : null;
        PICTURE_STYLE.forEach(function (prop) {
          var v = cs.getPropertyValue(prop);
          if (!v || (parent && parent.getPropertyValue(prop) === v)) return;
          style += prop + ":" + v + ";";
        });
        var cl = node.classList;
        if (cl && PICTURE_SKIP.some(function (name) { return cl.contains(name); })) style += "display:none;";
        Object.keys(PICTURE_OWN).forEach(function (prop) {
          var v = cs.getPropertyValue(prop);
          if (v && v !== PICTURE_OWN[prop]) style += prop + ":" + v + ";";
        });
        if (node.classList && node.classList.contains("rg-atlas__relief")) {
          if (relief && sameBox(node, reliefBox())) {
            var use = document.createElementNS(NS, "use");
            use.setAttribute("href", "#" + RELIEF_ID);
            ["mask", "clip-path"].forEach(function (name) {
              if (node.hasAttribute(name)) use.setAttribute(name, node.getAttribute(name));
            });
            to[i].parentNode.replaceChild(use, to[i]);
            to[i] = use;
          } else if (relief) to[i].setAttribute("href", relief);
          else style += "display:none;";
        }
        to[i].setAttribute("style", style);
        to[i].removeAttribute("class");
      });
      var place = box || { x: 0, y: 0, w: view.w, h: view.h };
      copy.setAttribute("x", place.x);
      copy.setAttribute("y", place.y);
      copy.setAttribute("width", place.w);
      copy.setAttribute("height", place.h);
      copy.setAttribute("overflow", box ? "hidden" : "visible");
      return copy;
    }
    /* Where .rg-atlas__sea-bg lies (inset: -60% -45%), also while hidden. */
    function seaBox() {
      return { x: -0.45 * view.w, y: -0.6 * view.h, w: 1.9 * view.w, h: 2.2 * view.h };
    }
    /* The open sea (a CSS gradient on .rg-atlas__sea-bg), painted the same way. */
    function paintSea(ctx, box, k) {
      var cs = window.getComputedStyle(root);
      var sea = cs.getPropertyValue("--sea").trim() || "#2f7183", deep = cs.getPropertyValue("--sea-deep").trim() || "#1c4e5e";
      var bg = seaBox(), L = bg.x, T = bg.y, W = bg.w, H = bg.h;
      ctx.setTransform(k, 0, 0, k, -box.x * k, -box.y * k);
      ctx.fillStyle = deep;
      ctx.fillRect(box.x, box.y, box.w, box.h);
      [[0.5, 0.48, 0.5, 0.48, [[0.35, sea], [1, deep]]], [0.5, 0.47, 0.3, 0.26, [[0, "rgba(126, 190, 199, 0.32)"], [0.7, "rgba(126, 190, 199, 0)"]]]]
        .forEach(function (e) {
          ctx.save();
          ctx.translate(L + W * e[0], T + H * e[1]);
          ctx.scale(W * e[2], H * e[3]);
          var g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
          e[4].forEach(function (stop) { g.addColorStop(stop[0], stop[1]); });
          ctx.fillStyle = g;
          ctx.fillRect(-50, -50, 100, 100);
          ctx.restore();
        });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    function sameBox(node, box) {
      return !!box && ["x", "y", "width", "height"].every(function (name) {
        return Math.abs(parseFloat(node.getAttribute(name)) - parseFloat(box[name])) < 0.05;
      });
    }
    /* Whether a part of the drawing that goes into the picture is still
       coming in or changing (the opening, a fade): its styles of this moment
       must not be kept for later pictures. Endless animations (the ping,
       the bobbing badges) are not in the picture, and neither is a move
       (transform only, like the tiles settling during the dive). */
    var MOVE_ONLY = ["offset", "computedOffset", "easing", "composite", "transform", "transformOrigin"];
    function settling(layers) {
      if (!root.getAnimations) return true;
      return root.getAnimations({ subtree: true }).some(function (a) {
        var target = a.effect && a.effect.target;
        if (!target || a.playState !== "running" || !isFinite(a.effect.getComputedTiming().endTime)) return false;
        if (!layers.some(function (layer) { return layer.contains(target); })) return false;
        var keys = a.effect.getKeyframes ? a.effect.getKeyframes() : [{ other: true }];
        return keys.some(function (k) { return Object.keys(k).some(function (p) { return MOVE_ONLY.indexOf(p) === -1; }); });
      });
    }
    /* The whole drawing as one SVG image, read by the browser once and kept
       until the next layout: every picture is a part of it, drawn sharp at
       its own size (drawImage draws an SVG image as shapes, not as pixels).
       Before, every picture was written out and read again (3 MB, the
       slowest part of the dive). The image reaches well past the drawing,
       so a picture near its edge is complete too. Resolves to { img, box }
       or null. */
    var source = null;
    function sourceImage() {
      if (source && source.view === view) return source.image;
      var shot = view;
      var layers = [seaLayer, drawing, land].concat(slabs.map(function (s) { return s.top; }));
      var keep = !settling(layers);
      var image = reliefDataUrl().then(function (relief) {
        if (view !== shot) return null; // laid out again meanwhile
        var box = { x: -3 * shot.w, y: -3 * shot.h, w: 7 * shot.w, h: 7 * shot.h };
        var outer = document.createElementNS(NS, "svg");
        outer.setAttribute("width", box.w);
        outer.setAttribute("height", box.h);
        outer.setAttribute("viewBox", [box.x, box.y, box.w, box.h].join(" "));
        var rb = relief && reliefBox();
        if (rb) {
          var shared = document.createElementNS(NS, "image");
          ["x", "y", "width", "height"].forEach(function (name) { shared.setAttribute(name, rb[name]); });
          shared.setAttribute("preserveAspectRatio", "none");
          shared.setAttribute("href", relief);
          shared.setAttribute("id", RELIEF_ID);
          outer.appendChild(document.createElementNS(NS, "defs")).appendChild(shared);
        }
        [seaLayer, drawing, land].forEach(function (layer) { outer.appendChild(flatCopy(layer, relief)); });
        slabs.forEach(function (s) { outer.appendChild(flatCopy(s.top, relief, s.box)); });
        var url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(outer)], { type: "image/svg+xml" }));
        return new Promise(function (resolve) {
          var img = new Image();
          img.onload = function () { URL.revokeObjectURL(url); resolve({ img: img, box: box }); };
          img.onerror = function () { URL.revokeObjectURL(url); resolve(null); };
          img.src = url;
        });
      }).catch(function () { return null; });
      source = keep ? { view: shot, image: image } : null;
      return image;
    }
    /* `wanted` (optional): asked again right before the drawing, which runs
       on the main thread; when it says no, the picture is not made (null). */
    var pictureSafe = false;
    function picture(box, width, wanted) {
      if (!view || !window.XMLSerializer) return Promise.resolve(null);
      var shot = view;
      return sourceImage().then(function (src) {
        if (!src || view !== shot) return null;
        if (wanted && !wanted()) return null;
        var w = Math.max(1, Math.round(width)), h = Math.max(1, Math.round(width * box.h / box.w));
        var canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        var ctx = canvas.getContext("2d");
        try {
          paintSea(ctx, box, w / box.w);
          ctx.drawImage(src.img, box.x - src.box.x, box.y - src.box.y, box.w, box.h, 0, 0, w, h);
          // Throws when the browser marked it unsafe for WebGL. Once is enough:
          // reading back waits for the drawing and makes the canvas slower.
          if (!pictureSafe) { ctx.getImageData(0, 0, 1, 1); pictureSafe = true; }
        } catch (e) { canvas = null; }
        return canvas ? {
          canvas: canvas,
          corners: [[box.x, box.y], [box.x + box.w, box.y], [box.x + box.w, box.y + box.h], [box.x, box.y + box.h]].map(view.unproject)
        } : null;
      }).catch(function () { return null; });
    }
    /* A picture size within what phones handle well: at most `area` pixels
       and 4096 px on a side. */
    function pictureWidth(box, wanted, area) {
      var ratio = box.h / box.w;
      return Math.min(wanted, Math.sqrt(area / ratio), 4096, 4096 / ratio);
    }
    var wholePicture = null;

    /* See borders. A booked province has its own, exact border (see edges).
       Where the drawn border (Natural Earth, a few km off) runs along it,
       leave the drawn one out: two lines side by side look sloppy. Parts of
       the outlines that lie clearly further off than that are skipped
       without measuring (same result, a fraction of the work). */
    var bordersMade = null;
    function drawnBorders() {
      var lines = [];
      ["se", "no", "fi"].forEach(function (key) {
        var part = data.grenzen && data.grenzen[key];
        if (Array.isArray(part)) part.forEach(function (line) { lines.push(line); });
      });
      var outlines = [];
      options.regions.forEach(function (region) {
        var f = data.regions[region.id];
        if (f) ringsOf(f).forEach(function (ring) {
          var box = [Infinity, Infinity, -Infinity, -Infinity];
          ring.forEach(function (c) { box[0] = Math.min(box[0], c[0]); box[1] = Math.min(box[1], c[1]); box[2] = Math.max(box[2], c[0]); box[3] = Math.max(box[3], c[1]); });
          outlines.push({ ring: ring, box: box });
        });
      });
      if (!outlines.length) return { type: "Feature", properties: {}, geometry: { type: "MultiLineString", coordinates: lines } };
      var T = BORDER_BESIDE_EDGE;
      var near = function (c) {
        var kx = Math.cos(c[1] * Math.PI / 180), tx = T / kx, limit = T * T;
        for (var o = 0; o < outlines.length; o++) {
          var ring = outlines[o].ring, box = outlines[o].box;
          if (c[0] < box[0] - tx || c[0] > box[2] + tx || c[1] < box[1] - T || c[1] > box[3] + T) continue;
          for (var i = 0; i < ring.length; i++) {
            var a = ring[i], b = ring[(i + 1) % ring.length];
            // Both ends well to one side: this piece cannot come close.
            if ((a[1] - c[1] > T && b[1] - c[1] > T) || (c[1] - a[1] > T && c[1] - b[1] > T) ||
                (a[0] - c[0] > tx && b[0] - c[0] > tx) || (c[0] - a[0] > tx && c[0] - b[0] > tx)) continue;
            var ax = (a[0] - c[0]) * kx, ay = a[1] - c[1], dx = (b[0] - a[0]) * kx, dy = b[1] - a[1];
            var len2 = dx * dx + dy * dy, t = len2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2)) : 0;
            var ex = ax + dx * t, ey = ay + dy * t;
            if (ex * ex + ey * ey < limit) return true;
          }
        }
        return false;
      };
      var kept = [];
      lines.forEach(function (line) {
        var run = [];
        line.forEach(function (c) {
          if (near(c)) { if (run.length > 1) kept.push(run); run = []; } else run.push(c);
        });
        if (run.length > 1) kept.push(run);
      });
      return { type: "Feature", properties: {}, geometry: { type: "MultiLineString", coordinates: kept } };
    }

    /* The dive in flight: the animation on the stage, the tiles settling
       and the timers. */
    var dive = { anim: null, flat: [], timers: [] };
    function stopDive() {
      if (dive.anim) { dive.anim.cancel(); dive.anim = null; }
      dive.flat.forEach(function (a) { a.cancel(); });
      dive.flat = [];
      dive.timers.forEach(function (t) { window.clearTimeout(t); });
      dive.timers = [];
    }

    /* The raised tiles settle onto the map: the top comes down, the side
       slides away under it, and the shadow and the light on the top fade
       (Joey 2026-10-30: the 3D goes, gradually, while you zoom in). Every
       part is a layer of its own, so the browser can do this next to the
       zoom without painting. `frames`: [{ offset, p }], p from 0 (raised)
       to 1 (flat), on the clock of the zoom. */
    function flatten(frames, ms) {
      var timing = { duration: ms, easing: "linear", fill: "forwards" };
      var keys = function (make) {
        return frames.map(function (f) {
          var key = make(f.p);
          key.offset = f.offset;
          return key;
        });
      };
      slabs.forEach(function (s) {
        var lift = s.lift;
        s.raised.forEach(function (node) {
          dive.flat.push(node.animate(keys(function (p) { return { transform: "translateY(" + (-lift * (1 - p)).toFixed(2) + "px)" }; }), timing));
        });
        dive.flat.push(s.sides.animate(keys(function (p) { return { transform: "translateY(" + (lift * p).toFixed(2) + "px)" }; }), timing));
        dive.flat.push(s.shine.animate(keys(function (p) { return { opacity: 1 - p }; }), timing));
        // The shadow slides back in under the tile as it comes down.
        dive.flat.push(s.shadow.animate(keys(function (p) {
          return { opacity: 1 - p, transform: "translate(" + (-0.6 * lift * p).toFixed(2) + "px, " + (-0.9 * lift * p).toFixed(2) + "px)" };
        }), timing));
      });
    }

    /* The stage's transform `transform` (around transform-origin `from`),
       written for transform-origin `to`, so it stays where it is. */
    function moveOrigin(transform, from, to) {
      try {
        var dx = from[0] - to[0], dy = from[1] - to[1];
        return new DOMMatrix().translate(dx, dy).multiply(new DOMMatrix(transform)).translate(-dx, -dy).toString();
      } catch (e) { return transform; }
    }

    function clearMotion() {
      window.clearTimeout(clearMotion.timer);
      stopDive();
      root.style.transition = "";
      stage.style.transition = "none";
      stage.style.transform = "";
      stage.style.opacity = "";
    }

    /* The camera above a region on the way back out: centred on it, zoomed
       in and tilted a little. Same function list as flat(), so the browser
       animates every part smoothly. */
    function pose(b) {
      var r = view.rect;
      return {
        scale: Math.min(r.width / Math.max(b.box.w, 1), r.height / Math.max(b.box.h, 1)) * 0.9,
        tx: r.left + r.width / 2 - b.box.x,
        ty: r.top + r.height / 2 - b.box.y
      };
    }
    function transformOf(tx, ty, tilt, scale) {
      return "translate(" + tx.toFixed(1) + "px, " + ty.toFixed(1) + "px) perspective(" + PERSPECTIVE + "px) rotateX(" + tilt.toFixed(2) + "deg) scale(" + scale.toFixed(3) + ")";
    }
    function camera(b, tilt) {
      var p = pose(b);
      return transformOf(p.tx, p.ty, tilt, p.scale);
    }
    function flat() {
      return "translate(0px, 0px) perspective(" + PERSPECTIVE + "px) rotateX(0deg) scale(1)";
    }

    return {
      ready: ready,
      layout: function (rect) { ready.then(function () { layout(rect); }); },
      show: function (intro) {
        clearMotion();
        root.hidden = false;
        root.classList.toggle("is-intro", !!intro);
        window.requestAnimationFrame(function () { root.classList.add("is-zichtbaar"); });
      },
      hide: function () {
        root.classList.remove("is-zichtbaar", "is-intro", "is-duiken");
        root.hidden = true;
        clearMotion();
      },
      isShown: function () { return !root.hidden; },
      /* The way down from the whole drawing to a live map camera
         ({ center, zoom }) as one flat zoom: everything grows around one
         point that keeps its place on the screen all the way down, so the
         target slides calmly into its place without the camera swinging.
         The drawing does the first part of it (zoomInto), the live map the
         rest around the same point (`around`, see diveFromAtlas in
         reisgids.js). Zoom levels count from the drawing as it lies now
         (`zoom`: its scale in the live map's zoom levels). Null when the
         camera is not (much) closer than the drawing. */
      plan: function (camera) {
        if (!view || !camera) return null;
        var W = window.innerWidth, H = window.innerHeight;
        var z0 = Math.log(2 * Math.PI * view.scale / 512) / Math.LN2;
        var dz = camera.zoom - z0;
        if (!(dz > 0.4)) return null;
        var c = camera.center;
        var target = view.project(Array.isArray(c) ? c : [c.lng, c.lat]);
        var k = Math.pow(2, -dz);
        var fixed = [(target[0] - k * W / 2) / (1 - k), (target[1] - k * H / 2) / (1 - k)];
        // Point on the flat drawing under screen point (x, y), `z` levels down.
        var under = function (x, y, z) {
          var s = Math.pow(2, z);
          return [fixed[0] + (x - fixed[0]) / s, fixed[1] + (y - fixed[1]) / s];
        };
        return {
          zoom: z0, dz: dz, origin: fixed, around: view.unproject(fixed),
          // The live map's camera lying exactly on the drawing `z` levels down.
          cameraAt: function (z) { return { center: view.unproject(under(W / 2, H / 2, z)), zoom: z0 + z }; },
          // A picture of the view `z` levels down with a margin around it,
          // sharp at that zoom (see picture).
          pictureAt: function (z, wanted) {
            if (!view) return Promise.resolve(null);
            var nw = under(-0.25 * W, -0.25 * H, z), se = under(1.25 * W, 1.25 * H, z);
            var crop = { x: nw[0], y: nw[1], w: se[0] - nw[0], h: se[1] - nw[1] };
            var dpr = Math.min(2, window.devicePixelRatio || 1);
            return picture(crop, pictureWidth(crop, 1.25 * W * dpr, 3.6e6), wanted);
          }
        };
      },
      /* The drawing's part of the dive (see plan): the stage zooms in flat
         around `origin`, and the raised tiles settle onto the map on the
         way, lying flat once the drawing is `flatAt` levels down. Without
         the 3D the drawing ends exactly as the live map that takes over.
         options: plan, frames ([{ offset, zoom }]: levels down over time),
         ms, flatAt. The last frame stays until follow or hide. */
      zoomInto: function (options) {
        if (!view) return false;
        var origin = options.plan.origin;
        var to = [origin[0], origin[1]];
        // Tapped during the opening: dive on from where the camera is now.
        var start = "none";
        if (root.classList.contains("is-intro")) {
          var cs = window.getComputedStyle(stage);
          if (cs.transform && cs.transform !== "none") {
            start = moveOrigin(cs.transform, cs.transformOrigin.split(" ").map(parseFloat), to);
          }
        }
        root.classList.remove("is-intro");
        root.classList.add("is-duiken");
        stopDive();
        root.style.transition = "";
        stage.style.transition = "none";
        stage.style.transformOrigin = to[0].toFixed(1) + "px " + to[1].toFixed(1) + "px";
        stage.style.transform = start !== "none" ? start : "scale(1)";
        var frames = options.frames.map(function (f) {
          return { offset: f.offset, transform: "scale(" + Math.pow(2, f.zoom).toFixed(5) + ")" };
        });
        if (start !== "none") frames[0].transform = start;
        dive.anim = stage.animate(frames, { duration: options.ms, easing: "linear", fill: "forwards" });
        flatten(options.frames.map(function (f) {
          var t = Math.max(0, Math.min(1, f.zoom / options.flatAt));
          return { offset: f.offset, p: t * t * (3 - 2 * t) };
        }), options.ms);
        return true;
      },
      /* The borders between the provinces as drawn (the same lines in all
         three countries), as GeoJSON, for the live map to draw them thin and
         sharp at every zoom while it carries the drawing on. Worked out once
         (it never changes): the first time held up the dive for a moment on
         a phone, so reisgids.js asks for it ahead (see warmDrawing). */
      borders: function () {
        if (!bordersMade && data.grenzen) bordersMade = drawnBorders();
        return bordersMade || drawnBorders();
      },
      /* The borders of the booked areas as drawn: only where they run over
         the land of the drawing (an area's official border runs far out to
         sea, the drawing cuts it off at its coast). GeoJSON lines with the
         area's id, for the live map to draw them the same way; null without
         the land outline. */
      edges: function () {
        var fiMain = finlandMain() && data.finland.length;
        var landRings = (fiMain ? data.finland : data.land).concat(hasFinnish() && !fiMain ? data.finland : []);
        if (!landRings.length) return null;
        var boxes = landRings.map(function (ring) {
          var b = [Infinity, Infinity, -Infinity, -Infinity];
          ring.forEach(function (c) { b[0] = Math.min(b[0], c[0]); b[1] = Math.min(b[1], c[1]); b[2] = Math.max(b[2], c[0]); b[3] = Math.max(b[3], c[1]); });
          return b;
        });
        var onLand = function (c) {
          var hit = false;
          landRings.forEach(function (ring, i) {
            var b = boxes[i];
            if (c[0] >= b[0] && c[0] <= b[2] && c[1] >= b[1] && c[1] <= b[3] && insideRing(c, ring)) hit = !hit;
          });
          return hit;
        };
        // Where the segment from a (on land: `aIn`) to b crosses the coast.
        var crossing = function (a, b, aIn) {
          var lo = 0, hi = 1;
          for (var i = 0; i < 12; i++) {
            var t = (lo + hi) / 2;
            if (onLand([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]) === aIn) lo = t; else hi = t;
          }
          var m = (lo + hi) / 2;
          return [a[0] + (b[0] - a[0]) * m, a[1] + (b[1] - a[1]) * m];
        };
        var features = [];
        options.regions.forEach(function (region) {
          var f = data.regions[region.id];
          if (!f) return;
          var lines = [], run = null;
          ringsOf(f).forEach(function (ring) {
            var pts = ring.concat([ring[0]]);
            var prevIn = onLand(pts[0]);
            run = prevIn ? [pts[0]] : null;
            for (var i = 1; i < pts.length; i++) {
              var a = pts[i - 1], b = pts[i], bIn = onLand(b);
              if (bIn !== prevIn) {
                var x = crossing(a, b, prevIn);
                if (prevIn) { run.push(x); lines.push(run); run = null; }
                else run = [x];
              }
              if (bIn) run.push(b);
              prevIn = bIn;
            }
            if (run && run.length > 1) lines.push(run);
          });
          features.push({ type: "Feature", properties: { id: region.id }, geometry: { type: "MultiLineString", coordinates: lines } });
        });
        return { type: "FeatureCollection", features: features };
      },
      /* The whole drawing as a picture (kept until the next layout). */
      wholePicture: function () {
        if (!view) return Promise.resolve(null);
        if (!wholePicture) {
          var box = seaBox();
          wholePicture = picture(box, pictureWidth(box, 2560, 5e6));
        }
        return wholePicture;
      },
      /* A sharp picture of an area of the map, given by its north-west and
         south-east corner (lng/lat), at about `width` px wide. Drawn the same
         way as the pictures of the dive, so laying it over them only makes
         them sharper. */
      pictureOf: function (nw, se, width, wanted) {
        if (!view) return Promise.resolve(null);
        var a = view.project(nw), b = view.project(se);
        var box = { x: a[0], y: a[1], w: b[0] - a[0], h: b[1] - a[1] };
        if (!(box.w > 0 && box.h > 0)) return Promise.resolve(null);
        return picture(box, pictureWidth(box, width, 6e6), wanted);
      },
      /* Lay the flat drawing exactly over the live map's camera (no tilt). */
      follow: function (center, zoom) {
        if (!view) return;
        if (dive.anim) { dive.anim.cancel(); dive.anim = null; }
        var k = 512 * Math.pow(2, zoom) / (2 * Math.PI * view.scale);
        var a = view.project([center.lng, center.lat]);
        stage.style.transition = "none";
        stage.style.transformOrigin = "0 0";
        stage.style.transform = "translate(" + (window.innerWidth / 2 - k * a[0]).toFixed(2) + "px, " + (window.innerHeight / 2 - k * a[1]).toFixed(2) + "px) scale(" + k.toFixed(4) + ")";
      },
      /* Dissolve the drawing (it is then hidden). */
      fadeOut: function (ms, done) {
        root.style.transition = "opacity " + ms + "ms ease-in-out";
        root.classList.remove("is-zichtbaar");
        dive.timers.push(window.setTimeout(function () { if (done) done(); }, ms));
      },
      /* The way back: start low above the region, tilted, and pull up and
         out until the whole map lies flat again. */
      zoomOutFrom: function (id, ms) {
        stopDive();
        root.style.transition = "";
        root.hidden = false;
        root.classList.remove("is-intro");
        root.classList.add("is-zichtbaar");
        if (!view || !badges[id]) { clearMotion(); return; }
        var b = badges[id];
        stage.style.transition = "none";
        stage.style.transformOrigin = b.box.x + "px " + b.box.y + "px";
        stage.style.transform = camera(b, DIVE_TILT);
        stage.style.opacity = "0";
        void stage.offsetWidth;
        stage.style.transition = "transform " + ms + "ms cubic-bezier(0.16, 1, 0.3, 1), opacity " + Math.round(ms * 0.35) + "ms ease-out";
        stage.style.transform = flat();
        stage.style.opacity = "1";
        // Drop the 3D layer once it lies flat again (sharper drawing).
        window.clearTimeout(clearMotion.timer);
        clearMotion.timer = window.setTimeout(function () {
          if (!root.hidden) { stage.style.transition = "none"; stage.style.transform = ""; }
        }, ms + 50);
      }
    };
  }

  window.NovakseAtlas = { create: create };
})();

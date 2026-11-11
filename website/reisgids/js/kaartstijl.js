/* Winter map style for the travel guide, in the palette of the drawn overview
   map: snow land with cool blue hill shading, glacier-blue water, pine-tinted
   forest, and the booked province as the one warm area.
   Vector tiles and label fonts come from OpenFreeMap (free, no key, OpenMapTiles
   schema). Only a few layers are drawn on purpose: land, water, faint forest,
   thin roads and a handful of place names, so the illustrated markers stay
   the main thing on the map. */
(function () {
  "use strict";

  var C = {
    land: "#f7f5f0",
    forest: "#d9e3d8",
    residential: "#efe9df",
    water: "#6fa9bf",
    waterLine: "#4a879f",
    road: "#ffffff",
    roadCasing: "#d3cbbd",
    border: "#93a3ab",
    label: "#1f3f4c",
    labelKey: "#132f3a",
    labelSoft: "#566d78",
    waterLabel: "#ffffff",
    waterHalo: "#447f97",
    halo: "#f7f5f0"
  };

  var classIs = function (list) {
    return ["match", ["get", "class"], list, true, false];
  };
  /* Road width (px) for motorways and trunk roads, primary roads, and the rest. */
  var roadSize = function (main, primary, other) {
    return ["match", ["get", "class"], ["motorway", "trunk"], main, "primary", primary, other];
  };

  window.NovakseKaartstijl = {
    version: 8,
    name: "Novakse winter",
    glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    /* Only seen while the camera comes in tilted (the dive into a region):
       a pale winter sky that fades into a hazy horizon. */
    sky: {
      "sky-color": "#bcd6e2",
      "horizon-color": "#eef3f2",
      "fog-color": "#f7f5f0",
      "sky-horizon-blend": 0.6,
      "horizon-fog-blend": 0.7,
      "fog-ground-blend": 0.5,
      "atmosphere-blend": 0
    },
    sources: {
      omt: { type: "vector", url: "https://tiles.openfreemap.org/planet" },
      /* The towns around the areas of the guide, as the tiles hold them from
         zoom 7 (built beforehand from the same OpenStreetMap data), so they
         are on the map at the zoom of a province already. */
      plaatsen: { type: "geojson", data: "/reisgids/vormen/plaatsen.json" },
      /* Height data for the soft hill shading: the open Terrain Tiles dataset
         (Mapterhorn, free and without a key). The older Mapzen set had a visible
         seam where two sources meet, a sharp diagonal line across Dalarna. */
      hoogte: {
        type: "raster-dem",
        tiles: ["https://tiles.mapterhorn.com/{z}/{x}/{y}.webp"],
        encoding: "terrarium",
        tileSize: 512,
        maxzoom: 14,
        attribution: "Hoogte: Mapterhorn"
      }
    },
    layers: [
      { id: "land", type: "background", paint: { "background-color": C.land } },

      {
        id: "forest", type: "fill", source: "omt", "source-layer": "landcover",
        filter: classIs(["wood", "forest"]),
        paint: { "fill-color": C.forest, "fill-opacity": ["interpolate", ["linear"], ["zoom"], 4.5, 0.3, 7, 0.8, 13, 1] }
      },
      {
        id: "residential", type: "fill", source: "omt", "source-layer": "landuse", minzoom: 9,
        filter: classIs(["residential", "suburb", "neighbourhood"]),
        paint: { "fill-color": C.residential, "fill-opacity": 0.8 }
      },
      /* Hills and mountains: a cool blue shadow on the slopes away from the
         light, like snow in the afternoon sun; strongest around region zoom,
         quieter close up. */
      {
        id: "relief", type: "hillshade", source: "hoogte",
        paint: {
          "hillshade-exaggeration": ["interpolate", ["linear"], ["zoom"], 5, 0.5, 7.5, 0.66, 10, 0.52, 13, 0.42],
          "hillshade-shadow-color": "#56758a",
          "hillshade-highlight-color": "#ffffff",
          "hillshade-accent-color": "#6c8797",
          "hillshade-illumination-direction": 315
        }
      },
      {
        id: "water", type: "fill", source: "omt", "source-layer": "water",
        filter: ["!=", ["get", "brunnel"], "tunnel"],
        paint: {
          "fill-color": C.water,
          "fill-outline-color": ["interpolate", ["linear"], ["zoom"], 6, C.water, 8, C.waterLine]
        }
      },
      /* A pale rim along every shore (an inner glow on the water), the way
         illustrated maps show shallows. */
      {
        id: "water-shore", type: "line", source: "omt", "source-layer": "water", minzoom: 7,
        filter: ["!=", ["get", "brunnel"], "tunnel"],
        paint: {
          "line-color": "#a9d0dd",
          // Kept within the tile buffer, so no seams show at tile edges.
          "line-width": ["interpolate", ["linear"], ["zoom"], 7, 1, 11, 2.6, 15, 4.5],
          "line-blur": ["interpolate", ["linear"], ["zoom"], 7, 1, 11, 2, 15, 3.5],
          "line-offset": ["interpolate", ["linear"], ["zoom"], 7, 0.5, 11, 1.3, 15, 2.2],
          "line-opacity": 0.75
        }
      },
      {
        id: "waterway", type: "line", source: "omt", "source-layer": "waterway", minzoom: 9,
        paint: { "line-color": C.water, "line-width": ["interpolate", ["linear"], ["zoom"], 9, 0.6, 14, 2] }
      },

      /* Roads come in softly while you zoom in: the main roads from the
         zoom of the whole country on, wide enough to read on the drawn
         colours too, the small roads from zoom 10. */
      {
        id: "road-minor", type: "line", source: "omt", "source-layer": "transportation", minzoom: 10,
        filter: classIs(["minor", "service", "track"]),
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": C.road,
          "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.5, 16, 5],
          "line-opacity": ["interpolate", ["linear"], ["zoom"], 10, 0, 10.8, 1]
        }
      },
      {
        id: "road-path", type: "line", source: "omt", "source-layer": "transportation", minzoom: 13,
        filter: classIs(["path"]),
        paint: { "line-color": C.roadCasing, "line-width": 1, "line-dasharray": [2, 2] }
      },
      {
        id: "road-major-casing", type: "line", source: "omt", "source-layer": "transportation", minzoom: 4.2,
        filter: classIs(["motorway", "trunk", "primary", "secondary", "tertiary"]),
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": C.roadCasing,
          "line-width": ["interpolate", ["linear"], ["zoom"],
            5, roadSize(2, 1.5, 1), 7, roadSize(2.5, 2, 1.4), 10, roadSize(3.8, 3.2, 2.5), 16, 12],
          "line-opacity": ["interpolate", ["linear"], ["zoom"], 4.2, 0, 4.9, 1]
        }
      },
      {
        id: "road-major", type: "line", source: "omt", "source-layer": "transportation", minzoom: 4.2,
        filter: classIs(["motorway", "trunk", "primary", "secondary", "tertiary"]),
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": C.road,
          "line-width": ["interpolate", ["linear"], ["zoom"],
            5, roadSize(1.1, 0.8, 0.5), 7, roadSize(1.4, 1, 0.6), 10, roadSize(2.4, 1.9, 1.4), 16, 9],
          "line-opacity": ["interpolate", ["linear"], ["zoom"], 4.2, 0, 4.9, 1]
        }
      },

      {
        id: "border-country", type: "line", source: "omt", "source-layer": "boundary",
        filter: ["all", ["==", ["get", "admin_level"], 2], ["!=", ["get", "maritime"], 1]],
        paint: { "line-color": C.border, "line-width": 1, "line-dasharray": [3, 2] }
      },
      {
        id: "border-county", type: "line", source: "omt", "source-layer": "boundary", minzoom: 4.5, maxzoom: 10,
        filter: ["all", ["==", ["get", "admin_level"], 4], ["!=", ["get", "maritime"], 1]],
        paint: { "line-color": C.border, "line-width": 0.7, "line-opacity": 0.55, "line-dasharray": [1, 2.5] }
      },

      {
        id: "water-name", type: "symbol", source: "omt", "source-layer": "water_name", minzoom: 7,
        filter: ["match", ["geometry-type"], ["Point", "MultiPoint"], true, false],
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Italic"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 8, 11, 13, 14],
          "text-letter-spacing": 0.08,
          "text-max-width": 8
        },
        paint: { "text-color": C.waterLabel, "text-halo-color": C.waterHalo, "text-halo-width": 1.2 }
      },
      /* Place names come in softly while you zoom in: towns from about the
         zoom of a province (around the areas of the guide from our own
         list, everywhere from zoom 7, where the tiles hold all of them),
         villages from zoom 8, where the tiles start to hold them; the bigger
         places get their spot first. */
      {
        id: "place-village", type: "symbol", source: "omt", "source-layer": "place", minzoom: 8,
        filter: classIs(["village", "hamlet"]),
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 8, 10.5, 12, 12],
          "symbol-sort-key": ["coalesce", ["get", "rank"], 30]
        },
        paint: {
          "text-color": C.labelSoft, "text-halo-color": C.halo, "text-halo-width": 1.4,
          "text-opacity": ["interpolate", ["linear"], ["zoom"], 8, 0, 8.6, 1]
        }
      },
      {
        id: "place-town-early", type: "symbol", source: "plaatsen", minzoom: 5, maxzoom: 7,
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 6, 10.5, 8, 12],
          "text-letter-spacing": 0.04,
          "symbol-sort-key": ["coalesce", ["get", "rank"], 30]
        },
        paint: {
          "text-color": C.label, "text-halo-color": C.halo, "text-halo-width": 1.6,
          "text-opacity": ["interpolate", ["linear"], ["zoom"], 5, 0, 5.5, 1]
        }
      },
      {
        id: "place-town", type: "symbol", source: "omt", "source-layer": "place", minzoom: 5,
        filter: classIs(["town", "city"]),
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 6, 10.5, 8, 12, 12, 15],
          "text-letter-spacing": 0.04,
          "symbol-sort-key": ["coalesce", ["get", "rank"], 30]
        },
        paint: {
          "text-color": C.label, "text-halo-color": C.halo, "text-halo-width": 1.6,
          "text-opacity": ["interpolate", ["linear"], ["zoom"], 5, 0, 5.5, 1]
        }
      },
      {
        id: "place-city-overview", type: "symbol", source: "omt", "source-layer": "place", minzoom: 4, maxzoom: 6.2,
        filter: ["all", classIs(["city"]), ["<=", ["get", "rank"], 4]],
        layout: { "text-field": ["get", "name"], "text-font": ["Noto Sans Regular"], "text-size": 11 },
        paint: { "text-color": C.labelSoft, "text-halo-color": C.halo, "text-halo-width": 1.4 }
      },
      {
        id: "place-country", type: "symbol", source: "omt", "source-layer": "place", maxzoom: 6.5,
        filter: classIs(["country"]),
        layout: {
          "text-field": ["upcase", ["coalesce", ["get", "name:nl"], ["get", "name"]]],
          "text-font": ["Noto Sans Regular"],
          "text-size": 12,
          "text-letter-spacing": 0.35
        },
        paint: { "text-color": C.labelSoft, "text-halo-color": C.halo, "text-halo-width": 1.2 }
      },
      /* The towns the guest's places lie at (Falun, Orsa, ...): a dot here;
         their bold names are HTML on top of the markers (see keyTowns in
         reisgids.js), which also sets this filter; until then it matches
         nothing. */
      {
        id: "place-key-dot", type: "circle", source: "plaatsen", minzoom: 5,
        filter: ["in", ["get", "name"], ["literal", []]],
        paint: {
          "circle-color": C.labelKey,
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 6, 3, 10, 4],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1.6,
          "circle-opacity": ["interpolate", ["linear"], ["zoom"], 5, 0, 5.5, 1],
          "circle-stroke-opacity": ["interpolate", ["linear"], ["zoom"], 5, 0, 5.5, 1]
        }
      }
    ]
  };
})();

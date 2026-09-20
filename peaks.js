/* Peakbagging map. To add a summit, add an entry to PEAKS below —
   the map dot, the leader-line label, and the legend chip are all
   generated from this array. Coordinates are approximate unless a
   `gpx` track backs them up (then they're the track's real high point).

   To attach a GPS track: export from Strava, strip <extensions>
   (heart rate/cadence/etc. — not used here and no reason to publish
   them), drop the file in data/gpx/<slug>.gpx, and set `gpx` to that
   filename. Leave `gpx: null` for peaks with no recording yet. */

const PEAKS = [
  { name: "Mt. Bierstadt", state: "CO", tag: "14er", elevationFt: 14065, class: "Class 2", lat: 39.5825, lon: -105.6686, gpx: null },
  { name: "The Citadel", state: "CO", tag: "13er", elevationFt: 13298, class: "Class 4", lat: 39.71562, lon: -105.91161, gpx: "the-citadel.gpx" },
  { name: "North Arapaho Peak", state: "CO", tag: "13er", elevationFt: 13502, class: "Class 2", lat: 40.02656, lon: -105.65034, gpx: "arapaho-traverse.gpx" },
  { name: "South Arapaho Peak", state: "CO", tag: "13er", elevationFt: 13397, class: "Class 2", lat: 40.01969, lon: -105.64979, gpx: "arapaho-traverse.gpx" },
  { name: "Round Mountain", state: "WA", tag: null, elevationFt: 5284, class: null, lat: 48.32647, lon: -121.75083, gpx: "round-mountain.gpx" },
  { name: "East Esmeralda Peak", state: "WA", tag: null, elevationFt: 8918, class: "Class 3", lat: 47.535, lon: -120.83, gpx: "east-esmeralda.gpx" },
];

const LEAFLET_CSS_URL = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css";
const LEAFLET_JS_URL = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js";
const LEAFLET_GPX_JS_URL = "https://cdn.jsdelivr.net/npm/leaflet-gpx@1.7.0/gpx.min.js";
const TRANSPARENT_PIXEL = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

const scriptCache = new Map();

function loadScriptOnce(src) {
  if (!scriptCache.has(src)) {
    scriptCache.set(
      src,
      new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.body.appendChild(script);
      })
    );
  }
  return scriptCache.get(src);
}

function loadStyleOnce(href) {
  if (!scriptCache.has(href)) {
    scriptCache.set(
      href,
      new Promise((resolve, reject) => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        link.onload = () => resolve();
        link.onerror = () => reject(new Error(`Failed to load ${href}`));
        document.head.appendChild(link);
      })
    );
  }
  return scriptCache.get(href);
}

let leafletLoadPromise = null;
function ensureLeaflet() {
  if (!leafletLoadPromise) {
    leafletLoadPromise = Promise.all([
      loadStyleOnce(LEAFLET_CSS_URL),
      loadScriptOnce(LEAFLET_JS_URL).then(() => loadScriptOnce(LEAFLET_GPX_JS_URL)),
    ]);
  }
  return leafletLoadPromise;
}

function fieldText(value, fallback = "unknown") {
  return value === null || value === undefined || value === "" ? fallback : value;
}

function renderPeaksReadout(activePeak) {
  const name = document.getElementById("readout-name");
  const region = document.getElementById("readout-region");
  const elevation = document.getElementById("readout-elevation");
  const climbClass = document.getElementById("readout-class");
  if (!name || !region || !elevation || !climbClass) return;

  if (!activePeak) {
    name.textContent = "Hover a peak";
    region.textContent = "—";
    elevation.textContent = "—";
    climbClass.textContent = "—";
    return;
  }

  name.textContent = activePeak.name;
  region.textContent = [activePeak.state, activePeak.tag].filter(Boolean).join(" · ") || "—";
  elevation.textContent = activePeak.elevationFt ? `${activePeak.elevationFt.toLocaleString()} ft` : fieldText(null);
  climbClass.textContent = fieldText(activePeak.class);
}

function renderPeaksLegend() {
  const legend = document.getElementById("peaks-legend");
  if (!legend) return;

  legend.innerHTML = "";
  PEAKS.slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((peak) => {
      const li = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "peak-chip";
      button.dataset.name = peak.name;
      button.textContent = peak.name;
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-controls", "peaks-detail");
      li.appendChild(button);
      legend.appendChild(li);
    });
}

// --- click-to-expand topo detail panel ---

let leafletMap = null;
let gpxLayer = null;
let openPeakName = null;

function setExpandedState(name, expanded) {
  document.querySelectorAll('[data-name="' + name.replace(/"/g, "") + '"]').forEach((el) => {
    el.setAttribute("aria-expanded", String(expanded));
  });
}

function closePeakDetail() {
  const panel = document.getElementById("peaks-detail");
  if (!panel || panel.hidden) return;
  if (openPeakName) setExpandedState(openPeakName, false);
  panel.hidden = true;
  openPeakName = null;
}

function showDetailFields(fields) {
  const dl = document.getElementById("peaks-detail-fields");
  if (!dl) return;
  dl.innerHTML = fields
    .map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`)
    .join("");
}

function loadTrack(peak) {
  const status = document.getElementById("peaks-detail-status");
  const mapEl = document.getElementById("peaks-topo-map");
  status.textContent = "Loading track…";
  mapEl.hidden = false;

  ensureLeaflet()
    .then(() => {
      if (!leafletMap) {
        leafletMap = L.map("peaks-topo-map", { scrollWheelZoom: false });
        L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
          maxZoom: 17,
          attribution:
            'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
        }).addTo(leafletMap);
      } else {
        leafletMap.invalidateSize();
      }

      if (gpxLayer) {
        leafletMap.removeLayer(gpxLayer);
        gpxLayer = null;
      }

      const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#2b4bff";

      gpxLayer = new L.GPX("data/gpx/" + peak.gpx, {
        async: true,
        polyline_options: { color: accent, weight: 3, opacity: 0.9 },
        marker_options: {
          startIconUrl: TRANSPARENT_PIXEL,
          endIconUrl: TRANSPARENT_PIXEL,
          shadowUrl: TRANSPARENT_PIXEL,
          wptIconUrls: {},
        },
      })
        .on("loaded", (e) => {
          const track = e.target;
          const miles = track.get_distance_imp();
          const gainFt = track.get_elevation_gain_imp();
          const start = track.get_start_time();

          const fields = [
            ["distance", `${miles.toFixed(1)} mi`],
            ["elev. gain", `${Math.round(gainFt).toLocaleString()} ft`],
          ];
          if (start) fields.push(["recorded", start.toLocaleDateString()]);
          showDetailFields(fields);

          status.textContent = "";
          leafletMap.invalidateSize();
          leafletMap.fitBounds(track.getBounds());
        })
        .on("error", () => {
          status.textContent = "Couldn't load this track — see console for details.";
          mapEl.hidden = true;
        })
        .addTo(leafletMap);
    })
    .catch((err) => {
      console.error("Leaflet failed to load:", err);
      status.textContent = "Map library failed to load.";
      mapEl.hidden = true;
    });
}

function openPeakDetail(peak) {
  const panel = document.getElementById("peaks-detail");
  const heading = document.getElementById("peaks-detail-heading");
  const status = document.getElementById("peaks-detail-status");
  const mapEl = document.getElementById("peaks-topo-map");
  if (!panel || !heading || !status || !mapEl) return;

  panel.hidden = false;
  heading.textContent = peak.name;
  setExpandedState(peak.name, true);
  openPeakName = peak.name;

  if (!peak.gpx) {
    showDetailFields([]);
    status.textContent = "GPS track not yet available for this peak.";
    mapEl.hidden = true;
    return;
  }

  status.textContent = "";
  loadTrack(peak);
}

function handlePeakClick(peak, activateFn) {
  activateFn(peak.name);
  if (openPeakName === peak.name) {
    closePeakDetail();
  } else {
    openPeakDetail(peak);
  }
}

function renderPeaksMap() {
  const svgEl = document.getElementById("peaks-map");
  if (!svgEl || typeof d3 === "undefined" || typeof topojson === "undefined") return;

  const svg = d3.select(svgEl);
  const viewBox = svgEl.viewBox.baseVal;
  const width = viewBox.width || 800;
  const height = viewBox.height || 480;

  const projection = d3.geoAlbersUsa();
  const path = d3.geoPath(projection);

  fetch("data/us-nation-10m.json")
    .then((res) => res.json())
    .then((topology) => {
      const nation = topojson.feature(topology, topology.objects.nation);
      projection.fitSize([width, height], nation);

      svg.select(".map-fallback").remove();

      svg.append("path").datum(nation).attr("class", "nation-outline").attr("d", path);

      const graticule = d3.geoGraticule().step([10, 10]);
      svg.append("path").datum(graticule()).attr("class", "graticule").attr("d", path);

      const markers = svg
        .append("g")
        .attr("class", "peak-markers")
        .selectAll(".peak-marker")
        .data(PEAKS.filter((peak) => projection([peak.lon, peak.lat])))
        .join("g")
        .attr("class", "peak-marker")
        .attr("data-name", (peak) => peak.name)
        .attr("tabindex", 0)
        .attr("role", "button")
        .attr("aria-label", (peak) => `${peak.name}, ${peak.state}`)
        .attr("aria-expanded", "false")
        .attr("aria-controls", "peaks-detail");

      markers.each(function (peak) {
        const [x, y] = projection([peak.lon, peak.lat]);
        const g = d3.select(this);
        g.append("line").attr("x1", x).attr("y1", y).attr("x2", x + 14).attr("y2", y - 14);
        g.append("circle").attr("class", "hit-area").attr("cx", x).attr("cy", y).attr("r", 10);
        g.append("polygon")
          .attr("class", "peak-dot")
          .attr("points", `${x},${y - 5.5} ${x - 5},${y + 3.5} ${x + 5},${y + 3.5}`);
        g.append("text").attr("x", x + 18).attr("y", y - 14).attr("class", "peak-label").text(peak.name);
      });

      const legendButtons = Array.from(document.querySelectorAll(".peak-chip"));
      const peaksByName = Object.fromEntries(PEAKS.map((p) => [p.name, p]));

      function activate(name) {
        markers.classed("active", (d) => d.name === name);
        legendButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.name === name));
        renderPeaksReadout(peaksByName[name]);
      }

      function deactivate() {
        markers.classed("active", false);
        legendButtons.forEach((btn) => btn.classList.remove("active"));
        renderPeaksReadout(null);
      }

      markers
        .on("mouseenter focus", (event, d) => activate(d.name))
        .on("mouseleave blur", deactivate)
        .on("click", (event, d) => handlePeakClick(d, activate));

      legendButtons.forEach((btn) => {
        const peak = peaksByName[btn.dataset.name];
        btn.addEventListener("mouseenter", () => activate(btn.dataset.name));
        btn.addEventListener("focus", () => activate(btn.dataset.name));
        btn.addEventListener("mouseleave", deactivate);
        btn.addEventListener("blur", deactivate);
        btn.addEventListener("click", () => handlePeakClick(peak, activate));
      });

      const closeBtn = document.getElementById("peaks-detail-close");
      if (closeBtn) closeBtn.addEventListener("click", closePeakDetail);
    })
    .catch((err) => {
      console.error("Peaks map failed to load:", err);
      svg.select(".map-fallback").text("Map unavailable — see the list below.");
    });
}

document.addEventListener("DOMContentLoaded", () => {
  renderPeaksReadout(null);
  renderPeaksLegend();
  renderPeaksMap();

  const peaksSection = document.getElementById("peaks");
  if (peaksSection) {
    peaksSection.addEventListener("tab:shown", () => {
      if (leafletMap) leafletMap.invalidateSize();
    });
  }
});

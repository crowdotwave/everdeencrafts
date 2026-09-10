/* =========================================================
   Everdeen Crafts: gallery
   Reads data/gallery.json and fills any [data-gallery] grid.
   Optional: data-limit, data-lightbox, [data-gallery-filters],
   and [data-gallery-feature] for a single hero image well.
   ========================================================= */
(function () {
  "use strict";

  var MANIFEST = "data/gallery.json";
  var state = { items: [], categories: [], active: "all" };

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function labelFor(id) {
    for (var i = 0; i < state.categories.length; i++) {
      if (state.categories[i].id === id) return state.categories[i].label;
    }
    return "";
  }

  /* Alt text falls back to the category label when the manifest
     leaves it blank, so images are never announced as unlabelled. */
  function altFor(item) {
    if (item.alt && item.alt.trim()) return item.alt.trim();
    var l = labelFor(item.category);
    return l ? l + " piece by Everdeen Crafts" : "Piece by Everdeen Crafts";
  }

  function visible() {
    if (state.active === "all") return state.items;
    return state.items.filter(function (i) { return i.category === state.active; });
  }

  /* ---- Tiles ---- */
  function tile(item, index) {
    var b = el("button", "tile");
    b.type = "button";
    b.setAttribute("data-index", index);

    var img = el("img");
    img.src = item.src;
    img.alt = altFor(item);
    img.loading = "lazy";
    img.decoding = "async";
    b.appendChild(img);

    var veil = el("div", "tile__veil");
    var cap = item.caption && item.caption.trim() ? item.caption.trim() : labelFor(item.category);
    if (cap) veil.appendChild(el("span", "tile__label", cap));
    b.appendChild(veil);

    return b;
  }

  function emptyState() {
    return el("div", "empty",
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">' +
        '<rect x="3" y="4" width="18" height="16" rx="2"/>' +
        '<circle cx="8.5" cy="9.5" r="1.6"/>' +
        '<path d="m21 16-5.5-5.5L7 19"/>' +
      "</svg>" +
      "<h3>No photos yet</h3>" +
      "<p>Drop image files into <code>assets/img/work/</code> and list them in " +
      "<code>data/gallery.json</code>. They will appear here automatically.</p>"
    );
  }

  /* ---- Grids ---- */
  function renderGrids() {
    var grids = document.querySelectorAll("[data-gallery]");
    Array.prototype.forEach.call(grids, function (grid) {
      grid.innerHTML = "";
      var list = visible();
      var limit = parseInt(grid.getAttribute("data-limit"), 10);
      if (limit > 0) list = list.slice(0, limit);

      if (!list.length) {
        grid.style.display = "block";
        grid.appendChild(emptyState());
        return;
      }
      grid.style.display = "";

      list.forEach(function (item) {
        grid.appendChild(tile(item, state.items.indexOf(item)));
      });
    });
  }

  /* ---- Filters ---- */
  function renderFilters() {
    var host = document.querySelector("[data-gallery-filters]");
    if (!host) return;
    if (!state.items.length) { host.style.display = "none"; return; }

    host.innerHTML = "";
    var opts = [{ id: "all", label: "Everything" }].concat(state.categories);

    opts.forEach(function (o) {
      // Hide categories that have no pieces in them.
      if (o.id !== "all" && !state.items.some(function (i) { return i.category === o.id; })) return;

      var b = el("button", "filter" + (state.active === o.id ? " is-active" : ""), o.label);
      b.type = "button";
      b.addEventListener("click", function () {
        state.active = o.id;
        renderFilters();
        renderGrids();
      });
      host.appendChild(b);
    });
  }

  /* ---- Feature well (single image on the home split) ---- */
  function renderFeature() {
    var well = document.querySelector("[data-gallery-feature]");
    if (!well || !state.items.length) return;
    var item = state.items.find(function (i) { return i.feature; }) || state.items[0];
    well.innerHTML = "";
    var img = el("img");
    img.src = item.src;
    img.alt = altFor(item);
    img.loading = "lazy";
    img.decoding = "async";
    well.appendChild(img);
  }

  /* ---- Lightbox ---- */
  var lb = null, lbIndex = 0, lastFocus = null;

  function buildLightbox() {
    if (lb) return lb;
    lb = el("div", "lightbox");
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-label", "Image viewer");
    lb.innerHTML =
      '<button class="lightbox__close" type="button" aria-label="Close">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 5l14 14M19 5L5 19"/></svg>' +
      "</button>" +
      '<button class="lightbox__nav lightbox__nav--prev" type="button" aria-label="Previous">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M15 5l-7 7 7 7"/></svg>' +
      "</button>" +
      '<button class="lightbox__nav lightbox__nav--next" type="button" aria-label="Next">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 5l7 7-7 7"/></svg>' +
      "</button>" +
      '<figure class="lightbox__figure"><figcaption></figcaption></figure>';
    document.body.appendChild(lb);

    lb.querySelector(".lightbox__close").addEventListener("click", closeLightbox);
    lb.querySelector(".lightbox__nav--prev").addEventListener("click", function () { step(-1); });
    lb.querySelector(".lightbox__nav--next").addEventListener("click", function () { step(1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLightbox(); });

    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    });
    return lb;
  }

  function paint() {
    var pool = visible();
    var item = pool[lbIndex];
    if (!item) return;

    var fig = lb.querySelector(".lightbox__figure");
    var img = fig.querySelector("img");
    if (!img) {
      // Created on first paint so the markup never ships a sourceless <img>.
      img = el("img");
      img.decoding = "async";
      fig.insertBefore(img, fig.firstChild);
    }
    img.src = item.src;
    img.alt = altFor(item);
    var cap = item.caption && item.caption.trim() ? item.caption.trim() : labelFor(item.category);
    lb.querySelector("figcaption").textContent = cap || "";
    var multi = pool.length > 1;
    lb.querySelector(".lightbox__nav--prev").style.display = multi ? "" : "none";
    lb.querySelector(".lightbox__nav--next").style.display = multi ? "" : "none";
  }

  function step(dir) {
    var pool = visible();
    if (!pool.length) return;
    lbIndex = (lbIndex + dir + pool.length) % pool.length;
    paint();
  }

  function openLightbox(item) {
    buildLightbox();
    var pool = visible();
    lbIndex = Math.max(0, pool.indexOf(item));
    lastFocus = document.activeElement;
    paint();
    lb.classList.add("is-open");
    document.body.style.overflow = "hidden";
    lb.querySelector(".lightbox__close").focus();
  }

  function closeLightbox() {
    if (!lb) return;
    lb.classList.remove("is-open");
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function wireLightbox() {
    document.addEventListener("click", function (e) {
      var t = e.target.closest(".tile");
      if (!t) return;
      var grid = t.closest("[data-gallery]");
      if (!grid || !grid.hasAttribute("data-lightbox")) return;
      var idx = parseInt(t.getAttribute("data-index"), 10);
      var item = state.items[idx];
      if (item) openLightbox(item);
    });
  }

  /* ---- Boot ---- */
  function boot() {
    if (!document.querySelector("[data-gallery], [data-gallery-feature]")) return;

    fetch(MANIFEST, { cache: "no-cache" })
      .then(function (r) {
        if (!r.ok) throw new Error("manifest " + r.status);
        return r.json();
      })
      .then(function (data) {
        state.categories = Array.isArray(data.categories) ? data.categories : [];
        state.items = (Array.isArray(data.items) ? data.items : []).filter(function (i) {
          return i && i.src;
        });
        renderFilters();
        renderGrids();
        renderFeature();
        wireLightbox();
      })
      .catch(function () {
        // No manifest reachable (e.g. opened straight off the filesystem).
        renderFilters();
        renderGrids();
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

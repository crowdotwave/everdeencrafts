/* =========================================================
   Everdeen Crafts: memorial wall
   Renders approved entries from data/memorials.json, handles the
   "light a candle" keepsake (stored on the visitor's own device),
   and posts new submissions to Formspree for Katrina to approve.
   ========================================================= */
(function () {
  "use strict";

  var MANIFEST = "data/memorials.json";
  var LIT_KEY = "everdeen.candles";

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* ---- Candles kept on the visitor's own device ---- */
  function litSet() {
    try { return new Set(JSON.parse(localStorage.getItem(LIT_KEY) || "[]")); }
    catch (e) { return new Set(); }
  }
  function saveLit(set) {
    try { localStorage.setItem(LIT_KEY, JSON.stringify(Array.from(set))); }
    catch (e) { /* private mode: the candle simply won't persist */ }
  }

  var CANDLE_SVG =
    '<svg viewBox="0 0 16 20" aria-hidden="true">' +
      '<path class="flame" d="M8 0c2.2 2.6 3.4 4.4 3.4 6a3.4 3.4 0 0 1-6.8 0C4.6 4.4 5.8 2.6 8 0Z"/>' +
      '<rect x="5.2" y="10.5" width="5.6" height="9" rx="1.1" fill="none" stroke="currentColor" stroke-width="1.1"/>' +
    "</svg>";

  function card(entry, i) {
    var id = entry.id || ("m" + i);
    var wrap = el("article", "memorial reveal");
    if (i % 3) wrap.setAttribute("data-delay", String(i % 3));

    // Photo, or a quiet paw mark when there isn't one.
    var photo = el("div", "memorial__photo");
    if (entry.photo) {
      var img = el("img");
      img.src = entry.photo;
      img.alt = entry.alt && entry.alt.trim()
        ? entry.alt.trim()
        : (entry.name ? "Photograph of " + entry.name : "Photograph");
      img.loading = "lazy";
      img.decoding = "async";
      photo.appendChild(img);
    } else {
      photo.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">' +
          '<ellipse cx="8" cy="7" rx="1.9" ry="2.5"/><ellipse cx="16" cy="7" rx="1.9" ry="2.5"/>' +
          '<ellipse cx="4.6" cy="12.4" rx="1.7" ry="2.2"/><ellipse cx="19.4" cy="12.4" rx="1.7" ry="2.2"/>' +
          '<path d="M12 13.2c2.7 0 5 2.1 5 4.6 0 1.7-1.3 2.9-3 2.9-1 0-1.4-.5-2-.5s-1 .5-2 .5c-1.7 0-3-1.2-3-2.9 0-2.5 2.3-4.6 5-4.6Z"/>' +
        "</svg>";
    }
    wrap.appendChild(photo);

    var body = el("div", "memorial__body");
    body.appendChild(el("h3", "memorial__name", esc(entry.name || "")));
    if (entry.years) body.appendChild(el("p", "memorial__years", esc(entry.years)));
    if (entry.words) body.appendChild(el("p", "memorial__words", esc(entry.words)));

    var foot = el("div", "memorial__foot");
    foot.appendChild(el("span", "memorial__from", entry.from ? "Loved by " + esc(entry.from) : ""));

    var lit = litSet();
    var btn = el("button", "candle" + (lit.has(id) ? " is-lit" : ""),
      CANDLE_SVG + "<span>" + (lit.has(id) ? "Candle lit" : "Light a candle") + "</span>");
    btn.type = "button";
    btn.setAttribute("aria-pressed", lit.has(id) ? "true" : "false");
    btn.addEventListener("click", function () {
      var s = litSet();
      var on = !s.has(id);
      if (on) s.add(id); else s.delete(id);
      saveLit(s);
      btn.classList.toggle("is-lit", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.querySelector("span").textContent = on ? "Candle lit" : "Light a candle";
    });
    foot.appendChild(btn);

    body.appendChild(foot);
    wrap.appendChild(body);
    return wrap;
  }

  function renderWall() {
    var host = document.querySelector("[data-memorials]");
    if (!host) return;

    fetch(MANIFEST, { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("manifest"); return r.json(); })
      .then(function (data) {
        var list = (Array.isArray(data.entries) ? data.entries : []).filter(function (e) {
          return e && e.name;
        });
        host.innerHTML = "";

        if (!list.length) {
          host.style.display = "block";
          host.appendChild(el("div", "empty",
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M12 3c2.8 3.4 4.4 5.7 4.4 7.8a4.4 4.4 0 0 1-8.8 0C7.6 8.7 9.2 6.4 12 3Z"/>' +
              '<path d="M8 21h8"/><path d="M12 15.2V21"/>' +
            "</svg>" +
            "<h3>The wall is waiting</h3>" +
            "<p>No animals have been added yet. Use the form below to be the first.</p>"
          ));
          return;
        }

        host.style.display = "";
        list.forEach(function (e, i) { host.appendChild(card(e, i)); });

        // Newly built cards need to be picked up by the reveal observer.
        if (window.IntersectionObserver) {
          var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
              if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
            });
          }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
          host.querySelectorAll(".reveal").forEach(function (n) { io.observe(n); });
        } else {
          host.querySelectorAll(".reveal").forEach(function (n) { n.classList.add("is-visible"); });
        }
      })
      .catch(function () {
        host.innerHTML = "";
        host.style.display = "block";
        host.appendChild(el("div", "empty",
          "<h3>The wall is waiting</h3><p>No animals have been added yet.</p>"
        ));
      });
  }

  /* ---- Submission form ---- */
  function form() {
    var f = document.querySelector("[data-memorial-form]");
    if (!f) return;

    var endpoint = f.getAttribute("data-endpoint") || "";
    var status = f.querySelector("[data-status]");
    var setup = document.querySelector("[data-setup-notice]");
    var submit = f.querySelector("[type=submit]");
    var configured = endpoint && endpoint.indexOf("YOUR_FORM_ID") === -1;

    // Until the endpoint is filled in, say so plainly rather than
    // letting people write something heartfelt into a form that drops it.
    if (!configured) {
      if (setup) setup.style.display = "";
      if (submit) { submit.disabled = true; submit.style.opacity = "0.45"; submit.style.cursor = "not-allowed"; }
      return;
    }
    if (setup) setup.style.display = "none";

    function say(kind, msg) {
      if (!status) return;
      status.className = "form-status is-shown form-status--" + kind;
      status.textContent = msg;
    }

    f.addEventListener("submit", function (e) {
      e.preventDefault();

      // Honeypot: real people leave this empty.
      if (f.querySelector("[name=_gotcha]") && f.querySelector("[name=_gotcha]").value) return;

      var data = new FormData(f);
      submit.disabled = true;
      var original = submit.querySelector("span") ? submit.querySelector("span").textContent : "";
      if (submit.querySelector("span")) submit.querySelector("span").textContent = "Sending";

      fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then(function (r) {
          if (r.ok) {
            f.reset();
            say("ok", "Thank you. Your message has reached Katrina, and she will add your animal to the wall shortly.");
          } else {
            return r.json().then(function (j) {
              var m = j && j.errors && j.errors.length ? j.errors.map(function (x) { return x.message; }).join(", ") : "";
              say("err", m || "That didn't send. Please try again, or reach out on Instagram.");
            });
          }
        })
        .catch(function () {
          say("err", "That didn't send. Please check your connection and try again.");
        })
        .then(function () {
          submit.disabled = false;
          if (submit.querySelector("span")) submit.querySelector("span").textContent = original;
        });
    });
  }

  function boot() { renderWall(); form(); }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

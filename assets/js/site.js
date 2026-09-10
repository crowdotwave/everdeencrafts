/* =========================================================
   Everdeen Crafts — shared behaviour
   Nav state, mobile menu, scroll reveals, tree parallax, year stamp.
   ========================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Nav: solid on scroll, mobile toggle ---- */
  function nav() {
    var el = document.querySelector(".nav");
    if (!el) return;

    var startsSolid = el.classList.contains("nav--inline");
    var toggle = el.querySelector(".nav__toggle");
    var links = el.querySelector(".nav__links");

    function onScroll() {
      var solid = startsSolid || window.scrollY > 40;
      el.classList.toggle("is-solid", solid);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (toggle && links) {
      toggle.addEventListener("click", function () {
        var open = el.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        document.body.style.overflow = open ? "hidden" : "";
      });
      links.addEventListener("click", function (e) {
        if (e.target.closest("a")) {
          el.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
          document.body.style.overflow = "";
        }
      });
    }
  }

  /* ---- Reveal on scroll ---- */
  function reveals() {
    var nodes = document.querySelectorAll(".reveal");
    if (!nodes.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(nodes, function (n) { n.classList.add("is-visible"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-visible");
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });

    Array.prototype.forEach.call(nodes, function (n) { io.observe(n); });
  }

  /* ---- Tree silhouette parallax ---- */
  function trees() {
    var layers = document.querySelectorAll("[data-parallax]");
    if (!layers.length || reduceMotion) return;

    var ticking = false;
    function apply() {
      var y = window.scrollY;
      Array.prototype.forEach.call(layers, function (el) {
        var rate = parseFloat(el.getAttribute("data-parallax")) || 0;
        el.style.transform = "translate3d(0," + (y * rate).toFixed(2) + "px,0)";
      });
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(apply); }
    }, { passive: true });
    apply();
  }

  /* ---- Current year in footers ---- */
  function year() {
    var nodes = document.querySelectorAll("[data-year]");
    var y = String(new Date().getFullYear());
    Array.prototype.forEach.call(nodes, function (n) { n.textContent = y; });
  }

  function boot() { nav(); reveals(); trees(); year(); }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

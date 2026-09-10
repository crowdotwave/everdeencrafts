/* =========================================================
   Everdeen Crafts: drifting forest light
   Canvas particle field: slow pollen motes plus firefly pulses.
   Glow is drawn from a pre-rendered sprite so the per-frame cost
   stays low even with a few hundred particles.
   ========================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Pre-rendered radial glow sprite ---- */
  function makeGlow(rgb, size) {
    var c = document.createElement("canvas");
    c.width = c.height = size;
    var g = c.getContext("2d");
    var half = size / 2;
    var grad = g.createRadialGradient(half, half, 0, half, half, half);
    grad.addColorStop(0.0, "rgba(" + rgb + ",1)");
    grad.addColorStop(0.22, "rgba(" + rgb + ",0.55)");
    grad.addColorStop(0.55, "rgba(" + rgb + ",0.14)");
    grad.addColorStop(1.0, "rgba(" + rgb + ",0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
    return c;
  }

  var SPRITES = null;
  function sprites() {
    if (!SPRITES) {
      SPRITES = {
        // warm gold light through leaves
        gold: makeGlow("235, 219, 178", 64),
        // pale sage motes
        sage: makeGlow("214, 226, 200", 64),
        // near-white sparks
        white: makeGlow("255, 253, 245", 64)
      };
    }
    return SPRITES;
  }

  function rand(min, max) { return min + Math.random() * (max - min); }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }

  function Field(canvas, opts) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: true });
    this.opts = opts || {};
    this.density = this.opts.density || 0.00013;
    this.maxCount = this.opts.max || 190;
    this.parallax = this.opts.parallax !== false;
    this.particles = [];
    this.w = 0;
    this.h = 0;
    this.dpr = 1;
    this.t = 0;
    this.raf = null;
    this.running = false;
    this.px = 0;   // pointer offset, eased
    this.py = 0;
    this.tx = 0;   // pointer target
    this.ty = 0;

    this.resize = this.resize.bind(this);
    this.frame = this.frame.bind(this);
    this.onPointer = this.onPointer.bind(this);

    this.resize();
    window.addEventListener("resize", this.resize, { passive: true });

    if (this.parallax && !reduceMotion && window.matchMedia("(pointer: fine)").matches) {
      window.addEventListener("pointermove", this.onPointer, { passive: true });
    }
  }

  Field.prototype.onPointer = function (e) {
    var r = this.canvas.getBoundingClientRect();
    if (e.clientY < r.top - 200 || e.clientY > r.bottom + 200) return;
    this.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    this.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  };

  Field.prototype.resize = function () {
    var r = this.canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = r.width;
    this.h = r.height;
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.seed();
  };

  Field.prototype.seed = function () {
    var target = Math.min(this.maxCount, Math.round(this.w * this.h * this.density));
    // Smaller screens get proportionally fewer, and we never go below a sparse handful.
    target = Math.max(28, target);
    this.particles.length = 0;
    for (var i = 0; i < target; i++) this.particles.push(this.spawn(true));
  };

  Field.prototype.spawn = function (scatter) {
    // ~12% are fireflies: larger, warmer, they breathe.
    var firefly = Math.random() < 0.12;
    var depth = rand(0.25, 1);      // 0 = far, 1 = near
    return {
      x: rand(-40, this.w + 40),
      y: scatter ? rand(-40, this.h + 40) : this.h + rand(10, 90),
      depth: depth,
      r: firefly ? rand(2.6, 5.2) : rand(0.7, 2.5) * depth + 0.5,
      rise: (firefly ? rand(3, 8) : rand(6, 20)) * depth,   // px per second, upward
      sway: rand(8, 34) * depth,
      swayHz: rand(0.045, 0.16),
      phase: rand(0, Math.PI * 2),
      alpha: firefly ? rand(0.45, 0.9) : rand(0.12, 0.5) * (0.4 + depth * 0.6),
      pulseHz: firefly ? rand(0.18, 0.45) : rand(0.06, 0.18),
      firefly: firefly,
      sprite: firefly ? "gold" : (Math.random() < 0.22 ? "white" : "sage"),
      baseX: 0
    };
  };

  Field.prototype.frame = function (now) {
    if (!this.running) return;
    if (!this.last) this.last = now;
    var dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    this.t += dt;

    // Ease pointer offset
    this.px += (this.tx - this.px) * 0.045;
    this.py += (this.ty - this.py) * 0.045;

    var ctx = this.ctx;
    var sp = sprites();
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.globalCompositeOperation = "lighter";

    for (var i = 0; i < this.particles.length; i++) {
      var p = this.particles[i];

      p.y -= p.rise * dt;
      var swayX = Math.sin(this.t * p.swayHz * Math.PI * 2 + p.phase) * p.sway;

      // Recycle above the top edge
      if (p.y < -60) {
        this.particles[i] = this.spawn(false);
        continue;
      }

      // Breathing opacity
      var pulse = 0.62 + 0.38 * Math.sin(this.t * p.pulseHz * Math.PI * 2 + p.phase * 1.7);
      var a = p.alpha * pulse;
      if (a <= 0.004) continue;

      var ox = this.parallax ? this.px * 26 * p.depth : 0;
      var oy = this.parallax ? this.py * 14 * p.depth : 0;

      var size = p.r * (p.firefly ? 7 : 5.5);
      var half = size / 2;

      ctx.globalAlpha = Math.min(a, 1);
      ctx.drawImage(sp[p.sprite], p.x + swayX + ox - half, p.y + oy - half, size, size);
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    this.raf = window.requestAnimationFrame(this.frame);
  };

  Field.prototype.start = function () {
    if (this.running) return;
    this.running = true;
    this.last = 0;
    this.raf = window.requestAnimationFrame(this.frame);
  };

  Field.prototype.stop = function () {
    this.running = false;
    if (this.raf) window.cancelAnimationFrame(this.raf);
    this.raf = null;
  };

  /* Draw one still frame for reduced-motion users so the
     canvas still reads as light in the trees, just not moving. */
  Field.prototype.still = function () {
    var ctx = this.ctx, sp = sprites();
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.globalCompositeOperation = "lighter";
    for (var i = 0; i < this.particles.length; i++) {
      var p = this.particles[i];
      var size = p.r * (p.firefly ? 7 : 5.5);
      ctx.globalAlpha = Math.min(p.alpha * 0.8, 1);
      ctx.drawImage(sp[p.sprite], p.x - size / 2, p.y - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  };

  /* ---- Boot every [data-particles] canvas ---- */
  var fields = [];

  function boot() {
    var nodes = document.querySelectorAll("[data-particles]");
    Array.prototype.forEach.call(nodes, function (el) {
      var preset = el.getAttribute("data-particles") || "default";
      var conf = { density: 0.00013, max: 190, parallax: true };
      if (preset === "sparse") { conf.density = 0.00007; conf.max = 80; }
      if (preset === "band")   { conf.density = 0.00009; conf.max = 90; conf.parallax = false; }

      var f = new Field(el, conf);
      fields.push(f);

      if (reduceMotion) { f.still(); return; }

      // Only animate while on screen.
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) f.start(); else f.stop();
          });
        }, { rootMargin: "120px" });
        io.observe(el);
      } else {
        f.start();
      }
    });

    // Pause everything when the tab is hidden.
    document.addEventListener("visibilitychange", function () {
      fields.forEach(function (f) {
        if (document.hidden) f.stop();
        else if (!reduceMotion) f.start();
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

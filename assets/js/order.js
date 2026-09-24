/* =========================================================
   Everdeen Crafts: order request form
   Shows the follow-up questions that fit what has been chosen,
   then posts the whole request to Formspree, which emails it
   to Katrina.
   ========================================================= */
(function () {
  "use strict";

  function boot() {
    var f = document.querySelector("[data-order-form]");
    if (!f) return;

    var endpoint = f.getAttribute("data-endpoint") || "";
    var uploads = f.getAttribute("data-uploads") === "on";
    var status = f.querySelector("[data-status]");
    var setup = document.querySelector("[data-setup-notice]");
    var submit = f.querySelector("[type=submit]");
    var configured = endpoint && endpoint.indexOf("YOUR_FORM_ID") === -1;

    function all(sel) { return Array.prototype.slice.call(f.querySelectorAll(sel)); }

    // Show or hide a follow-up block, switching its inputs off while hidden
    // so a leftover answer never rides along with the order.
    function show(key, on) {
      all('[data-show="' + key + '"]').forEach(function (n) {
        n.hidden = !on;
        n.querySelectorAll("input, select, textarea").forEach(function (i) { i.disabled = !on; });
      });
    }

    /* ---- Photo uploads: file boxes, or a note to reply by email ---- */
    all("[data-upload]").forEach(function (n) {
      n.hidden = !uploads;
      n.querySelectorAll("input").forEach(function (i) { i.disabled = !uploads; });
    });
    all("[data-upload-fallback]").forEach(function (n) { n.hidden = uploads; });

    /* ---- 1. Rings ask for a size, and the gold ring for a gem size ---- */
    var item = f.querySelector("#item");
    function onItem() {
      var opt = item.options[item.selectedIndex];
      var ring = !!(opt && opt.hasAttribute("data-ring"));
      show("ring", ring);
      show("gem-size", ring && opt.getAttribute("data-ring") === "gem-size");
    }
    item.addEventListener("change", onItem);

    /* ---- 2. Colour follow-ups ---- */
    var choice = f.querySelector("#colour_choice");
    function onColour() {
      var v = choice.value;
      show("wheel", v === "Colour wheel");
      show("fur", v === "Fur match");
      show("picture", v === "Picture of a colour or pattern");
      // The picture block may hold an upload box that uploads are keeping off.
      if (!uploads) all("[data-upload] input").forEach(function (i) { i.disabled = true; });
    }
    choice.addEventListener("change", onColour);

    var picker = f.querySelector("#colour");
    var readout = f.querySelector("[data-colour-value]");
    if (picker && readout) {
      picker.addEventListener("input", function () { readout.textContent = picker.value.toUpperCase(); });
    }

    onItem();
    onColour();

    /* ---- Sending ---- */
    // Until the endpoint is filled in, say so plainly rather than
    // letting people fill in a whole order that goes nowhere.
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

      // Point at the first thing still missing, rather than a vague error.
      var missing = all("[required]").filter(function (i) { return !i.disabled && !i.checkValidity(); })[0];
      if (missing) {
        say("err", "A question is still unanswered. It's selected for you now.");
        missing.focus();
        return;
      }

      var data = new FormData(f);

      // One readable line per answer in Katrina's email.
      var inc = data.getAll("inclusions");
      data.delete("inclusions");
      data.append("inclusions", inc.length ? inc.join(", ") : "None");
      if (!data.get("gallery_consent")) data.append("gallery_consent", "No");
      if (!data.get("story_consent")) data.append("story_consent", "No");
      data.set("_subject", "Order request: " + (data.get("item") || "a piece") + " for " + (data.get("name") || "someone"));

      submit.disabled = true;
      var label = submit.querySelector("span");
      var original = label ? label.textContent : "";
      if (label) label.textContent = "Sending";

      fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then(function (r) {
          if (r.ok) {
            f.reset();
            onItem();
            onColour();
            if (readout && picker) readout.textContent = picker.value.toUpperCase();
            say("ok", "Thank you. Your order request has reached Katrina, and she will be in touch by email.");
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
          if (label) label.textContent = original;
        });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

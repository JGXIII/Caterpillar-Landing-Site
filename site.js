// Caterpillar site: shared behaviour for every page.

// ── The caterpillar ──────────────────────────────────────────────────────
// Any <div class="cat" data-segments="11"> becomes the app's caterpillar.
//
//   data-segments  body segments to draw (11 is a full day, as in the app)
//   data-full      segments the width is sized for (default 11), so a
//                  part-grown body leaves room to grow into, like the bar
//   data-head      happy | eating | full | drinking
//   data-max       largest segment height in px (default 64)
//
// Geometry is CaterpillarGeometry.swift: segments are 300x340 art, overlap by
// 45%, the head is 1.25 segments tall and sits 0.3 of an overlap forward of
// the last segment. Shades cycle light, mid, deep down the body, the garden
// palette's three tints.
(function () {
  var ASPECT = 300 / 340, OVERLAP = ASPECT * 0.45, STEP = ASPECT - OVERLAP;
  var HEAD_W = 1.25 * ASPECT;
  var WAVE = 0.045;                 // the app's bounce delay per segment
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function widthPerHeight(n) { return n * STEP - OVERLAP * 0.3 + HEAD_W; }

  function part(cls, left, i) {
    var el = document.createElement("span");
    el.className = cls;
    el.style.left = "calc(var(--seg) * " + left.toFixed(4) + ")";
    el.style.animationDelay = (i * 0.055).toFixed(3) + "s";      // grow-in
    var art = document.createElement("i");
    // Every segment in the same stride; it's the BOUNCE that's staggered.
    art.style.animationDelay = cls.indexOf("seg") === 0
      ? "0s, " + (i * WAVE).toFixed(3) + "s"
      : (i * WAVE).toFixed(3) + "s";
    el.appendChild(art);
    return el;
  }

  function build(cat) {
    var n = parseInt(cat.dataset.segments || "11", 10);
    var full = parseInt(cat.dataset.full || "11", 10);
    var max = parseFloat(cat.dataset.max || "64");
    var head = cat.dataset.head || "happy";

    var track = document.createElement("div");
    track.className = "cat-track";
    for (var i = 0; i < n; i++) {
      var s = part("seg t" + (i % 3), i * STEP, i);
      s.style.zIndex = String(i);
      track.appendChild(s);
    }
    var h = part("head", n * STEP - OVERLAP * 0.3, n);
    h.firstChild.style.backgroundImage = "url('assets/cat/head-" + head + ".png')";
    track.appendChild(h);
    if (cat.dataset.ground !== "none") {
      var g = document.createElement("div");
      g.className = "ground";
      cat.appendChild(g);
    }
    cat.insertBefore(track, cat.firstChild);

    // Sized from the MEASURED width, more than once: the box can be zero
    // wide the first time (a background tab, late layout), and the observer
    // is held in a variable because an unreferenced one can be collected
    // before it ever fires.
    function size() {
      var w = cat.clientWidth;
      if (!w) return;
      var seg = Math.min(max, w / widthPerHeight(full));
      cat.style.setProperty("--seg", seg.toFixed(2) + "px");
      track.style.width = (seg * widthPerHeight(n)).toFixed(1) + "px";
    }
    size();
    if ("ResizeObserver" in window) {
      cat._ro = new ResizeObserver(size);
      cat._ro.observe(cat);
    }
    window.addEventListener("load", size);

    // Every so often it looks around or blinks, as it does in the app, so
    // it isn't a pure loop.
    if (!reduce) {
      (function beat() {
        setTimeout(function () {
          if (Math.random() < 0.6) {
            h.classList.toggle("left", Math.random() < 0.5);
            h.classList.add("glance");
            setTimeout(function () { h.classList.remove("glance"); }, 1300);
          } else {
            h.classList.add("blink");
            setTimeout(function () { h.classList.remove("blink"); }, 140);
          }
          beat();
        }, 4000 + Math.random() * 6000);
      })();
    }
  }

  document.querySelectorAll(".cat").forEach(build);
})();

// ── Nav shadow once the page moves ───────────────────────────────────────
(function () {
  var nav = document.querySelector("body > nav");
  if (!nav) return;
  function update() { nav.classList.toggle("scrolled", window.scrollY > 8); }
  update();
  window.addEventListener("scroll", update, { passive: true });
})();

// ── Scroll reveal ────────────────────────────────────────────────────────
// Progressive enhancement: .reveal only hides content once we know
// IntersectionObserver is there to bring it back.
(function () {
  var items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    items.forEach(function (el) { el.classList.add("in"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      el.classList.add("in");
      io.unobserve(el);
      // Once it has landed, hand the element back to its own transitions,
      // or a card's hover lift would inherit the reveal's delay.
      setTimeout(function () {
        el.classList.remove("reveal", "in");
        el.style.transitionDelay = "";
      }, 1200);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  items.forEach(function (el) {
    // Stagger siblings, so a row of cards lands one after another.
    var i = Array.prototype.indexOf.call(el.parentNode.children, el);
    el.style.transitionDelay = (Math.min(i, 5) * 0.07).toFixed(2) + "s";
    io.observe(el);
  });
})();

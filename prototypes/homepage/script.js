/* ============================================================
   DevStash Homepage — script
   ============================================================ */
(function () {
  "use strict";

  /* -------- current year in footer -------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* -------- navbar opacity on scroll -------- */
  var nav = document.getElementById("nav");
  function onScroll() {
    if (window.scrollY > 20) nav.classList.add("is-scrolled");
    else nav.classList.remove("is-scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* -------- mobile nav toggle (reveal actions) -------- */
  var navToggle = document.getElementById("navToggle");
  if (navToggle) {
    navToggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
  }

  /* -------- scroll reveal -------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* -------- pricing monthly / yearly toggle -------- */
  var toggleOpts = document.querySelectorAll(".billing-toggle__opt");
  var proAmount = document.getElementById("proAmount");
  var proPer = document.getElementById("proPer");
  var proTag = document.getElementById("proTag");
  var PRICES = {
    monthly: { amount: "$8", per: "/month", tag: "Billed monthly." },
    yearly:  { amount: "$6", per: "/month", tag: "$72 billed yearly." }
  };
  toggleOpts.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var period = btn.getAttribute("data-period");
      toggleOpts.forEach(function (b) {
        var active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });
      var p = PRICES[period];
      if (proAmount) proAmount.textContent = p.amount;
      if (proPer) proPer.textContent = p.per;
      if (proTag) proTag.textContent = p.tag;
    });
  });

  /* ============================================================
     CHAOS ICONS — requestAnimationFrame physics
     ============================================================ */
  var field = document.getElementById("chaosField");
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!field) return;

  // Icons representing where developer knowledge scatters today.
  var ICONS = [
    // Notion
    { name: "Notion", svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.5 4.2l12.3-.9c1.5-.1 1.9 0 2.8.7l2.6 1.8c.6.4.8.5.8 1v13c0 .9-.3 1.5-1.5 1.6l-14.3.9c-.9.1-1.3-.1-1.8-.7L2 20.1c-.5-.7-.7-1.2-.7-1.8V5.7c0-.7.3-1.4 1.2-1.5zM17 6.9c.2 0 .1.3-.1.4l-9.7.6c-.3 0-.4.3-.1.5l1.5 1.1c.2.2.5.3.9.2l8.4-.5c.3 0 .4.2.2.4l-.6.3v8.7c0 .4-.2.6-.7.7l-1.3.1v-8l-1.6.1v8.2l-1.3.1c-.4 0-.6-.1-.9-.5l-3.4-5.3v5.1l1.1.3s0 .5-.6.5l-3.1.2c-.1-.2 0-.5.3-.6l.8-.2V9.7l-1-.1c-.1-.4.1-.9.7-1z"/></svg>' },
    // GitHub
    { name: "GitHub", svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1.5A10.5 10.5 0 0 0 8.7 22c.5.1.7-.2.7-.5v-1.9c-2.9.6-3.5-1.3-3.5-1.3-.5-1.2-1.2-1.5-1.2-1.5-.9-.6.1-.6.1-.6 1 .1 1.6 1.1 1.6 1.1.9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.7-1.4-2.3-.3-4.7-1.1-4.7-5.1 0-1.1.4-2 1-2.7-.1-.3-.5-1.3.1-2.7 0 0 .9-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .6 1.4.2 2.4.1 2.7.7.7 1 1.6 1 2.7 0 4-2.4 4.8-4.7 5.1.4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10.5 10.5 0 0 0 12 1.5z"/></svg>' },
    // Slack
    { name: "Slack", svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 15a2 2 0 1 1-2-2h2v2zm1 0a2 2 0 0 1 4 0v5a2 2 0 1 1-4 0v-5zM9 6a2 2 0 1 1 2-2v2H9zm0 1a2 2 0 0 1 0 4H4a2 2 0 1 1 0-4h5zm9 2a2 2 0 1 1 2 2h-2V9zm-1 0a2 2 0 0 1-4 0V4a2 2 0 1 1 4 0v5zm-2 9a2 2 0 1 1-2 2v-2h2zm0-1a2 2 0 0 1 0-4h5a2 2 0 1 1 0 4h-5z"/></svg>' },
    // VS Code
    { name: "VS Code", svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 2l4 2v16l-4 2-9-8-4 3-2-1v-8l2-1 4 3 9-8zm0 4.9L11.2 12 17 17.1V6.9z"/></svg>' },
    // Browser tabs
    { name: "Browser tabs", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18"/><path d="M7 6V4h6v2"/></svg>' },
    // Terminal
    { name: "Terminal", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3"/><path d="M13 15h4"/></svg>' },
    // Text file
    { name: "Text file", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/></svg>' },
    // Bookmark
    { name: "Bookmark", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/></svg>' },
  ];

  var SIZE = 44;
  var nodes = [];
  var w = 0, h = 0;
  var mouse = { x: -999, y: -999, active: false };

  function measure() {
    w = field.clientWidth;
    h = field.clientHeight;
  }

  function build() {
    measure();
    ICONS.forEach(function (icon) {
      var el = document.createElement("div");
      el.className = "chaos-icon";
      el.innerHTML = icon.svg;
      el.setAttribute("role", "img");
      el.setAttribute("aria-label", icon.name);
      field.appendChild(el);

      var maxX = Math.max(0, w - SIZE);
      var maxY = Math.max(0, h - SIZE);
      nodes.push({
        el: el,
        x: Math.random() * maxX,
        y: Math.random() * maxY,
        vx: (Math.random() - 0.5) * 0.9,
        vy: (Math.random() - 0.5) * 0.9,
        angle: (Math.random() - 0.5) * 20,
        angleV: (Math.random() - 0.5) * 0.6,
        pulse: Math.random() * Math.PI * 2
      });
    });
  }

  function render(n) {
    var scale = 1 + Math.sin(n.pulse) * 0.08;
    n.el.style.transform =
      "translate(" + n.x + "px," + n.y + "px) rotate(" + n.angle + "deg) scale(" + scale.toFixed(3) + ")";
  }

  function step() {
    var maxX = Math.max(0, w - SIZE);
    var maxY = Math.max(0, h - SIZE);
    var REPEL = 90;      // px radius
    var CENTER = SIZE / 2;

    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];

      // mouse repel
      if (mouse.active) {
        var dx = (n.x + CENTER) - mouse.x;
        var dy = (n.y + CENTER) - mouse.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL && dist > 0.01) {
          var force = (1 - dist / REPEL) * 0.8;
          n.vx += (dx / dist) * force;
          n.vy += (dy / dist) * force;
        }
      }

      // drift + damping toward a gentle cruising speed
      n.vx *= 0.99;
      n.vy *= 0.99;

      // clamp speed
      var sp = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
      var MAX = 2.6;
      if (sp > MAX) { n.vx = (n.vx / sp) * MAX; n.vy = (n.vy / sp) * MAX; }
      if (sp < 0.15) { // keep a little life
        n.vx += (Math.random() - 0.5) * 0.2;
        n.vy += (Math.random() - 0.5) * 0.2;
      }

      n.x += n.vx;
      n.y += n.vy;

      // bounce off walls
      if (n.x <= 0) { n.x = 0; n.vx = Math.abs(n.vx); }
      else if (n.x >= maxX) { n.x = maxX; n.vx = -Math.abs(n.vx); }
      if (n.y <= 0) { n.y = 0; n.vy = Math.abs(n.vy); }
      else if (n.y >= maxY) { n.y = maxY; n.vy = -Math.abs(n.vy); }

      // rotation + pulse
      n.angle += n.angleV;
      if (n.angle > 22 || n.angle < -22) n.angleV *= -1;
      n.pulse += 0.03;

      render(n);
    }
    raf = requestAnimationFrame(step);
  }

  var raf = null;

  function start() {
    build();
    if (prefersReduced) {
      // place them statically, no animation loop
      nodes.forEach(render);
      return;
    }
    field.addEventListener("mousemove", function (e) {
      var rect = field.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    });
    field.addEventListener("mouseleave", function () { mouse.active = false; });

    window.addEventListener("resize", function () {
      measure();
      var maxX = Math.max(0, w - SIZE);
      var maxY = Math.max(0, h - SIZE);
      nodes.forEach(function (n) {
        n.x = Math.min(n.x, maxX);
        n.y = Math.min(n.y, maxY);
      });
    });

    raf = requestAnimationFrame(step);
  }

  start();
})();

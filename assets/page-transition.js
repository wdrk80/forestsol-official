(function() {
  "use strict";

  var TRANSITION_DURATION = 920;
  var REDUCED_MOTION_DURATION = 180;
  var isLeaving = false;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var style = document.createElement("style");
  style.textContent = [
    ".paw-page-transition {",
    "  position: fixed;",
    "  inset: 0;",
    "  z-index: 99999;",
    "  display: grid;",
    "  place-items: center;",
    "  overflow: hidden;",
    "  visibility: hidden;",
    "  opacity: 0;",
    "  pointer-events: none;",
    "  background:",
    "    radial-gradient(circle at 50% 46%, rgba(255, 255, 244, 0.98) 0 18%, rgba(255, 242, 190, 0.96) 54%, rgba(226, 183, 83, 0.96) 100%);",
    "  backdrop-filter: blur(4px);",
    "  -webkit-backdrop-filter: blur(4px);",
    "}",
    ".paw-page-transition.is-active {",
    "  visibility: visible;",
    "  pointer-events: auto;",
    "  animation: paw-curtain-in 260ms ease-out forwards;",
    "}",
    ".paw-page-transition__sun {",
    "  position: absolute;",
    "  width: min(78vw, 620px);",
    "  aspect-ratio: 1;",
    "  border-radius: 50%;",
    "  background: radial-gradient(circle, rgba(255, 255, 255, 0.72), rgba(255, 218, 107, 0.2) 48%, transparent 70%);",
    "  animation: paw-sun-breathe 2.4s ease-in-out infinite alternate;",
    "}",
    ".paw-page-transition__trail {",
    "  position: relative;",
    "  width: min(86vw, 520px);",
    "  height: 190px;",
    "}",
    ".paw-page-transition__print {",
    "  --paw-x: 0px;",
    "  --paw-y: 0px;",
    "  --paw-rotate: 0deg;",
    "  --paw-delay: 0ms;",
    "  position: absolute;",
    "  left: 50%;",
    "  top: 50%;",
    "  width: 68px;",
    "  height: 68px;",
    "  color: #875020;",
    "  opacity: 0;",
    "  filter: drop-shadow(0 5px 3px rgba(91, 47, 12, 0.2));",
    "  transform: translate(calc(-50% + var(--paw-x)), calc(-50% + var(--paw-y))) rotate(var(--paw-rotate)) scale(0.25);",
    "}",
    ".paw-page-transition__print:nth-child(even) { color: #b67429; }",
    ".paw-page-transition.is-active .paw-page-transition__print {",
    "  animation: paw-print-pop 420ms cubic-bezier(0.18, 0.88, 0.28, 1.28) var(--paw-delay) forwards;",
    "}",
    ".paw-page-transition__print:nth-child(1) { --paw-x: -178px; --paw-y: 56px; --paw-rotate: -19deg; --paw-delay: 90ms; }",
    ".paw-page-transition__print:nth-child(2) { --paw-x: -93px; --paw-y: 8px; --paw-rotate: 17deg; --paw-delay: 230ms; }",
    ".paw-page-transition__print:nth-child(3) { --paw-x: -8px; --paw-y: 48px; --paw-rotate: -17deg; --paw-delay: 370ms; }",
    ".paw-page-transition__print:nth-child(4) { --paw-x: 77px; --paw-y: 0px; --paw-rotate: 18deg; --paw-delay: 510ms; }",
    ".paw-page-transition__print:nth-child(5) { --paw-x: 162px; --paw-y: 40px; --paw-rotate: -16deg; --paw-delay: 650ms; }",
    ".paw-page-transition__print svg {",
    "  display: block;",
    "  width: 100%;",
    "  height: 100%;",
    "  fill: currentColor;",
    "}",
    "html.paw-transition-leaving,",
    "html.paw-transition-leaving body {",
    "  overflow: hidden;",
    "}",
    "@keyframes paw-curtain-in {",
    "  from { opacity: 0; }",
    "  to { opacity: 1; }",
    "}",
    "@keyframes paw-print-pop {",
    "  0% { opacity: 0; transform: translate(calc(-50% + var(--paw-x)), calc(-50% + var(--paw-y))) rotate(var(--paw-rotate)) scale(0.25); }",
    "  62% { opacity: 1; transform: translate(calc(-50% + var(--paw-x)), calc(-50% + var(--paw-y))) rotate(var(--paw-rotate)) scale(1.13); }",
    "  100% { opacity: 1; transform: translate(calc(-50% + var(--paw-x)), calc(-50% + var(--paw-y))) rotate(var(--paw-rotate)) scale(1); }",
    "}",
    "@keyframes paw-sun-breathe {",
    "  from { transform: scale(0.94); opacity: 0.76; }",
    "  to { transform: scale(1.04); opacity: 1; }",
    "}",
    "@media (max-width: 540px) {",
    "  .paw-page-transition__trail { width: 340px; height: 170px; }",
    "  .paw-page-transition__print { width: 55px; height: 55px; }",
    "  .paw-page-transition__print:nth-child(1) { --paw-x: -133px; --paw-y: 52px; }",
    "  .paw-page-transition__print:nth-child(2) { --paw-x: -68px; --paw-y: 10px; }",
    "  .paw-page-transition__print:nth-child(3) { --paw-x: -3px; --paw-y: 46px; }",
    "  .paw-page-transition__print:nth-child(4) { --paw-x: 62px; --paw-y: 4px; }",
    "  .paw-page-transition__print:nth-child(5) { --paw-x: 127px; --paw-y: 40px; }",
    "}",
    "@media (prefers-reduced-motion: reduce) {",
    "  .paw-page-transition.is-active { animation-duration: 120ms; }",
    "  .paw-page-transition__sun { animation: none; }",
    "  .paw-page-transition.is-active .paw-page-transition__print {",
    "    animation: none;",
    "    opacity: 1;",
    "    transform: translate(calc(-50% + var(--paw-x)), calc(-50% + var(--paw-y))) rotate(var(--paw-rotate)) scale(1);",
    "  }",
    "}"
  ].join("\n");
  document.head.appendChild(style);

  function pawMarkup() {
    return [
      '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">',
      '  <ellipse cx="32" cy="42" rx="16" ry="13"></ellipse>',
      '  <ellipse cx="14" cy="28" rx="6" ry="8" transform="rotate(-24 14 28)"></ellipse>',
      '  <ellipse cx="25" cy="18" rx="6" ry="8" transform="rotate(-8 25 18)"></ellipse>',
      '  <ellipse cx="39" cy="18" rx="6" ry="8" transform="rotate(8 39 18)"></ellipse>',
      '  <ellipse cx="50" cy="28" rx="6" ry="8" transform="rotate(24 50 28)"></ellipse>',
      "</svg>"
    ].join("");
  }

  var overlay = document.createElement("div");
  overlay.className = "paw-page-transition";
  overlay.setAttribute("aria-hidden", "true");

  var sun = document.createElement("div");
  sun.className = "paw-page-transition__sun";
  overlay.appendChild(sun);

  var trail = document.createElement("div");
  trail.className = "paw-page-transition__trail";

  for (var i = 0; i < 5; i += 1) {
    var paw = document.createElement("span");
    paw.className = "paw-page-transition__print";
    paw.innerHTML = pawMarkup();
    trail.appendChild(paw);
  }

  overlay.appendChild(trail);
  document.body.appendChild(overlay);

  function shouldTransition(link) {
    if (
      !link ||
      link.hasAttribute("download") ||
      link.dataset.noTransition !== undefined ||
      (link.target && link.target.toLowerCase() !== "_self")
    ) {
      return false;
    }

    var rawHref = link.getAttribute("href");
    if (!rawHref || rawHref.charAt(0) === "#") {
      return false;
    }

    var destination;
    try {
      destination = new URL(link.href, window.location.href);
    } catch (error) {
      return false;
    }

    if (
      destination.origin !== window.location.origin ||
      !/^https?:$/.test(destination.protocol)
    ) {
      return false;
    }

    return destination.href !== window.location.href;
  }

  function beginTransition(destination) {
    if (isLeaving) {
      return;
    }

    isLeaving = true;
    document.documentElement.classList.add("paw-transition-leaving");
    overlay.classList.add("is-active");

    window.setTimeout(function() {
      window.location.href = destination;
    }, reduceMotion ? REDUCED_MOTION_DURATION : TRANSITION_DURATION);
  }

  document.addEventListener("click", function(event) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    var link = event.target.closest("a[href]");
    if (!shouldTransition(link)) {
      return;
    }

    event.preventDefault();
    beginTransition(link.href);
  });

  window.addEventListener("pageshow", function() {
    isLeaving = false;
    document.documentElement.classList.remove("paw-transition-leaving");
    overlay.classList.remove("is-active");
  });
})();

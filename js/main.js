import { initFlow } from "./flow.js";
import { initWeek, initTerminal, initRoi } from "./widgets.js";

// Contact handle lives here only; every [data-tg] link picks it up.
const TELEGRAM_HANDLE = "your_handle";
const THEME_KEY = "offload-theme";

const root = document.documentElement;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function readTheme() {
  try {
    return window.localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

function saveTheme(theme) {
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage blocked (private mode): the toggle still works for this visit.
  }
}

function initTheme() {
  const saved = readTheme();
  if (saved === "light" || saved === "dark") root.dataset.theme = saved;
  const button = document.querySelector(".theme-toggle");
  if (!button) return;
  button.addEventListener("click", () => {
    const current = root.dataset.theme ?? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    const next = current === "light" ? "dark" : "light";
    root.dataset.theme = next;
    saveTheme(next);
  });
}

function initReveal() {
  const items = [...document.querySelectorAll("[data-reveal]")];
  items.forEach((item) => {
    const siblings = [...item.parentElement.children].filter((c) => c.hasAttribute("data-reveal"));
    item.style.setProperty("--reveal-i", String(siblings.indexOf(item)));
  });
  if (reducedMotion) {
    items.forEach((item) => item.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.filter((e) => e.isIntersecting).forEach((e) => {
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      });
    },
    { rootMargin: "0px 0px -12% 0px" },
  );
  items.forEach((item) => io.observe(item));
}

function initContactLinks() {
  // Until a real handle is set, links keep their working #contact fallback.
  if (TELEGRAM_HANDLE === "your_handle") return;
  document.querySelectorAll("[data-tg]").forEach((link) => {
    link.href = `https://t.me/${TELEGRAM_HANDLE}`;
    link.target = "_blank";
    link.rel = "noopener";
  });
}

root.classList.add("js");
initTheme();
initReveal();
initContactLinks();
initFlow(document.querySelector("#flow"), { reducedMotion });
initWeek(document.querySelector("#week .week"));
initTerminal(document.querySelector("#term"), { reducedMotion });
initRoi(document.querySelector("#roi"));

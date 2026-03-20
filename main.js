import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Mobile menu
const menuBtn = document.getElementById("mobile-menu-btn");
const mobileNav = document.getElementById("mobile-nav");
if (menuBtn && mobileNav) {
  menuBtn.addEventListener("click", () => {
    menuBtn.classList.toggle("open");
    mobileNav.classList.toggle("open");
  });
  mobileNav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      menuBtn.classList.remove("open");
      mobileNav.classList.remove("open");
    });
  });
}

// Nav background on scroll
const nav = document.getElementById("nav");
window.addEventListener("scroll", () => {
  nav.classList.toggle("scrolled", window.scrollY > 60);
}, { passive: true });

// Stats count-up
function countUp(el, target, prefix, suffix, duration) {
  const start = performance.now();
  function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 4);
    el.textContent = (prefix || "") + Math.round(eased * target) + (suffix || "");
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = (prefix || "") + target + (suffix || "");
  }
  requestAnimationFrame(tick);
}

const statsSection = document.querySelector(".stats-grid");
if (statsSection) {
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.querySelectorAll(".stat-num").forEach(el => {
        const val = parseInt(el.dataset.val, 10);
        if (!isNaN(val)) countUp(el, val, el.dataset.prefix || "", el.dataset.suffix || "", 1400);
      });
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.4 });
  observer.observe(statsSection);
}

// Countdown timer
const cdEls = {
  d: document.getElementById("cd-days"),
  h: document.getElementById("cd-hours"),
  m: document.getElementById("cd-mins"),
  s: document.getElementById("cd-secs"),
};

function updateCountdown() {
  if (!cdEls.d) return;
  const dist = new Date("September 19, 2026 09:00:00").getTime() - Date.now();
  if (dist < 0) { cdEls.d.textContent = cdEls.h.textContent = cdEls.m.textContent = cdEls.s.textContent = "00"; return; }
  const pad = n => n.toString().padStart(2, "0");
  cdEls.d.textContent = pad(Math.floor(dist / 86400000));
  cdEls.h.textContent = pad(Math.floor((dist % 86400000) / 3600000));
  cdEls.m.textContent = pad(Math.floor((dist % 3600000) / 60000));
  cdEls.s.textContent = pad(Math.floor((dist % 60000) / 1000));
}
setInterval(updateCountdown, 1000);
updateCountdown();

// Netlify form submissions with feedback
function setupNetlifyForm(formId, successMsg) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.noValidate = true;

  const getFields = () => Array.from(
    form.querySelectorAll("input:not([type='hidden']), textarea, select")
  );

  let invalidTimer = null;
  let invalidSet = new Set();
  let lastInvalidShownAt = 0;

  const clearInvalid = () => {
    invalidSet.forEach(el => el.classList.remove("invalid"));
    invalidSet = new Set();
    if (invalidTimer) clearTimeout(invalidTimer);
    invalidTimer = null;
    form.classList.remove("has-invalid");
  };

  const setInvalid = (invalidFields, fadeMs = 2200) => {
    clearInvalid();
    invalidSet = new Set(invalidFields);
    invalidFields.forEach(el => el.classList.add("invalid"));
    lastInvalidShownAt = performance.now();
    form.classList.add("has-invalid");
    invalidTimer = setTimeout(() => {
      clearInvalid();
    }, fadeMs);
  };

  const refreshValidity = () => {
    const stillInvalid = getFields().filter(el => !el.checkValidity());
    if (stillInvalid.length === 0) clearInvalid();
  };

  // If the user fixes the form fully, clear all red outlines together.
  getFields().forEach(el => {
    if (el.tagName.toLowerCase() === "select") el.addEventListener("change", refreshValidity);
    else el.addEventListener("input", refreshValidity);
  });

  // Clicking anywhere on the page dismisses current invalid outlines.
  document.addEventListener("click", () => {
    if (invalidSet.size === 0) return;
    // Prevent the same click that triggered submit from instantly clearing errors.
    if (performance.now() - lastInvalidShownAt < 150) return;
    clearInvalid();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearInvalid();
    const invalidFields = getFields().filter(el => !el.checkValidity());
    if (invalidFields.length) {
      // Don't auto-focus/select anything; just show synced error outlines.
      setInvalid(invalidFields);
      return;
    }

    const data = new URLSearchParams(new FormData(form));

    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: data.toString(),
    })
      .then(res => {
        if (!res.ok) throw new Error("Form submission failed");
        const btn = form.querySelector("button[type='submit']");
        const orig = btn.textContent;
        btn.textContent = successMsg;
        btn.disabled = true;
        getFields().forEach(el => { el.disabled = true; });
        setTimeout(() => {
          btn.textContent = orig;
          btn.disabled = false;
          form.reset();
          getFields().forEach(el => { el.disabled = false; });
          clearInvalid();
        }, 3000);
      })
      .catch(() => {
        const btn = form.querySelector("button[type='submit']");
        btn.textContent = "ERROR - TRY AGAIN";
        setTimeout(() => { btn.textContent = btn.dataset.orig || "SUBMIT"; }, 3000);
      });
  });
}

setupNetlifyForm("notify-form", "YOU'RE IN!");
setupNetlifyForm("apply-form", "APPLICATION SENT!");
setupNetlifyForm("contact-form", "MESSAGE SENT!");

// Hero entrance animations (trigger on page load)
const heroEl = document.getElementById("hero");
if (heroEl) heroEl.classList.add("is-animating");
document.querySelectorAll(".hero-anim").forEach(el => {
  el.classList.add("is-animating");
});

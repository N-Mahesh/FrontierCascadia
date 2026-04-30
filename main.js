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

  form.addEventListener("submit", (e) => {
    e.preventDefault();
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
        form.querySelectorAll("input:not([type='hidden']), textarea, select").forEach(el => { el.disabled = true; });
        setTimeout(() => {
          btn.textContent = orig;
          btn.disabled = false;
          form.reset();
          form.querySelectorAll("input:not([type='hidden']), textarea, select").forEach(el => { el.disabled = false; });
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

// FAQ accordion (single-open behavior)
function setupFaqAccordion() {
  const accordion = document.getElementById("faq-accordion");
  if (!accordion) return;

  const items = accordion.querySelectorAll(".accordion-item");
  if (!items.length) return;

  items.forEach(item => {
    const button = item.querySelector(".accordion-button");
    if (!button) return;

    button.addEventListener("click", () => {
      const isOpen = button.getAttribute("aria-expanded") === "true";

      // Close all items first (keeps behavior consistent)
      items.forEach(other => {
        const otherButton = other.querySelector(".accordion-button");
        if (!otherButton) return;
        otherButton.setAttribute("aria-expanded", "false");
        other.classList.remove("open");
      });

      // Toggle the clicked item (re-open only if it was previously closed)
      if (!isOpen) {
        button.setAttribute("aria-expanded", "true");
        item.classList.add("open");
      }
    });
  });
}

setupFaqAccordion();

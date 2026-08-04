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
function updateScrollUiState() {
  const isScrolled = window.scrollY > 60;
  nav.classList.toggle("scrolled", isScrolled);
  document.body.classList.toggle("marquee-visible", isScrolled);
}
window.addEventListener("scroll", updateScrollUiState, { passive: true });
updateScrollUiState();

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
  const dist = new Date("September 12, 2026 09:00:00").getTime() - Date.now();
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
function setupNetlifyForm(formId, successMsg, opts) {
  const form = document.getElementById(formId);
  if (!form) return;
  const sticky = !!(opts && opts.sticky);

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
        // A registration is a one-shot thing. Leave it submitted rather than
        // wiping four steps of answers a few seconds later.
        if (sticky) { form.classList.add("is-submitted"); return; }
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
setupNetlifyForm("contact-form", "MESSAGE SENT!");

// =============================================================
// Multi-step registration
// =============================================================
// The form ships as one <form> with every field in the static HTML so
// Netlify's build-time parser still sees all of them. Only one fieldset is
// in the flow at a time, which means native `required` would try to focus
// hidden controls on submit, so validation is driven off `data-required`
// with `novalidate` on the form.
(function setupRegistration() {
  const form = document.getElementById("register-form");
  if (!form) return;

  const panels = Array.from(form.querySelectorAll(".reg-panel"));
  const steps = Array.from(form.querySelectorAll(".reg-step"));
  const fill = document.getElementById("reg-progress-fill");
  const summary = document.getElementById("reg-error-summary");
  let current = 0;

  const fieldOf = el => el.closest(".reg-field") || el.closest(".reg-conditional");

  function clearError(el) {
    const field = fieldOf(el);
    if (!field) return;
    field.classList.remove("is-invalid");
    field.querySelector(".reg-error")?.remove();
  }

  function showError(el, message) {
    const field = fieldOf(el);
    if (!field || field.querySelector(".reg-error")) return;
    field.classList.add("is-invalid");
    const note = document.createElement("span");
    note.className = "reg-error";
    note.textContent = message;
    field.appendChild(note);
  }

  // A control counts as answered if it has a value; radio groups need any
  // one member checked, and the consent box needs to be ticked.
  function validatePanel(panel) {
    let firstBad = null;
    panel.querySelectorAll("[data-required]").forEach(el => {
      if (el.closest(".reg-conditional:not(.is-visible)")) return;
      clearError(el);

      let ok = true;
      let message = "This one's required.";

      if (el.type === "radio") {
        ok = !!form.querySelector(`input[name="${el.name}"]:checked`);
        message = "Pick one.";
      } else if (el.type === "checkbox") {
        ok = el.checked;
        message = "We need this to register you.";
      } else if (!el.value.trim()) {
        ok = false;
      } else if (el.dataset.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim())) {
        ok = false;
        message = "That email doesn't look right.";
      }

      if (!ok) {
        showError(el, message);
        if (!firstBad) firstBad = el;
      }
    });

    // URLs are optional, but a typo'd one is worse than a blank one.
    panel.querySelectorAll('[data-type="url"]').forEach(el => {
      const value = el.value.trim();
      if (!value) { clearError(el); return; }
      clearError(el);
      if (!/^https?:\/\/[^\s.]+\.[^\s]{2,}$/.test(value)) {
        showError(el, "Include the full URL, starting with https://");
        if (!firstBad) firstBad = el;
      }
    });

    return firstBad;
  }

  function goTo(index) {
    current = index;
    panels.forEach((p, i) => p.classList.toggle("is-active", i === index));
    steps.forEach((s, i) => {
      s.classList.toggle("is-active", i === index);
      s.classList.toggle("is-done", i < index);
    });
    if (fill) fill.style.width = `${((index + 1) / panels.length) * 100}%`;
    if (summary) summary.hidden = true;

    const heading = panels[index].querySelector(".reg-legend");
    if (heading) {
      const top = form.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }

  form.querySelectorAll("[data-next]").forEach(btn => {
    btn.addEventListener("click", () => {
      const bad = validatePanel(panels[current]);
      if (bad) {
        if (summary) {
          summary.hidden = false;
          summary.textContent = "A couple of things need fixing before you continue.";
        }
        bad.focus({ preventScroll: true });
        bad.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      goTo(Math.min(current + 1, panels.length - 1));
    });
  });

  form.querySelectorAll("[data-back]").forEach(btn => {
    btn.addEventListener("click", () => goTo(Math.max(current - 1, 0)));
  });

  // Clicking a completed chip jumps back to that step.
  steps.forEach((step, i) => {
    step.addEventListener("click", () => { if (i < current) goTo(i); });
  });

  // Live character counters keep the short answers honest.
  form.querySelectorAll("[data-counter]").forEach(el => {
    const max = parseInt(el.getAttribute("maxlength"), 10);
    if (!max) return;
    const counter = document.createElement("span");
    counter.className = "reg-counter";
    const paint = () => {
      const left = max - el.value.length;
      counter.textContent = `${left} left`;
      counter.classList.toggle("is-near", left <= 40);
    };
    el.insertAdjacentElement("afterend", counter);
    el.addEventListener("input", paint);
    paint();
  });

  // Follow-up fields appear only once their trigger answer is chosen.
  form.querySelectorAll(".reg-conditional").forEach(block => {
    const [name, value] = (block.dataset.showWhen || "").split("=");
    if (!name) return;
    const sync = () => {
      const picked = form.querySelector(`input[name="${name}"]:checked`);
      block.classList.toggle("is-visible", !!picked && picked.value === value);
    };
    form.querySelectorAll(`input[name="${name}"]`).forEach(input => {
      input.addEventListener("change", sync);
    });
    sync();
  });

  // Clear an error as soon as the person starts fixing it.
  form.addEventListener("input", e => clearError(e.target));
  form.addEventListener("change", e => clearError(e.target));

  // Final gate: check every panel, not just the last one.
  form.addEventListener("submit", e => {
    for (let i = 0; i < panels.length; i++) {
      const bad = validatePanel(panels[i]);
      if (!bad) continue;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (i !== current) goTo(i);
      if (summary) {
        summary.hidden = false;
        summary.textContent = "Something on this step still needs an answer.";
      }
      bad.focus({ preventScroll: true });
      bad.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
  }, true);
})();

// Registered last on purpose: listeners on the event target run in the order
// they were added, so validation above gets to veto the POST.
setupNetlifyForm("register-form", "YOU'RE REGISTERED!", { sticky: true });

// =============================================================
// Hype layer: entrance, parallax, scroll reveals
// =============================================================
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!prefersReduced) {
  const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
  heroTl
    .from(".hero-eyebrow", { y: 16, opacity: 0, duration: 0.6 })
    .from(".hero-line-1", { y: 80, opacity: 0, duration: 1.0 }, "-=0.3")
    .from(".hero-line-2", { y: 80, opacity: 0, duration: 1.0 }, "-=0.75")
    .from(".hero-sub", { y: 16, opacity: 0, duration: 0.6 }, "-=0.5")
    .from(".hero-right .meta-item", { y: 14, opacity: 0, duration: 0.5, stagger: 0.08 }, "-=0.55")
    .from(".countdown-timer", { y: 14, opacity: 0, duration: 0.5 }, "-=0.3")
    .from(".hero-actions", { y: 14, opacity: 0, duration: 0.5 }, "-=0.35")
    .from(".email-capture", { y: 14, opacity: 0, duration: 0.5 }, "-=0.4")
    .from(".scroll-cue", { opacity: 0, duration: 0.6 }, "-=0.2");

  gsap.to(".mtn-far", {
    yPercent: -10, ease: "none",
    scrollTrigger: { trigger: ".hero-section", start: "top top", end: "bottom top", scrub: 0.5 }
  });
  gsap.to(".mtn-mid", {
    yPercent: -22, ease: "none",
    scrollTrigger: { trigger: ".hero-section", start: "top top", end: "bottom top", scrub: 0.5 }
  });
  gsap.to(".mtn-near", {
    yPercent: -36, ease: "none",
    scrollTrigger: { trigger: ".hero-section", start: "top top", end: "bottom top", scrub: 0.5 }
  });

  const revealSelectors = [
    ".section .section-title",
    ".manifesto-right > p",
    ".grand-prize",
    ".schedule-row",
    ".faq-item",
    ".founder-card",
    ".board-member",
    ".prizes-subtitle",
    ".prizes-credits",
    ".sponsors-subtitle",
    ".venue-card",
    ".sponsors-cta",
    ".what-desc",
    ".contact-desc",
    ".contact-form",
    ".reg-form",
    ".cta-sub",
    ".fine-print",
  ];
  revealSelectors.forEach(sel => {
    gsap.utils.toArray(sel).forEach(el => {
      gsap.from(el, {
        y: 32,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none none" }
      });
    });
  });

  // Rotation entrances: section labels flip in around X-axis
  gsap.utils.toArray(".section-label").forEach(el => {
    gsap.from(el, {
      rotationX: -90,
      opacity: 0,
      transformOrigin: "center bottom",
      transformPerspective: 600,
      duration: 0.9,
      ease: "back.out(1.5)",
      scrollTrigger: { trigger: el, start: "top 90%", toggleActions: "play none none none" }
    });
  });

  // Stat numbers rise in cleanly with the count-up.
  gsap.utils.toArray(".stat-num").forEach((el, i) => {
    gsap.from(el, {
      y: 14,
      opacity: 0,
      duration: 0.55,
      delay: i * 0.08,
      ease: "power3.out",
      scrollTrigger: { trigger: ".stats-grid", start: "top 85%", toggleActions: "play none none none" }
    });
  });

  // What-cards slide in without 3D swivel.
  gsap.utils.toArray(".what-card").forEach((el, i) => {
    gsap.from(el, {
      x: -22,
      opacity: 0,
      duration: 0.65,
      delay: i * 0.07,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none none" }
    });
  });

  // Prize cards settle upward in a stagger instead of fanning in.
  gsap.utils.toArray(".prize-card").forEach((el, i) => {
    gsap.from(el, {
      y: 24,
      opacity: 0,
      duration: 0.65,
      delay: (i % 6) * 0.06,
      ease: "power3.out",
      scrollTrigger: { trigger: ".prizes-grid", start: "top 85%", toggleActions: "play none none none" }
    });
  });

  // Stat cells use the same restrained upward reveal as other tiles.
  gsap.utils.toArray(".stat-cell").forEach((el, i) => {
    gsap.from(el, {
      y: 20,
      opacity: 0,
      duration: 0.6,
      delay: i * 0.08,
      ease: "power3.out",
      scrollTrigger: { trigger: ".stats-grid", start: "top 85%", toggleActions: "play none none none" }
    });
  });

  // Sponsor cards settle upward in a stagger.
  gsap.utils.toArray(".sponsor-card").forEach((el, i) => {
    gsap.from(el, {
      y: 28,
      opacity: 0,
      duration: 0.7,
      delay: i * 0.1,
      ease: "power3.out",
      scrollTrigger: { trigger: ".sponsors-grid", start: "top 85%", toggleActions: "play none none none" }
    });
  });

  // Sponsor cards: cursor-tracked spotlight plus a subtle 3D tilt toward the pointer.
  document.querySelectorAll(".sponsor-card").forEach(card => {
    card.addEventListener("mousemove", e => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      card.style.setProperty("--mx", `${px * 100}%`);
      card.style.setProperty("--my", `${py * 100}%`);
      gsap.to(card, {
        rotationY: (px - 0.5) * 7,
        rotationX: -(py - 0.5) * 7,
        y: -6,
        transformPerspective: 1000,
        duration: 0.5,
        ease: "power2.out"
      });
    });
    card.addEventListener("mouseleave", () => {
      gsap.to(card, { rotationX: 0, rotationY: 0, y: 0, duration: 0.7, ease: "power3.out" });
    });
  });

  // Venue card: spotlight only. It is too wide for a tilt to read as anything
  // but a wobble, so it tracks the cursor without moving.
  document.querySelectorAll(".venue-card").forEach(card => {
    card.addEventListener("mousemove", e => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${((e.clientX - rect.left) / rect.width) * 100}%`);
      card.style.setProperty("--my", `${((e.clientY - rect.top) / rect.height) * 100}%`);
    });
  });

  // Hero title 3D mouse parallax
  const heroTitle = document.querySelector(".hero-title");
  if (heroTitle) {
    document.addEventListener("mousemove", e => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      gsap.to(heroTitle, {
        rotationY: x * 5,
        rotationX: -y * 4,
        transformPerspective: 1200,
        duration: 1.0,
        ease: "power2.out"
      });
    });
  }

  // Magnetic buttons: pull toward cursor when hovered
  function magnetize(selector, strength) {
    document.querySelectorAll(selector).forEach(btn => {
      btn.addEventListener("mousemove", e => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - (rect.left + rect.width / 2);
        const y = e.clientY - (rect.top + rect.height / 2);
        gsap.to(btn, { x: x * strength, y: y * strength, duration: 0.4, ease: "power2.out" });
      });
      btn.addEventListener("mouseleave", () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1.2, 0.5)" });
      });
    });
  }
  magnetize(".btn-cta", 0.3);
  magnetize(".btn-hero", 0.25);
  magnetize(".btn-notify", 0.2);

  // Marquee speed-up on hover instead of pause
  const marqueeTrack = document.querySelector(".marquee-track");
  if (marqueeTrack) {
    marqueeTrack.parentElement.addEventListener("mouseenter", () => {
      marqueeTrack.style.animationDuration = "15s";
    });
    marqueeTrack.parentElement.addEventListener("mouseleave", () => {
      marqueeTrack.style.animationDuration = "45s";
    });
  }

  // The 800vh Claude Code intro plus late-loading webfonts shift the page
  // geometry after ScrollTrigger first measures it, which can leave the
  // prize / what / stat tile entry animations triggering at the wrong
  // scroll position (often off-screen, so the tiles never appear to
  // animate in). Recompute trigger positions once fonts and assets settle.
  window.addEventListener("load", () => ScrollTrigger.refresh());
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
}

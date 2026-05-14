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
    ".what-desc",
    ".contact-desc",
    ".contact-form",
    ".apply-form",
    ".cta-sub",
    ".btn-cta",
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

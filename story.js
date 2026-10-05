/* =============================================================
   Frontier Cascadia: the story.
   Scroll-driven, no dependencies. Picks a mode on load and resize:
   - overlay: the laptop intro (#act-os) is showing, so the story
     plays in its side margins, timed to the intro's scroll.
   - solo:    no laptop intro, so #fc-story is its own short scroll
     ahead of the site.
   ============================================================= */
const story = document.getElementById('fc-story');
const actOs = document.getElementById('act-os');

if (story) {
  const stage = story.querySelector('.story-sticky');
  const beats = [...story.querySelectorAll('.story-beat')];
  const dotsEl = story.querySelector('#story-dots');
  const hintEl = story.querySelector('.story-hint');

  // The share of the laptop intro's scroll the story plays across. It
  // starts once the lid is lifting and finishes before the camera dives
  // into the screen, which fills the margins.
  const OVERLAY_RANGE = [0.03, 0.86];
  const OVERLAY_FADE = 0.03;
  // Laptop footprint on screen (the keyboard deck flares out to ~705px
  // in perspective) plus a little air.
  const LAPTOP_W = 740;

  story.style.setProperty('--beats', beats.length);

  /* ------------- Swarm: lots of little hackathons ------------- */
  // A tiny seeded random, so the swarm lands the same way every visit.
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  beats.forEach((beat) => {
    const words = beat.dataset.swarm;
    if (!words) return;
    const list = words.split('|');
    const count = list.length * 2;
    for (let i = 0; i < count; i++) {
      const el = document.createElement('span');
      el.className = 'story-bubble is-swarm';
      el.textContent = list[i % list.length];
      el.style.setProperty('--r', `${(rand() * 12 - 6).toFixed(1)}deg`);
      el.style.setProperty('--o', (0.45 + rand() * 0.5).toFixed(2));
      // Every other one is dropped on small screens to keep it legible.
      if (i % 2) el.classList.add('is-minor');
      beat.appendChild(el);
    }
  });

  const bubblesOf = beats.map((b) => [...b.querySelectorAll('.story-bubble')]);
  bubblesOf.forEach((list) => list.forEach((el, i) => {
    el.style.setProperty('--fd', `${(-(i * 0.7) % 4).toFixed(2)}s`);
  }));

  beats.forEach(() => dotsEl.appendChild(document.createElement('span')));
  const dots = [...dotsEl.children];

  /* ------------- Mode ------------- */
  let mode = null;
  // offsetHeight, not display: intro.css hides the intro's wrapper, not
  // #act-os itself, so its own computed display never reads 'none'.
  const pickMode = () => (actOs && actOs.offsetHeight > 0 ? 'overlay' : 'solo');

  /* ------------- Layout: where each bubble goes ------------- */
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  function layoutSolo() {
    const W = stage.clientWidth;
    const H = stage.clientHeight;
    beats.forEach((beat, bi) => {
      bubblesOf[bi].forEach((el) => {
        el.style.removeProperty('--bw');
        if (el.classList.contains('is-swarm')) return;
        {
          el.style.setProperty('--px', `${(parseFloat(el.style.getPropertyValue('--x')) / 100) * W}px`);
          el.style.setProperty('--py', `${(parseFloat(el.style.getPropertyValue('--y')) / 100) * H}px`);
        }
      });
      if (beat.dataset.swarm) {
        // Anywhere on screen but the band where the line sits.
        placeSwarm(beat, (r) => [(0.04 + r() * 0.92) * W, (0.06 + r() * 0.84) * H], W, H);
      }
    });
    keepInside(W, H);
  }

  function layoutOverlay() {
    const W = stage.clientWidth;
    const H = stage.clientHeight;
    const mw = Math.max(180, (W - LAPTOP_W) / 2);
    story.style.setProperty('--mw', `${mw}px`);

    beats.forEach((beat, bi) => {
      const side = bi % 2 ? 'right' : 'left';
      beat.dataset.side = side;
      const lineX = side === 'left' ? mw / 2 : W - mw / 2;
      const otherX = side === 'left' ? W - mw / 2 : mw / 2;
      const bw = `${mw - 32}px`;

      const list = bubblesOf[bi];
      if (beat.dataset.swarm) {
        // Fill both margins, leaving the line's own spot clear.
        placeSwarm(beat, (r) => {
          const x = r() < 0.4 ? lineX : otherX;
          return [x + (r() - 0.5) * (mw - 40), (0.07 + r() * 0.8) * H];
        }, W, H);
      } else {
        // Up to four stacked in the opposite margin, the rest above and
        // below the line on its own side.
        const FAR = [0.18, 0.39, 0.61, 0.82];
        const NEAR = [0.13, 0.87];
        const farCount = Math.min(FAR.length, Math.max(list.length - NEAR.length, Math.ceil(list.length / 2)));
        list.forEach((el, i) => {
          let x; let y;
          if (i < farCount) {
            x = otherX + (i % 2 ? 1 : -1) * mw * 0.1;
            y = FAR[Math.round((i * (FAR.length - 1)) / Math.max(1, farCount - 1))];
          } else {
            x = lineX;
            y = NEAR[(i - farCount) % NEAR.length];
          }
          el.style.setProperty('--px', `${x}px`);
          el.style.setProperty('--py', `${y * H}px`);
          el.style.setProperty('--bw', bw);
        });
      }
    });
    keepInside(W, H);
  }

  // Drop each swarm bubble at the first candidate spot that clears the
  // line and every bubble already placed. One that finds no room sits this
  // layout out. Seeded per beat, so the swarm lands the same way each time.
  function placeSwarm(beat, candidate, W, H) {
    let s = 11;
    const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const stageBox = stage.getBoundingClientRect();
    const lineBox = beat.querySelector('.story-line').getBoundingClientRect();
    const gap = 8;
    const taken = [{
      l: lineBox.left - stageBox.left - 16, r: lineBox.right - stageBox.left + 16,
      t: lineBox.top - stageBox.top - 40, b: lineBox.bottom - stageBox.top + 40,
    }, {
      // The skip button pinned in the top-right corner.
      l: W - 220, r: W, t: 0, b: 76,
    }];
    const swarm = [...beat.querySelectorAll('.story-bubble.is-swarm')];
    swarm.forEach((el) => el.classList.remove('is-dropped'));
    swarm.forEach((el) => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (!w) return; // hidden at this width (.is-minor)
      let spot = null;
      for (let k = 0; k < 60 && !spot; k++) {
        let [x, y] = candidate(r);
        x = clamp(x, w / 2 + 12, W - w / 2 - 12);
        y = clamp(y, h / 2 + 12, H - h / 2 - 12);
        const box = { l: x - w / 2 - gap, r: x + w / 2 + gap, t: y - h / 2 - gap, b: y + h / 2 + gap };
        if (!taken.some((o) => box.l < o.r && box.r > o.l && box.t < o.b && box.b > o.t)) {
          spot = [x, y];
          taken.push(box);
        }
      }
      el.classList.toggle('is-dropped', !spot);
      if (spot) {
        el.style.setProperty('--px', `${spot[0]}px`);
        el.style.setProperty('--py', `${spot[1]}px`);
      }
    });
  }

  // Nudge any bubble that would poke past the stage edge back inside.
  function keepInside(W, H) {
    const pad = 12;
    bubblesOf.flat().forEach((el) => {
      if (el.classList.contains('is-swarm')) return;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const x = parseFloat(el.style.getPropertyValue('--px'));
      const y = parseFloat(el.style.getPropertyValue('--py'));
      el.style.setProperty('--px', `${clamp(x, w / 2 + pad, W - w / 2 - pad)}px`);
      el.style.setProperty('--py', `${clamp(y, h / 2 + pad, H - h / 2 - pad)}px`);
    });
  }

  function applyMode() {
    const next = pickMode();
    if (next !== mode) {
      mode = next;
      story.classList.toggle('is-overlay', mode === 'overlay');
      story.classList.toggle('is-solo', mode === 'solo');
    }
    if (mode === 'overlay') layoutOverlay();
    else layoutSolo();
  }

  /* ------------- Scroll ------------- */
  // Story progress (0..1 across all beats) -> classes on beats and bubbles.
  function render(sp, holdLast) {
    const n = beats.length;
    const pos = sp * n;
    beats.forEach((beat, bi) => {
      const t = pos - bi;
      const last = bi === n - 1;
      const isIn = t >= 0.02 && (t < 1 || last);
      const isOut = t >= 0.92 && !(last && holdLast);
      beat.classList.toggle('is-in', isIn);
      beat.classList.toggle('is-out', isIn && isOut);
      const list = bubblesOf[bi];
      const spread = beat.dataset.swarm ? 0.6 : 0.5;
      list.forEach((el, i) => {
        const at = 0.12 + (i / Math.max(1, list.length)) * spread;
        el.classList.toggle('is-on', isIn && t >= at);
      });
    });
    const current = clamp(Math.floor(pos), 0, n - 1);
    dots.forEach((d, i) => d.classList.toggle('is-on', i === current));
    if (hintEl) hintEl.textContent = current === n - 1 ? 'Scroll into the site' : 'Keep scrolling';
  }

  function onScroll() {
    if (mode === 'overlay') {
      const rect = actOs.getBoundingClientRect();
      const total = actOs.offsetHeight - window.innerHeight;
      const p = clamp(-rect.top / total, 0, 1);
      const pinned = rect.top <= 0 && rect.bottom >= window.innerHeight;
      const [a, b] = OVERLAY_RANGE;
      const fadeIn = clamp((p - a) / OVERLAY_FADE, 0, 1);
      const fadeOut = clamp((b + OVERLAY_FADE - p) / OVERLAY_FADE, 0, 1);
      const o = pinned ? Math.min(fadeIn, fadeOut) : 0;
      stage.style.setProperty('--stage-o', o.toFixed(3));
      story.classList.toggle('is-live', o > 0);
      render(clamp((p - a) / (b - a), 0, 1), true);
      return;
    }

    // Solo: the section is its own scroll.
    const rect = story.getBoundingClientRect();
    const total = story.offsetHeight - window.innerHeight;
    const p = clamp(-rect.top / total, 0, 1);
    // Leave a little runway after the last beat so it can be read.
    render(clamp(p / 0.9, 0, 0.999), true);
    // The story owns the viewport until it scrolls away; hide the nav.
    document.documentElement.classList.toggle('intro-active', rect.bottom > window.innerHeight);
    if (p >= 1) {
      try { localStorage.setItem('fc-intro-seen', '1'); } catch (e) {}
    }
  }

  let raf = null;
  const schedule = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = null; onScroll(); });
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', () => { applyMode(); schedule(); });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { applyMode(); onScroll(); });
  }
  applyMode();
  onScroll();

  /* ------------- Skip (solo mode) ------------- */
  const skip = story.querySelector('.story-skip');
  if (skip) {
    skip.addEventListener('click', (e) => {
      const hero = document.getElementById('hero');
      if (!hero) return;
      e.preventDefault();
      try { localStorage.setItem('fc-intro-seen', '1'); } catch (err) {}
      const prev = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';
      hero.scrollIntoView();
      document.documentElement.style.scrollBehavior = prev;
    });
  }
}

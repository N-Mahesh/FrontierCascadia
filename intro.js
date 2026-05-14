/* =============================================================
   Frontier Cascadia: Claude Code intro (ACT 1) choreography.
   Pure scroll-driven, no dependencies. Drives only the #act-os
   section, then hands off to the live site below it.
   ============================================================= */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const actOs = $('#act-os');

// The 3D stage needs real horizontal room. On narrow screens intro.css
// hides .cc-intro, so there is nothing to drive here.
if (actOs && getComputedStyle(actOs).display !== 'none') {

  /* ------------- macOS menu-bar clock ------------- */
  function tickClock() {
    const osc = $('#os-clock');
    if (!osc) return;
    const now = new Date();
    let h = now.getHours();
    const m = now.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12; if (h === 0) h = 12;
    osc.textContent = `${h}:${String(m).padStart(2, '0')} ${ampm}`;
  }
  setInterval(tickClock, 1000);
  tickClock();

  /* ------------- The prompt to type ------------- */
  const PROMPT_TEXT = "build me a website for Frontier Cascadia, Seattle's high school hackathon. Sept 19, 2026. Twelve hours. Editorial design with serif display, deep forest greens and a gold accent.";

  const promptEl = $('#cc-prompt');
  const ccBodyEl = $('#cc-body');
  const afterPromptEl = $('#cc-after-prompt');
  const cursor = document.createElement('span');
  cursor.className = 'cc-cursor';
  promptEl.appendChild(cursor);

  /* ------------- Build "thinking + tool use" stream ------------- */
  const STREAM = [
    { type:'spacer' },
    { type:'muted', text:'⏺ Thinking…' },
    { type:'muted', text:'   Reading project context, brand references, and existing assets.' },
    { type:'spacer' },
    { type:'tool',  text:'WebFetch(terminal-industries.com)' },
    { type:'muted', text:'    └─ editorial layout, marquee hero, deep ink + gold' },
    { type:'tool',  text:'Read(uploads/FrontierCascadia/README.md)' },
    { type:'muted', text:'    └─ event details, prize structure, schedule' },
    { type:'spacer' },
    { type:'bot',   text:'I\'ll build this as a single editorial site with:' },
    { type:'muted', text:'  • Instrument Serif display + JetBrains Mono UI' },
    { type:'muted', text:'  • Deep forest #0F1611 + paper #F4EFE5 + gold #C9A84C' },
    { type:'muted', text:'  • Marquee, manifesto, stats, prizes grid, schedule, FAQ, apply' },
    { type:'spacer' },
    { type:'tool',  text:'Write(index.html)' },
    { type:'add',   text:'<section class="fc-hero"> Frontier Cascadia. </section>' },
    { type:'add',   text:'<section id="manifesto"> Build what\'s next. </section>' },
    { type:'add',   text:'<section id="prizes"> $10,000 in cash, real money. </section>' },
    { type:'success', text:'Wrote index.html · 287 lines' },
    { type:'spacer' },
    { type:'tool',  text:'Write(styles.css)' },
    { type:'add',   text:':root { --ink:#0F1611; --paper:#F4EFE5; --gold:#C9A84C; }' },
    { type:'add',   text:'.h-section { font-family: var(--serif); font-size: clamp(44px, 6.5vw, 96px); }' },
    { type:'success', text:'Wrote styles.css · 612 lines' },
    { type:'spacer' },
    { type:'tool',  text:'Write(app.js)' },
    { type:'add',   text:'IntersectionObserver: reveal sections on scroll' },
    { type:'add',   text:'requestAnimationFrame: countdown to Sept 19, 2026' },
    { type:'success', text:'Wrote app.js · 142 lines' },
    { type:'spacer' },
    { type:'bot bold', text:'✻ Build complete.' },
    { type:'muted', text:'   Site is ready. Keep scrolling to see it live.' },
  ];

  /* ------------- Scroll progress ------------- */
  const os    = $('#os');
  const laptopScreen = $('.l-screen');
  const ccWin = $('#cc-win');
  const stream = $('#cc-stream');
  const genOverlay = $('#gen-overlay');
  const genRows = $$('.gen-row', genOverlay);
  const bootLines = $$('.boot-line', stream);
  const promptLine = $('.cc-line.user', stream);
  const desktopChrome = $$('.desktop-icon, .os-dock', os);
  const genProgress = $('#gen-progress');
  const captionEl = $('#os-caption-text');
  const progressEl = $('#os-progress');

  /* PHASES (fractions of act-os scroll):
     0.00 - 0.12  laptop opens
     0.12 - 0.18  desktop settles
     0.18 - 0.25  terminal opens
     0.25 - 0.34  Claude Code starts
     0.34 - 0.50  type prompt
     0.50 - 0.60  stream
     0.60 - 0.70  generation overlay
     0.70 - 0.80  hold on completed generation
     0.80 - 0.87  reveal generated design on screen
     0.87 - 0.94  preview camera move
     0.94 - 1.00  clean launch fade
  */

  let lastTyped = -1;
  let lastStreamIdx = -1;
  const renderedStreamLines = [];

  function scrollTerminalToBottom() {
    if (!ccBodyEl) return;
    requestAnimationFrame(() => {
      ccBodyEl.scrollTop = ccBodyEl.scrollHeight;
    });
  }

  function setPromptProgress(p) {
    const target = Math.floor(p * PROMPT_TEXT.length);
    if (target === lastTyped) return;
    lastTyped = target;
    promptEl.firstChild && promptEl.removeChild(promptEl.firstChild);
    promptEl.textContent = PROMPT_TEXT.slice(0, target);
    promptEl.appendChild(cursor);
    scrollTerminalToBottom();
  }

  function setStreamProgress(p) {
    const target = Math.floor(p * STREAM.length);
    if (target === lastStreamIdx) return;
    // Add lines if going forward
    while (lastStreamIdx < target - 1) {
      lastStreamIdx++;
      const it = STREAM[lastStreamIdx];
      if (!it) break;
      const el = document.createElement('span');
      el.className = 'cc-line ' + (it.type || '');
      if (it.type === 'spacer') {
        // empty spacer
      } else {
        el.textContent = it.text || '';
      }
      stream.insertBefore(el, afterPromptEl);
      renderedStreamLines.push(el);
      scrollTerminalToBottom();
    }
    // Remove lines if going backward
    while (lastStreamIdx > target - 1 && renderedStreamLines.length) {
      const el = renderedStreamLines.pop();
      el.remove();
      lastStreamIdx--;
      scrollTerminalToBottom();
    }
  }

  function setGenProgress(p) {
    // p is 0..1 across the gen overlay phase
    genOverlay.classList.toggle('is-on', p > 0);
    const total = genRows.length;
    const stepProgress = p * total;
    genRows.forEach((row, i) => {
      row.classList.remove('is-active', 'is-done');
      if (i < Math.floor(stepProgress)) row.classList.add('is-done');
      else if (i === Math.floor(stepProgress)) row.classList.add('is-active');
    });
    genProgress.style.setProperty('--p', `${Math.min(100, p * 100).toFixed(1)}%`);
  }

  function onScroll() {
    const rect = actOs.getBoundingClientRect();
    const total = actOs.offsetHeight - window.innerHeight;
    const scrolled = Math.max(0, -rect.top);
    const p = Math.min(1, Math.max(0, scrolled / total));

    // Hide the live site's nav while the intro still owns the viewport.
    document.documentElement.classList.toggle(
      'intro-active', rect.bottom > window.innerHeight
    );

    const PHASE = {
      open:     [0.00, 0.12],
      desktop:  [0.12, 0.18],
      terminal: [0.18, 0.25],
      boot:     [0.25, 0.34],
      type:     [0.34, 0.50],
      stream:   [0.50, 0.60],
      gen:      [0.60, 0.70],
      hold:     [0.70, 0.80],
      fade:     [0.80, 0.87],
      tour:     [0.87, 0.94],
      launch:   [0.94, 1.00],
    };
    const lerp = (range, v) => Math.min(1, Math.max(0, (v - range[0]) / (range[1] - range[0])));

    // Caption
    if (p < PHASE.open[1]) captionEl.textContent = 'OPENING LAPTOP';
    else if (p < PHASE.desktop[1]) captionEl.textContent = 'DESKTOP READY';
    else if (p < PHASE.terminal[1]) captionEl.textContent = 'OPENING TERMINAL';
    else if (p < PHASE.boot[1]) captionEl.textContent = 'STARTING CLAUDE CODE';
    else if (p < PHASE.type[1]) captionEl.textContent = 'TYPING PROMPT...';
    else if (p < PHASE.stream[1]) captionEl.textContent = 'PLANNING...';
    else if (p < PHASE.gen[1]) captionEl.textContent = 'GENERATING...';
    else if (p < PHASE.fade[1]) captionEl.textContent = 'DEPLOYING';
    else if (p < PHASE.tour[1]) captionEl.textContent = 'PREVIEWING';
    else captionEl.textContent = 'LAUNCHING';

    progressEl.textContent = `${String(Math.round(p * 100)).padStart(2,'0')} / 100`;

    // Closed laptop -> desktop.
    const openP = lerp(PHASE.open, p);
    const openEase = openP * openP * (3 - 2 * openP);
    if (laptopScreen) {
      const lidAngle = -74 + (0 - -74) * openEase;
      laptopScreen.style.setProperty('--lid-angle', `${lidAngle.toFixed(2)}deg`);
    }
    if (os) {
      os.style.filter = `brightness(${(0.2 + openEase * 0.8).toFixed(3)})`;
    }

    // Desktop -> Terminal.
    const terminalP = lerp(PHASE.terminal, p);
    const bootP = lerp(PHASE.boot, p);
    if (ccWin) {
      const terminalScale = 0.86 + terminalP * 0.14;
      const terminalY = (1 - terminalP) * 52;
      ccWin.style.opacity = terminalP;
      ccWin.style.transform = `translateY(${terminalY}px) scale(${terminalScale})`;
    }
    desktopChrome.forEach(el => {
      el.style.opacity = 1 - terminalP * 0.32;
    });
    bootLines.forEach((el, i) => {
      const lineP = Math.min(1, Math.max(0, bootP * bootLines.length - i));
      el.style.opacity = lineP;
    });
    if (bootP > 0) scrollTerminalToBottom();

    // Type prompt
    const typeP = lerp(PHASE.type, p);
    if (promptLine) promptLine.style.opacity = typeP > 0 ? 1 : 0;
    setPromptProgress(typeP);

    // Stream
    setStreamProgress(lerp(PHASE.stream, p));

    // Gen overlay
    setGenProgress(lerp(PHASE.gen, p));

    // Crossfade to Vivid Design
    const fadeP = lerp(PHASE.fade, p);
    const vivid = document.getElementById('vivid-design');
    if (vivid) {
      vivid.style.opacity = fadeP;
      os.style.opacity = 1 - fadeP;
    }

    // Camera tour, then fade the laptop out before the real site begins.
    const tourP = lerp(PHASE.tour, p);
    const easeTour = tourP < 0.5 ? 2 * tourP * tourP : 1 - Math.pow(-2 * tourP + 2, 2) / 2;

    const launchP = lerp(PHASE.launch, p);
    const easeLaunch = launchP * launchP * (3 - 2 * launchP);

    const macbookScene = document.getElementById('macbook-scene');
    const flash = document.getElementById('explode-flash');

    if (macbookScene) {
      // Base camera values
      let rx = -8;
      let ry = p < PHASE.desktop[1] ? -360 + openEase * 360 : 0;
      let tx = 0;
      let ty = 0;
      let scale = 1;

      // Tour phase (move closer, without blowing the screen up into pixels)
      if (tourP > 0 && launchP === 0) {
        scale = 1 + easeTour * 1.15;
        tx = Math.sin(easeTour * Math.PI) * 150; // Pan across left/right
        ty = easeTour * 100; // Pan down
        rx = -8 + (easeTour * 15); // Tilt up slightly
        ry = Math.sin(easeTour * Math.PI) * -10; // Slight perspective shift
      }

      // Launch phase
      if (launchP > 0) {
        scale = 2.15 + easeLaunch * 1.45;
        rx = 7 * (1 - launchP);
        tx = 0;
        ty = 100 + easeLaunch * 70;
      }

      macbookScene.style.transform = `translateX(${tx}px) translateY(${ty}px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${scale})`;
      macbookScene.style.opacity = 1 - easeLaunch;

      if (flash) {
        flash.style.opacity = 0;
      }
    }
  }

  let raf = null;
  function schedule() {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = null; onScroll(); });
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  onScroll();

  /* ------------- "Skip the intro" jumps straight to the site ------------- */
  const skip = $('.cc-skip');
  if (skip) {
    skip.addEventListener('click', (e) => {
      const hero = document.getElementById('hero');
      if (!hero) return;
      e.preventDefault();
      // Instant jump: a smooth scroll across 800vh would be painfully slow.
      const prev = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';
      hero.scrollIntoView();
      document.documentElement.style.scrollBehavior = prev;
    });
  }
}

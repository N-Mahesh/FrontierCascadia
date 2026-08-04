// Ambassador application. Deliberately self-contained rather than importing
// from main.js: this page is a document page and has no reason to pull in GSAP,
// the countdown, the intro, or the four-step registration machinery.
//
// The validation and share-link patterns mirror setupRegistration() in main.js
// on purpose. If the behaviour there changes, it should change here too.

const form = document.getElementById("ambassador-form");

if (form) {
  const summary = document.getElementById("amb-error-summary");
  const codeEl = document.getElementById("amb-code");
  const nameEl = document.getElementById("amb-name");
  const linkEl = document.getElementById("amb-link");

  const fieldOf = el => el.closest(".reg-field");

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

  function validate() {
    let firstBad = null;
    form.querySelectorAll("[data-required]").forEach(el => {
      clearError(el);
      const empty = el.type === "checkbox" ? !el.checked : !el.value.trim();
      if (empty) {
        showError(el, el.type === "checkbox" ? "You'll need to agree to this one." : "This one's required.");
        if (!firstBad) firstBad = el;
      }
    });
    form.querySelectorAll('[data-type="email"]').forEach(el => {
      if (!el.value.trim() || fieldOf(el)?.querySelector(".reg-error")) return;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim())) {
        showError(el, "That doesn't look like an email address.");
        if (!firstBad) firstBad = el;
      }
    });
    return firstBad;
  }

  // Character counters, same markup the registration form produces.
  form.querySelectorAll("[data-counter]").forEach(el => {
    const max = parseInt(el.getAttribute("maxlength"), 10);
    if (!max) return;
    const counter = document.createElement("span");
    counter.className = "reg-counter";
    const paint = () => { counter.textContent = `${max - el.value.length} left`; };
    el.insertAdjacentElement("afterend", counter);
    el.addEventListener("input", paint);
    paint();
  });

  form.addEventListener("input", e => {
    if (e.target.matches("[data-required], [data-type='email']")) clearError(e.target);
  });
  form.addEventListener("change", e => {
    if (e.target.matches("[data-required]")) clearError(e.target);
  });

  // The code is the ambassador's identity in the registration data, so it has
  // to be stable and collision-proof. The name alone is neither: two Jordan
  // Smiths at different schools would share credit. A random four-digit tag
  // minted once per application settles it, the same way team_key does.
  const slug = value => value.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 24);

  function mintCode() {
    if (codeEl.value) return codeEl.value;
    const base = slug(nameEl?.value || "") || "amb";
    const tag = String(Math.floor(1000 + Math.random() * 9000));
    codeEl.value = `${base}-${tag}`;
    return codeEl.value;
  }

  // Points at the site root, not this page: the link's whole job is to open the
  // registration form. Built the same way the server rebuilds it for the
  // confirmation email, so the two are byte-identical.
  function referralLink(code) {
    const url = new URL(window.location.origin + "/");
    url.searchParams.set("amb", code);
    return `${url.toString()}#apply`;
  }

  const copyBtn = document.getElementById("amb-copy");
  copyBtn?.addEventListener("click", () => {
    if (!linkEl?.value) return;
    const done = () => {
      copyBtn.textContent = "COPIED";
      copyBtn.classList.add("is-copied");
      setTimeout(() => {
        copyBtn.textContent = "COPY";
        copyBtn.classList.remove("is-copied");
      }, 1800);
    };
    // Clipboard API needs a secure context, and this page can be opened over
    // plain http in preview. Fall back to the old selection trick.
    navigator.clipboard?.writeText(linkEl.value).then(done).catch(() => {
      linkEl.select();
      document.execCommand("copy");
      done();
    });
  });

  form.addEventListener("submit", e => {
    e.preventDefault();

    const bad = validate();
    if (bad) {
      if (summary) {
        summary.hidden = false;
        summary.textContent = "A few things still need filling in.";
      }
      bad.focus({ preventScroll: true });
      bad.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (summary) summary.hidden = true;

    const code = mintCode();
    const btn = form.querySelector("button[type='submit']");
    btn.disabled = true;
    btn.textContent = "SENDING...";

    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(new FormData(form)).toString(),
    })
      .then(res => {
        if (!res.ok) throw new Error("Application submission failed");
        if (linkEl) linkEl.value = referralLink(code);
        // An application is one-shot. Leave it submitted rather than wiping
        // the answers, and keep the referral link on screen.
        form.classList.add("is-submitted");
        document.getElementById("amb-done")?.scrollIntoView({ behavior: "smooth", block: "center" });
      })
      .catch(() => {
        btn.disabled = false;
        btn.textContent = "ERROR - TRY AGAIN";
        setTimeout(() => { btn.textContent = "APPLY TO BE AN AMBASSADOR"; }, 3000);
      });
  });
}

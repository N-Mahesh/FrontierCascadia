const form = document.getElementById('submission-form');
const deadline = Date.parse('2026-09-12T17:30:00-07:00');
function updateSubmissionCountdown() {
  const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  const parts = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60];
  document.getElementById('submission-countdown').textContent = parts.map(value => String(value).padStart(2, '0')).join(':');
  if (seconds === 0) {
    document.querySelector('h1').textContent = 'Submission deadline reached';
    document.getElementById('deadline-status').textContent = 'The 5:30 PM PDT deadline has passed. Contact an organizer about late submissions.';
  }
}
updateSubmissionCountdown();
setInterval(updateSubmissionCountdown, 1000);
// Vite development and loopback-hosted production previews are dry runs.
// Deployed builds, including remote Netlify previews, use the real form endpoint.
const preview = import.meta.env.DEV || ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
document.getElementById('preview-notice').hidden = !preview;
if (preview) form.querySelector('button').textContent = 'Test submission';

function toggleDisclosure(selectName, detailsId) {
  const select = form.elements[selectName];
  const details = document.getElementById(detailsId);
  const update = () => {
    const enabled = select.value === 'Yes';
    details.hidden = !enabled;
    details.querySelectorAll('textarea').forEach(field => {
      field.disabled = !enabled;
      field.required = enabled;
    });
  };
  select.addEventListener('change', update);
  update();
}
toggleDisclosure('ai_used', 'ai-details');
toggleDisclosure('funds_used', 'funds-details');

const tracks = [...form.querySelectorAll('[name="tracks"]')];
function validateTracks() {
  tracks[0].setCustomValidity(tracks.some(track => track.checked) ? '' : 'Select at least one track, or Other.');
}
tracks.forEach(track => track.addEventListener('change', validateTracks));
validateTracks();
const github = form.elements.github_url;
function validateGithub() {
  let valid = false;
  try {
    const url = new URL(github.value.trim());
    valid = url.protocol === 'https:' && url.hostname === 'github.com' && /^\/[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+\/?$/.test(url.pathname) && !url.username && !url.password && !url.search && !url.hash;
  } catch { /* Native required validation handles empty input. */ }
  github.setCustomValidity(valid ? '' : 'Enter a repository URL such as https://github.com/owner/repository.');
}
github.addEventListener('input', validateGithub);
form.addEventListener('input', event => {
  const field = event.target;
  if (field.matches('textarea, input[type="text"], input:not([type])')) {
    field.setCustomValidity(field.required && !field.value.trim() ? 'Please enter an answer.' : '');
  }
});
let submitting = false;
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submitting) return;
  validateTracks();
  validateGithub();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  // A single field keeps multiple track selections intact in Netlify CSV exports.
  data.set('tracks', tracks.filter(track => track.checked).map(track => track.value).join('; '));
  const status = document.getElementById('submission-status');
  const button = form.querySelector('button');
  const result = document.getElementById('submission-result');
  if (preview) {
    result.hidden = false;
    document.getElementById('result-title').textContent = 'Test passed. Nothing was sent.';
    document.getElementById('result-copy').textContent = 'Review your test data below. You can edit the form and test again.';
    const output = document.getElementById('preview-data');
    output.hidden = false;
    output.textContent = JSON.stringify(Object.fromEntries(data), null, 2);
    result.focus();
    return;
  }
  submitting = true;
  button.disabled = true;
  status.textContent = 'Submitting your project…';
  try {
    const response = await fetch('/', {method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'}, body: new URLSearchParams(data).toString()});
    if (!response.ok) throw new Error('Submission failed');
    form.hidden = true;
    result.hidden = false;
    document.getElementById('result-title').textContent = 'Project submitted.';
    document.getElementById('result-copy').textContent = 'Thank you! Your team’s project and disclosures have been received. Please be ready to present.';
    result.focus();
  } catch {
    status.textContent = 'We could not confirm your submission. Your answers are still here. Please retry, or contact an organizer if you are unsure whether it was received.';
    button.disabled = false;
    submitting = false;
  }
});

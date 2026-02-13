// ========================================
// NAVIGATION SCROLL
// ========================================
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ========================================
// REVEAL ANIMATIONS
// ========================================
const revealElements = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });

revealElements.forEach(el => revealObserver.observe(el));

// ========================================
// REGISTRATION MODAL
// ========================================
const modal = document.getElementById('registerModal');

function openModal() {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    // Initialize pricing toggle state
    const toggle = document.querySelector('.pricing-toggle');
    if (toggle) {
        toggle.setAttribute('data-active', '0');
    }
}

function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
    }
});

function selectPricing(element, price, original) {
    // Update toggle state for sliding animation
    const toggle = document.querySelector('.pricing-toggle');
    const index = parseInt(element.dataset.index, 10);
    toggle.setAttribute('data-active', index);
    
    // Remove active class from all options
    document.querySelectorAll('.pricing-option').forEach(opt => {
        opt.classList.remove('active');
    });
    element.classList.add('active');

    // Add transition effect to form
    const form = document.querySelector('.registration-form');
    if (form) {
        form.classList.add('form-transitioning');
    }

    // Animate price change with fade effect
    const priceEl = document.getElementById('displayPrice');
    const submitPriceEl = document.getElementById('submitPrice');
    const originalEl = document.getElementById('originalPrice');
    
    // Fade out prices
    if (priceEl) {
        priceEl.style.opacity = '0';
        priceEl.style.transform = 'translateY(-8px)';
    }
    if (originalEl) {
        originalEl.style.opacity = '0';
    }

    // Update prices after fade out
    setTimeout(() => {
        if (priceEl) {
            priceEl.textContent = '$' + price;
            priceEl.style.opacity = '1';
            priceEl.style.transform = 'translateY(0)';
        }
        if (submitPriceEl) {
            submitPriceEl.textContent = '$' + price;
        }
        if (originalEl) {
            if (price < original) {
                originalEl.style.display = 'inline';
                originalEl.textContent = '$' + original;
                originalEl.style.opacity = '1';
            } else {
                originalEl.style.display = 'none';
            }
        }
        
        // Remove form transition effect
        if (form) {
            form.classList.remove('form-transitioning');
        }
    }, 150);
}

function handleSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    console.log('Registration data:', data);
    alert('Thanks! Your registration is saved. In production this would redirect to secure checkout.');
}

// ========================================
// CURSOR GLOW EFFECT (Desktop only)
// ========================================
if (window.matchMedia('(pointer: fine)').matches) {
    const cards = document.querySelectorAll('.system-card, .build-card, .detail-item, .person-card, .prize-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });
}

// ========================================
// ANIMATED COUNTER
// ========================================
function animateCountUp(element, target, prefix = '', suffix = '') {
    const duration = 2000;
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 4);

        const current = Math.floor(start + (target - start) * easeProgress);
        element.textContent = prefix + current.toLocaleString() + suffix;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

const counters = document.querySelectorAll('.count-up');
const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const target = parseInt(entry.target.dataset.target, 10);
            const prefix = entry.target.dataset.prefix || '';
            const suffix = entry.target.dataset.suffix || '';
            animateCountUp(entry.target, target, prefix, suffix);
            counterObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

counters.forEach(counter => counterObserver.observe(counter));

// ========================================
// INITIAL LOAD ANIMATION
// ========================================
window.addEventListener('load', () => {
    document.body.style.opacity = '1';
    setTimeout(() => {
        document.querySelectorAll('#hero .reveal').forEach(el => {
            el.classList.add('is-visible');
        });
    }, 100);
});

document.body.style.opacity = '0';
document.body.style.transition = 'opacity 0.3s ease';

// ========================================
// COUNTDOWN TIMER
// ========================================
function updateCountdown() {
    const eventDate = new Date('March 21, 2026 08:00:00').getTime();
    const now = new Date().getTime();
    const distance = eventDate - now;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    const countdownEl = document.getElementById('countdown');
    if (countdownEl) {
        countdownEl.textContent = `${days} days ${hours} hours`;
    }
}

updateCountdown();
setInterval(updateCountdown, 1000 * 60 * 60); // Update every hour

// ========================================
// SCROLL ARROW CLICK HANDLER
// ========================================
const scrollArrow = document.querySelector('.hero-scroll');
if (scrollArrow) {
    scrollArrow.addEventListener('click', () => {
        const aboutSection = document.getElementById('about');
        if (aboutSection) {
            aboutSection.scrollIntoView({ behavior: 'smooth' });
        }
    });
}

// ========================================
// TERMINAL TYPING ANIMATION
// ========================================
const typingCommand = document.getElementById('typing-command');
if (typingCommand) {
    const commands = ['npm run dev', 'git commit -m "build something real"', 'npm start', 'yarn build'];
    let currentCommandIndex = 0;
    let currentCharIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;
    
    function typeCommand() {
        const currentCommand = commands[currentCommandIndex];
        
        if (!isDeleting && currentCharIndex < currentCommand.length) {
            typingCommand.textContent = currentCommand.substring(0, currentCharIndex + 1);
            currentCharIndex++;
            typingSpeed = 100;
        } else if (isDeleting && currentCharIndex > 0) {
            typingCommand.textContent = currentCommand.substring(0, currentCharIndex - 1);
            currentCharIndex--;
            typingSpeed = 50;
        } else if (!isDeleting && currentCharIndex === currentCommand.length) {
            // Pause at end of command
            typingSpeed = 2000;
            isDeleting = true;
        } else if (isDeleting && currentCharIndex === 0) {
            // Move to next command
            isDeleting = false;
            currentCommandIndex = (currentCommandIndex + 1) % commands.length;
            typingSpeed = 500;
        }
        
        setTimeout(typeCommand, typingSpeed);
    }
    
    // Start typing after a short delay
    setTimeout(typeCommand, 1500);
}

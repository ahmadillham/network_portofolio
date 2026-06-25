/* ==============================
   SMOOTH SCROLLING (LENIS)
   Wrapped in check to prevent crash if CDN fails to load
============================== */
let lenis;
if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
}

/* ==============================
   MOBILE MENU TOGGLE
============================== */
const navMenu = document.getElementById('nav-menu');
const navToggle = document.getElementById('nav-toggle');
const navLinks = document.querySelectorAll('.nav-link');

// Toggle menu on click
if (navToggle) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('show-menu');
        // Toggle icon between bars and times (close)
        const icon = navToggle.querySelector('i');
        const isOpen = navMenu.classList.contains('show-menu');
        if (isOpen) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
        // Update aria-expanded state for accessibility
        navToggle.setAttribute('aria-expanded', isOpen);
    });
}

// Close menu and smooth scroll to section when clicking a nav link
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent native instant jump

        // Close mobile menu
        navMenu.classList.remove('show-menu');
        const icon = navToggle.querySelector('i');
        if (icon) {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
        if (navToggle) {
            navToggle.setAttribute('aria-expanded', 'false');
        }

        // Smooth scroll using Lenis
        const targetId = link.getAttribute('href');
        if (targetId && targetId !== '#') {
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                if (lenis) {
                    lenis.scrollTo(targetElement, { offset: -70 }); // Offset for the fixed header
                } else {
                    targetElement.scrollIntoView({ behavior: 'smooth' }); // Fallback
                }
            }
        }
    });
});

// Also make the logo and back-to-top button scroll to top smoothly
const scrollUpBtns = document.querySelectorAll('.logo, .back-to-top');
scrollUpBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (lenis) {
            lenis.scrollTo(0);
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' }); // Fallback
        }
    });
});

/* ==============================
   SCROLL ACTIVE LINK (Throttled)
============================== */
const sections = document.querySelectorAll('section[id]');

// Pre-cache nav link references to avoid querySelector on every scroll
const sectionNavMap = new Map();
sections.forEach(section => {
    const id = section.getAttribute('id');
    const link = document.querySelector(`.nav-menu a[href*="${id}"]`);
    if (link) sectionNavMap.set(section, link);
});

function scrollActive() {
    const headerHeight = 95;

    // If scrolled to bottom of page, force-activate the last section (e.g. Contact)
    const isAtBottom = (window.innerHeight + window.scrollY) >= (document.body.scrollHeight - 2);
    if (isAtBottom) {
        sectionNavMap.forEach(link => link.classList.remove('active'));
        const lastSection = sections[sections.length - 1];
        const lastLink = sectionNavMap.get(lastSection);
        if (lastLink) lastLink.classList.add('active');
        return;
    }

    // Find the last section (in DOM order) whose top has scrolled past the header
    let activeSection = null;
    sections.forEach(current => {
        const rect = current.getBoundingClientRect();
        if (rect.top <= headerHeight) {
            activeSection = current;
        }
    });

    // Update active classes
    sectionNavMap.forEach(link => link.classList.remove('active'));
    if (activeSection) {
        const activeLink = sectionNavMap.get(activeSection);
        if (activeLink) activeLink.classList.add('active');
    }
}

// Throttled scroll handler — only for scrollActive (reveal is handled by IntersectionObserver)
let scrollTicking = false;
window.addEventListener('scroll', () => {
    if (!scrollTicking) {
        requestAnimationFrame(() => {
            scrollActive();
            scrollTicking = false;
        });
        scrollTicking = true;
    }
});

/* ==============================
   SCROLL REVEAL (IntersectionObserver)
   Replaces getBoundingClientRect to avoid forced layout/reflow
============================== */
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            revealObserver.unobserve(entry.target); // Stop observing once revealed
        }
    });
}, {
    threshold: 0.1,       // Trigger when 10% visible
    rootMargin: '0px 0px -80px 0px' // Slight offset from bottom
});

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ==============================
   CONTACT FORM HANDLER
============================== */
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const submitBtn = document.getElementById('contact-submit');
        if (submitBtn.disabled) return; // Prevent double submit

        // Get form values
        const name = document.getElementById('contact-name').value.trim();
        const email = document.getElementById('contact-email').value.trim();
        const message = document.getElementById('contact-message').value.trim();

        if (name && email && message) {
            // Disable immediately to prevent double submit
            submitBtn.disabled = true;

            // For now, show a confirmation message
            // Replace this with a real backend endpoint (e.g., Formspree, Netlify Forms) in production
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Message Sent! ✓';
            submitBtn.classList.add('btn-success');

            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.classList.remove('btn-success');
                submitBtn.disabled = false;
                contactForm.reset();
            }, 3000);
        }
    });
}

/* ==============================
   DYNAMIC FOOTER YEAR
============================== */
const footerYear = document.getElementById('footer-year');
if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
}

/* ==============================
   UNIFIED ANIMATION LOOP
   Runs Lenis smooth scroll globally
============================== */
function mainLoop(time) {
    if (lenis) lenis.raf(time);
    requestAnimationFrame(mainLoop);
}
requestAnimationFrame(mainLoop);

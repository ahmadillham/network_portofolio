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
const mobileMenuQuery = window.matchMedia('(max-width: 768px)');

function setNavMenuOpen(isOpen) {
    if (!navMenu || !navToggle) return;

    navMenu.classList.toggle('show-menu', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));

    const hideClosedMobileMenu = mobileMenuQuery.matches && !isOpen;
    navMenu.setAttribute('aria-hidden', String(hideClosedMobileMenu));
    navMenu.toggleAttribute('inert', hideClosedMobileMenu);
    navMenu.querySelectorAll('a').forEach(link => {
        if (hideClosedMobileMenu) {
            link.setAttribute('tabindex', '-1');
        } else {
            link.removeAttribute('tabindex');
        }
    });
}

function syncNavMenuState() {
    if (!navMenu || !navToggle) return;

    if (mobileMenuQuery.matches) {
        setNavMenuOpen(navMenu.classList.contains('show-menu'));
    } else {
        setNavMenuOpen(false);
        navMenu.setAttribute('aria-hidden', 'false');
        navMenu.removeAttribute('inert');
    }
}

function getTargetFromHash(hash) {
    if (!hash || hash === '#') return null;
    return document.getElementById(hash.slice(1));
}

function focusTarget(targetElement) {
    const hadTabIndex = targetElement.hasAttribute('tabindex');
    if (!hadTabIndex) targetElement.setAttribute('tabindex', '-1');

    try {
        targetElement.focus({ preventScroll: true });
    } catch {
        targetElement.focus();
    }

    if (!hadTabIndex) {
        targetElement.addEventListener('blur', () => {
            targetElement.removeAttribute('tabindex');
        }, { once: true });
    }
}

function scrollToTarget(targetElement, hash) {
    if (window.history && hash) {
        history.pushState(null, '', hash);
    }

    if (lenis) {
        lenis.scrollTo(targetElement, { offset: -70 });
    } else {
        targetElement.scrollIntoView({ behavior: 'smooth' });
    }

    focusTarget(targetElement);
}

// Toggle menu on click
if (navMenu && navToggle) {
    syncNavMenuState();

    navToggle.addEventListener('click', () => {
        setNavMenuOpen(!navMenu.classList.contains('show-menu'));
    });

    if (mobileMenuQuery.addEventListener) {
        mobileMenuQuery.addEventListener('change', syncNavMenuState);
    } else {
        mobileMenuQuery.addListener(syncNavMenuState);
    }
}

// Close menu and smooth scroll to section when clicking a nav link
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        const targetHash = link.getAttribute('href');
        const targetElement = getTargetFromHash(targetHash);

        if (!targetElement) return;

        e.preventDefault();
        setNavMenuOpen(false);
        scrollToTarget(targetElement, targetHash);
    });
});

// Also make the logo and back-to-top button scroll to top smoothly
const scrollUpBtns = document.querySelectorAll('.logo, .back-to-top');
scrollUpBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const targetHash = btn.getAttribute('href') || '#home';
        const targetElement = getTargetFromHash(targetHash);

        if (!targetElement) return;

        e.preventDefault();
        scrollToTarget(targetElement, targetHash);
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
    const safeId = window.CSS && typeof CSS.escape === 'function' ? CSS.escape(id) : id.replace(/"/g, '\\"');
    const link = document.querySelector(`.nav-menu a[href="#${safeId}"]`);
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
const revealElements = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
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

    revealElements.forEach(el => revealObserver.observe(el));
} else {
    revealElements.forEach(el => el.classList.add('active'));
}

/* ==============================
   CONTACT FORM HANDLER
============================== */
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!contactForm.checkValidity()) {
            contactForm.reportValidity();
            return;
        }

        const contactStatus = document.getElementById('contact-status');
        if (!contactStatus) return;

        // TODO: Replace this development-only notice with a backend/Formspree/Netlify Forms integration.
        contactStatus.textContent = 'Contact form integration is coming soon. Your message was not sent yet.';
        contactStatus.hidden = false;
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
    lenis.raf(time);
    requestAnimationFrame(mainLoop);
}
if (lenis) {
    requestAnimationFrame(mainLoop);
}

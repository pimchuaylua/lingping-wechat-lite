document.addEventListener("DOMContentLoaded", () => {
    // Load header safely
    const header = document.getElementById("header");

    if (header) {
        fetch("/header.html")
            .then(res => res.text())
            .then(data => {
                header.innerHTML = data;
                updateAuthNav();
                updateMembershipCta();
                initMenuSections();
            });
    }

    // Click outside to close dropdown
    document.addEventListener("click", function (e) {
        const dropdown = document.querySelector(".more-dropdown");
        const menu = document.getElementById("moreMenu");

        if (!dropdown || !menu) return;

        if (!dropdown.contains(e.target)) {
            menu.classList.add("hidden");
        }
    });
});

// Toggle dropdown
function toggleMoreDropdown() {
    const menu = document.getElementById("moreMenu");
    if (!menu) return;

    menu.classList.toggle("hidden");
}

function isIndexPage() {
    const path = location.pathname;
    return path === "/" || path.endsWith("/index.html");
}

// The header's CTA points at whichever plan page fits the page it's shown
// on, instead of the generic plans hub.
function updateMembershipCta() {
    const cta = document.querySelector(".membership-cta");
    if (!cta) return;

    if (location.pathname.endsWith("english-sessions.html")) {
        cta.setAttribute("data-i18n", "membershipCtaEnglish");
        if (typeof t === "function") cta.textContent = t("membershipCtaEnglish");
        cta.href = "subscriptions/english-classes.html";
    } else if (isIndexPage()) {
        cta.href = "subscriptions/community-access.html";
    }
}

// Logo: on the home page it keeps its existing easter-egg behavior; from
// anywhere else it's just a way back home.
function handleLogoClick() {
    if (isIndexPage()) {
        if (typeof showSurprise === "function") showSurprise();
    } else {
        window.location.href = "/";
    }
}

/* ---------------- Collapsible menu sections ---------------- */

const MENU_SECTIONS = ["events", "community", "help"];
const MENU_SECTION_DEFAULT_OPEN = { events: true, community: false, help: false };
const MENU_SECTION_STORAGE_KEY = "lp_menuSections";

// Which section (if any) should be force-open because the current page
// lives in it — a runtime-only override, not written to localStorage, so
// a user's explicit "closed" preference still applies once they navigate
// away from that section's pages.
const MENU_SECTION_FOR_PAGE = {
    "my-bookings.html": "events",
    "add-event.html": "events",
    "leaderboard.html": "community",
    "community_guidelines.html": "community",
    "english-sessions.html": "help",
    "about.html": "help",
    "faq.html": "help",
    "join-us.html": "help"
};

function getMenuSectionState() {
    try {
        const stored = JSON.parse(localStorage.getItem(MENU_SECTION_STORAGE_KEY) || "{}");
        return Object.assign({}, MENU_SECTION_DEFAULT_OPEN, stored);
    } catch (e) {
        return Object.assign({}, MENU_SECTION_DEFAULT_OPEN);
    }
}

function setMenuSectionOpen(name, isOpen) {
    try {
        const state = getMenuSectionState();
        state[name] = isOpen;
        localStorage.setItem(MENU_SECTION_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        // localStorage unavailable (private mode, etc.) — section state just
        // won't persist across page loads, menu still works this session.
    }
}

function applyMenuSectionDOM(name, isOpen) {
    const header = document.querySelector(`.menu-section-header[data-section="${name}"]`);
    const body = document.getElementById(`menuSection${name.charAt(0).toUpperCase()}${name.slice(1)}`);
    if (!header || !body) return;
    header.setAttribute("aria-expanded", String(isOpen));
    body.hidden = !isOpen;
}

function toggleMenuSection(name) {
    const isOpen = document.querySelector(`.menu-section-header[data-section="${name}"]`)?.getAttribute("aria-expanded") !== "true";
    setMenuSectionOpen(name, isOpen);
    applyMenuSectionDOM(name, isOpen);
}

function initMenuSections() {
    const state = getMenuSectionState();
    const currentPage = location.pathname.split("/").pop() || "index.html";
    const forceOpenSection = MENU_SECTION_FOR_PAGE[currentPage];

    MENU_SECTIONS.forEach(name => {
        const isOpen = name === forceOpenSection ? true : !!state[name];
        applyMenuSectionDOM(name, isOpen);
    });
}

// Show only "Profile" when logged in, or "Log In" when logged out
function updateAuthNav() {
    const userId = localStorage.getItem("userId");
    const profileLink = document.getElementById("navProfile");
    const loginLink = document.getElementById("navLogin");

    if (profileLink) {
        profileLink.style.display = userId ? "" : "none";
        if (userId) profileLink.href = `view-profile.html?userId=${encodeURIComponent(userId)}`;
    }
    if (loginLink) loginLink.style.display = userId ? "none" : "";
}
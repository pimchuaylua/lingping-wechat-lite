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
        cta.textContent = "Choose Your English Package";
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
document.addEventListener("DOMContentLoaded", () => {
    // Load header safely
    const header = document.getElementById("header");

    if (header) {
        fetch("/header.html")
            .then(res => res.text())
            .then(data => {
                header.innerHTML = data;
                updateAuthNav();
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

// Show only "Profile" when logged in, or "Log In" when logged out
function updateAuthNav() {
    const userId = localStorage.getItem("userId");
    const profileLink = document.getElementById("navProfile");
    const loginLink = document.getElementById("navLogin");

    if (profileLink) profileLink.style.display = userId ? "" : "none";
    if (loginLink) loginLink.style.display = userId ? "none" : "";
}
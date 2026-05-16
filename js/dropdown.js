document.addEventListener("DOMContentLoaded", () => {
    // Load header safely
    const header = document.getElementById("header");

    if (header) {
        fetch("/header.html")
            .then(res => res.text())
            .then(data => {
                header.innerHTML = data;
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
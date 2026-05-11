function toggleMoreDropdown(btn) {
    const menu = btn.parentElement.querySelector(".more-menu");
    menu.classList.toggle("hidden");
}

document.addEventListener("click", function (e) {
    document.querySelectorAll(".more-dropdown").forEach(dropdown => {
        if (!dropdown.contains(e.target)) {
            const menu = dropdown.querySelector(".more-menu");
            menu.classList.add("hidden");
        }
    });
});

fetch("/header.html")
    .then(res => res.text())
    .then(data => {
        document.getElementById("header").innerHTML = data;
    });
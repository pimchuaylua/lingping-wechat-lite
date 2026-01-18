/**
 * auth.js
 * Handles login state for Lingping
 */

window.Auth = {
    getUser() {
        return {
            userId: localStorage.getItem("userId"),
            username: localStorage.getItem("username")
        };
    },

    isLoggedIn() {
        return !!localStorage.getItem("userId");
    },

    async login(username) {
        const { BASE_URL, API_KEY } = window.CONFIG;

        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-KEY": API_KEY
            },
            body: JSON.stringify({
                username,
                password: "lingpingreading33"
            })
        });

        const data = await res.json();
        const userId = data?.data?.userId;

        if (!res.ok || !userId) {
            throw new Error("Invalid username. Please try again.");
        }

        localStorage.setItem("userId", userId);
        localStorage.setItem("username", username);

        return { userId, username };
    },

    logout() {
        localStorage.removeItem("userId");
        localStorage.removeItem("username");
        location.reload();
    }
};

/* ---------- NAV RENDERING (SAFE) ---------- */

// document.addEventListener("DOMContentLoaded", () => {
//     const userId = localStorage.getItem("userId");

//     const navGuest = document.getElementById("navGuest");
//     const navMember = document.getElementById("navMember");

//     // Page may not have nav (safety)
//     if (!navGuest || !navMember) return;

//     if (userId) {
//         // MEMBER NAV
//         navGuest.classList.add("hidden");
//         navMember.classList.remove("hidden");

//         navMember.innerHTML = `
//             <a href="index.html" class="tab active">Home</a>
//             <a href="my-bookings.html" class="tab">Bookings</a>
//             <a href="community.html" class="tab">Community</a>
//             <a href="community-profile.html" class="tab">Me</a>
//         `;
//     } else {
//         // NON-MEMBER NAV
//         navMember.classList.add("hidden");
//         navGuest.classList.remove("hidden");

//         navGuest.innerHTML = `
//             <a href="index.html" class="tab active">Home</a>
//             <a href="join-us.html" class="tab">Join Us</a>
//             <a href="about.html" class="tab">About</a> 
//         `;
//     }
// });

window.Auth.renderNav = function () {
    const userId = localStorage.getItem("userId");
    const navGuest = document.getElementById("navGuest");
    const navMember = document.getElementById("navMember");

    if (!navGuest || !navMember) return;

    if (userId) {
        navGuest.classList.add("hidden");
        navMember.classList.remove("hidden");

        navMember.innerHTML = `
            <a href="index.html" class="tab active">Home</a>
            <a href="my-bookings.html" class="tab">Bookings</a>
            <a href="community.html" class="tab">Community</a>
            <a href="community-profile.html" class="tab">Me</a>
        `;
    } else {
        navMember.classList.add("hidden");
        navGuest.classList.remove("hidden");

        navGuest.innerHTML = `
            <a href="index.html" class="tab active">Home</a>
            <a href="about.html" class="tab">About</a>
            <a href="join-us.html" class="tab">Join Us</a>
        `;
    }
};
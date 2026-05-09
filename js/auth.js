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

window.Auth.renderNav = function () {
    const userId = localStorage.getItem("userId");
    const navGuest = document.getElementById("navGuest");
    const navMember = document.getElementById("navMember");

    if (!navGuest || !navMember) return;

    // 🔥 Always reset BOTH navs first
    navGuest.innerHTML = "";
    navMember.innerHTML = "";

    navGuest.classList.add("hidden");
    navMember.classList.add("hidden");

    if (userId) {
        navMember.classList.remove("hidden");

        // navMember.innerHTML = `
        //     <div class="nav-inner">
        //             <a href="/" class="tab">Home</a>
        //             <a href="my-bookings.html" class="tab">Booked</a>
        //             <a href="subscriptions.html" class="tab">My Plan</a>
        //             <a href="community-profile.html" class="tab">Profile</a>
        //             <a href="join-us.html" class="tab">Contact</a>
        //         </div>
        //     </div>
        // `;
    } else {
        navGuest.classList.remove("hidden");

        // navGuest.innerHTML = `
        //     <div class="nav-inner">
        //             <a href="/" class="tab">Home</a>
        //             <a href="about.html" class="tab">About</a>
        //             <a href="subscriptions/subscription_main.html" class="tab">Subscribe</a>
        //             <a href="join-us.html" class="tab">Contact</a>
        //             <button class="login-btn" onclick="goToLogin()">Log in</button>
        //     </div>
        // `;
    }
};

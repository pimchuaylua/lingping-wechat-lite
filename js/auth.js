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

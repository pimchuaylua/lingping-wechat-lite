/**
 * booking.js
 * Shared booking logic for Lingping
 */

window.bookSession = async function ({ sessionId }) {
    const { BASE_URL, API_KEY } = window.CONFIG;

    const LOGIN_URL = BASE_URL + "/auth/login";
    const BOOK_URL = BASE_URL + "/bookings/";

    let userId = localStorage.getItem("userId");

    try {
        // ✅ If no userId, ask user to log in
        if (!userId) {
            const username = prompt("Enter your username to book:");
            if (!username) return;

            const loginRes = await fetch(LOGIN_URL, {
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

            const loginData = await loginRes.json();
            userId = loginData?.data?.userId;

            if (!loginRes.ok || !userId) {
                throw new Error("Invalid username. Please check and try again.");
            }

            localStorage.setItem("userId", userId);
            localStorage.setItem("username", username);
        }

        // ✅ Book session
        const bookRes = await fetch(BOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-KEY": API_KEY
            },
            body: JSON.stringify({
                userId,
                sessionId,
                numberOfSeats: 1
            })
        });

        const bookData = await bookRes.json();

        if (!bookRes.ok) {
            throw new Error(
                bookData?.result?.originalError ||
                bookData?.message ||
                "Booking failed. Please try again."
            );
        }

        // 🔥 THIS is the missing piece
        if (window.renderUserWelcome) {
            window.renderUserWelcome();
        }

        alert("🎉 Booking confirmed! See you soon.");

    } catch (err) {
        alert(err.message);
    }
};

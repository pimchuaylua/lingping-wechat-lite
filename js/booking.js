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

async function getMyBookings() {
    const userId = localStorage.getItem("userId");
    if (!userId) return null;

    const res = await fetch(
        `${BASE_URL}/bookings/future/user/${userId}`,
        {
            headers: {
                "Content-Type": "application/json",
                "X-API-KEY": API_KEY
            }
        }
    );

    const json = await res.json();
    return json.data;
}

function mapBookingsToSessions(bookings) {
    return bookings.map(b => {
        const s = b.readingSession;
        const start = new Date(s.startTime);
        const end = new Date(start.getTime() + s.durationMins * 60000);

        const hosts = s.hosts?.length
            ? s.hosts.map(h => h.name).join(", ")
            : "TBA";

        return {
            id: s._id,
            date: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`,
            time: `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}–${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
            title: s.title,
            description: s.shortDescription,
            fullDescription: s.fullDescription,
            hosts,
            isFull: s.isFull,
            seatsLeft: s.numberOfSeatsLeft,
            photoUrl: s.photoUrl,
            booked: true
        };
    });
}

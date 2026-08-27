/**
 * booking.js?v=202602182
 * Shared booking logic for Lingping
 */

window.bookSession = async function ({ sessionId }) {
    const { BASE_URL, API_KEY } = window.CONFIG;

    const LOGIN_URL = BASE_URL + "/auth/login";
    const BOOK_URL = BASE_URL + "/bookings/";
    const PENDING_PREPAYMENT_SESSION_KEY = "pendingSessionIdToBookBeforeCompletePayment";

    let userId = localStorage.getItem("userId");

    try {
        // ✅ If no userId, ask user to log in
        if (!userId) {
            localStorage.setItem("pendingSessionId", sessionId);
            localStorage.setItem("redirectAfterLogin", window.location.href);
            window.location.href = "login.html";
            return;
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
                numberOfSeats: 1,
                consent: true
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

        showBookingSuccessModal(bookData);

    } catch (err) {
        if (err.message.includes("No valid subscription found") || err.message.includes("Error occured")) {
            localStorage.setItem(
                PENDING_PREPAYMENT_SESSION_KEY,
                JSON.stringify({
                    sessionId: sessionId,
                    expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
                })
            );
            document.getElementById("membershipModal").style.display = "flex";
        } else {
            alert(err.message);
        }
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

async function getEventsToHost() {
    const userId = localStorage.getItem("userId");

    if (!userId) return null;

    const res = await fetch(
        `${BASE_URL}/reading-sessions?hostId=${userId}&status=future`,
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

async function cancelBooking(sessionId) {
    if (!confirm("Are you sure you want to cancel this booking?")) {
        return;
    }

    try {
        const res = await fetch(`${BASE_URL}/bookings/cancel_by_session`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-KEY": API_KEY
            },
            body: JSON.stringify({
                userId: userId,
                sessionId: sessionId
            })
        });

        const json = await res.json();

        if (json.status) {
            alert("Booking cancelled ✅");
            location.reload(); // refresh page
        } else {
            alert(json.message || "Cancel failed");
        }

    } catch (err) {
        console.error(err);
        alert("Cancel failed. Please try again.");
    }
}

async function joinWaitlist(sessionId) {
    const { BASE_URL, API_KEY } = window.CONFIG;
    const userId = localStorage.getItem("userId");

    if (!userId) {
        localStorage.setItem("pendingWaitlistSessionId", sessionId);
        localStorage.setItem("redirectAfterLogin", window.location.href);
        window.location.href = "login.html";
        return;
    }

    if (!confirm("This session is full. Join the waitlist?")) {
        return;
    }

    try {
        const res = await fetch(`${BASE_URL}/waitlist`, {
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

        const json = await res.json();

        if (res.ok && json.status) {
            alert("You're on the waitlist ✅");
        } else {
            const detail = json.result?.message || json.message;
            const text = Array.isArray(detail) ? detail.join("\n") : detail;
            alert(text || "Failed to join waitlist.");
        }
    } catch (err) {
        console.error(err);
        alert("Failed to join waitlist. Please try again.");
    }
}

function formatReadingSessionToDisplay(s, eventOptions) {
    const start = new Date(s.startTime);
    const end = new Date(start.getTime() + s.durationMins * 60000);

    const hostObjects = s.hosts || [];
    const hosts = hostObjects.length
        ? hostObjects.map(h => h.name).join(", ")
        : "TBA";

    console.log(s);
    return {
        id: s._id,
        startTime: start, // 🔑 keep for sorting
        date: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`,
        startTime: `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
        time: `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}–${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
        title: s.title,
        description: s.shortDescription,
        fullDescription: s.fullDescription,
        hosts: s.hosts || [],
        hostObjects: hostObjects,
        isFull: s.isFull,
        seatsLeft: s.numberOfSeatsLeft,
        maxParticipants: s.maxParticipants,
        photoUrl: s.photoUrl,
        booked: true,
        location: s.location,
        locationUrl: s.locationUrl,
        level: s.level,
        levelName: s.level,
        languages: s.languages,
        categories: s.categories,
        options: eventOptions,
        online: s.online
    };

}
function mapBookingsToSessions(bookings, eventOptions) {
    return bookings
        .map(b => {
            return formatReadingSessionToDisplay(b.readingSession, eventOptions)
        })
        .sort((a, b) => a.startTime - b.startTime); // 🔽 order by time
}


function closeMembershipPopup() {
    document.getElementById("membershipModal").style.display = "none";
}

function goToMembership() {
    window.location.href = "subscriptions/subscription_main.html"; // change to your membership page
}

function preBookingModal(sessionId, session) {
    // session = JSON.parse(session);
    currentSessionId = sessionId;

    document.getElementById("modalSessionName").innerText = session.title;
    document.getElementById("modalSessionTime").innerText = `${Utils.formatDate(session.date)} · ${session.time} (${Utils.getTimeZoneName()})`
    document.getElementById("modalSessionLocation").innerHTML =
        session.levelName?.toLowerCase().includes("online")
            ? "🌐 Online"
            : `📍 ${session.location || "Location TBA"} `;

    document.getElementById("preBookingModal").style.display = "flex";
}

function confirmPreBooking() {

    document.getElementById("preBookingModal").style.display = "none";

    bookSession({ sessionId: currentSessionId });
}

function closePreBookingModal() {
    document.getElementById("preBookingModal").style.display = "none";
}

fetch("components/pre-booking-modal.html")
    .then(res => res.text())
    .then(html => {
        document.getElementById("preBookingModalContainer").innerHTML = html;
    });

fetch("components/booking-success-modal.html")
    .then(res => res.text())
    .then(html => {
        document.getElementById("bookingSuccessModalContainer").innerHTML = html;
    });

function showBookingSuccessModal(bookData) {
    document.getElementById("bookingSuccessModal").style.display = "flex";

    const calendarBtn = document.getElementById("addToCalendarBtn");
    const calendarLink = bookData?.data?.googleCalendarLink;

    if (calendarLink) {
        calendarBtn.style.display = "inline-block";
        calendarBtn.onclick = () => window.open(calendarLink, "_blank");
    } else {
        calendarBtn.style.display = "none";
        calendarBtn.onclick = null;
    }
}

function closeBookingSuccessModal() {
    document.getElementById("bookingSuccessModal").style.display = "none";
}
/**
 * booking.js?v=202602182
 * Shared booking logic for Lingping
 */

let currentSession = null;

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
                consent: true,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
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

function buildGoogleCalendarLink(s, start, end, eventOptions) {
    const fmt = d => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const text = encodeURIComponent(`[Lingping] ${s.title || ""}`);
    const location = encodeURIComponent(s.locationUrl || s.location || "");
    const description = s.fullDescription || s.shortDescription || "";

    let detailsLines;
    if (s.online) {
        const platformLabel = findMeta(eventOptions?.platforms, s.online.platform)?.label || s.online.platform;
        detailsLines = [`<b>Platform: ${platformLabel}</b>`];
        if (s.online.meetingNumber) detailsLines.push(`<b>Meeting Number: ${s.online.meetingNumber}</b>`);
        detailsLines.push(
            "",
            "Having trouble finding us or getting in? Contact us.",
            `<a href="https://lingpingclub.com/join-us.html">https://lingpingclub.com/join-us.html</a>`,
            "",
            description
        );
    } else {
        const locationLabel = s.locationUrl
            ? `<a href="${s.locationUrl}">${s.location || ""}</a>`
            : (s.location || "");
        detailsLines = [
            `<b>Location: ${locationLabel}</b>`,
            "",
            description,
            "",
            `<b>Having trouble finding us or getting in? Contact us.</b>`,
            `📞 Call <b>+66 61 192 3366</b>`,
            `🌐 Or reach us at <b><a href="https://lingpingclub.com/join-us.html">lingpingclub.com/join-us.html</a></b>`
        ];
    }

    const details = encodeURIComponent(detailsLines.join("\n"));

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${fmt(start)}/${fmt(end)}&details=${details}&location=${location}`;
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
        startTime: `${Utils.formatTime(start)}`,
        time: `${Utils.formatTime(start)}–${Utils.formatTime(end)}`,
        title: s.title,
        description: s.shortDescription,
        fullDescription: s.fullDescription,
        hosts: s.hosts || [],
        hostObjects: hostObjects,
        isFull: s.isFull,
        seatsLeft: s.numberOfSeatsLeft,
        maxParticipants: s.maxParticipants,
        canceledAt: s.canceledAt,
        photoUrl: s.photoUrl,
        booked: true,
        location: s.location,
        locationUrl: s.locationUrl,
        level: s.level,
        levelName: s.level,
        languages: s.languages,
        categories: s.categories,
        options: eventOptions,
        online: s.online,
        cost: s.cost,
        googleCalendarLink: buildGoogleCalendarLink(s, start, end, eventOptions)
    };

}
function mapBookingsToSessions(bookings, eventOptions) {
    return bookings
        .map(b => {
            return formatReadingSessionToDisplay(b.readingSession, eventOptions);
        })
        .sort((a, b) => a.startTime - b.startTime); // 🔽 order by time
}


function closeMembershipPopup() {
    document.getElementById("membershipModal").style.display = "none";
}

function goToMembership() {
    const levelName = (currentSession?.levelName || "").toLowerCase();
    const base = "subscriptions/";
    let target = "subscription_main.html"; // fallback: we don't know the session's level

    if (levelName.includes("english")) {
        target = "english-classes.html";
    } else if (levelName.includes("online")) {
        target = "community-plans-online.html";
    } else if (levelName.includes("bangkok")) {
        target = "community-plans-bangkok.html";
    } else if (levelName.includes("chiang")) {
        target = "community-plans-chiangmai.html";
    } else if (levelName.includes("phuket")) {
        target = "community-plans-phuket.html";
    } else if (levelName.includes("chengdu")) {
        target = "community-plans-chengdu.html";
    } else if (levelName.includes("hong kong")) {
        target = "community-plans-hongkong.html";
    } else if (levelName) {
        // any other community level without its own plan page yet
        target = "community-access.html";
    }

    window.location.href = base + target;
}

function preBookingModal(sessionId, session) {
    // session = JSON.parse(session);
    currentSessionId = sessionId;
    currentSession = session;

    document.getElementById("modalSessionName").innerText = session.title;
    document.getElementById("modalSessionDate").innerText = Utils.formatDate(session.date);
    document.getElementById("modalSessionTime").innerText = `${session.time} (${Utils.getTimeZoneName()})`;

    const isOnline = session.levelName?.toLowerCase().includes("online");
    document.getElementById("modalSessionLocation").innerText = isOnline
        ? t("tabOnline")
        : (session.location || t("locationTBA"));

    const locationIconEl = document.getElementById("modalLocationIcon");
    locationIconEl.innerHTML = isOnline
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><line x1="3" y1="12" x2="21" y2="12"></line><path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18z"></path></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.5-7-11a7 7 0 1 1 14 0c0 4.5-7 11-7 11z"></path><circle cx="12" cy="10" r="2.5"></circle></svg>';

    const categoryEl = document.getElementById("modalSessionCategory");
    const category = (session.categories || [])[0];
    if (categoryEl) {
        if (category) {
            const meta = findMeta(session.options?.categories, category);
            categoryEl.textContent = translatedCategoryLabel(category, meta?.label || category);
            categoryEl.removeAttribute("hidden");
        } else {
            categoryEl.setAttribute("hidden", "");
        }
    }

    const chipRow = document.getElementById("modalChipRow");
    chipRow.querySelectorAll(".pbm-chip-dynamic").forEach(el => el.remove());

    const languages = session.languages || [];
    if (languages.length) {
        const langNames = [...new Set(languages.map(({ language }) => {
            const langMeta = findMeta(session.options?.languages, language);
            const label = translatedLangLabel(language, langMeta?.label || language);
            const flag = LANG_META[language]?.flag || "";
            return flag ? `${flag} ${label}` : label;
        }))].join(", ");

        const langChip = document.createElement("span");
        langChip.className = "pbm-chip pbm-chip-dynamic";
        langChip.textContent = langNames;
        chipRow.appendChild(langChip);

        const levelNames = [...new Set(languages.map(l => l.proficiencyLevel).filter(Boolean).map(levelCode => {
            const levelMeta = findMeta(session.options?.proficiencyLevels, levelCode);
            return translatedLevelLabel(levelCode, levelMeta?.label || levelCode);
        }))];

        if (levelNames.length) {
            const levelChip = document.createElement("span");
            levelChip.className = "pbm-chip pbm-chip-dynamic";
            levelChip.textContent = levelNames.join("–");
            chipRow.appendChild(levelChip);
        }
    }

    renderPreBookingCost(session);

    clearBookingAgreeError();
    const agreeCheckbox = document.getElementById("bookingAgreeCheckbox");
    if (agreeCheckbox) agreeCheckbox.checked = false;

    document.getElementById("preBookingModal").style.display = "flex";
}

// Renders the "This event costs extra" section, shown only when session.cost
// is set (events fully covered by membership have no cost field at all).
// Prepayment isn't built yet — prepayRequired/prepayOptional render their
// buttons as inert placeholders (no onclick) until a real checkout exists.
function renderPreBookingCost(session) {
    const costBlock = document.getElementById("pbmCostBlock");
    const costDivider = document.getElementById("pbmCostDivider");
    const cost = formatEventCost(session.cost);

    if (!cost) {
        costBlock?.setAttribute("hidden", "");
        costDivider?.setAttribute("hidden", "");
        return;
    }

    costBlock?.removeAttribute("hidden");
    costDivider?.removeAttribute("hidden");
    document.getElementById("pbmCostAmount").textContent = cost.amountLabel;

    const modeContent = document.getElementById("pbmCostModeContent");

    if (cost.paymentMode === "prepayRequired") {
        // TODO: wire this button up to a real payment/checkout flow once built.
        modeContent.innerHTML = `
            <div class="pbm-cost-note-label">${t("costPrepayRequiredLabel")}</div>
            <button class="pbm-cost-btn pbm-cost-btn-primary" disabled>
                ${t("costPayAmountNowBtn").replace("{amount}", cost.amountLabel)}
            </button>
        `;
    } else if (cost.paymentMode === "prepayOptional") {
        // TODO: wire "Prepay now" up to a real payment/checkout flow once built.
        modeContent.innerHTML = `
            <div class="pbm-cost-btn-row">
                <button class="pbm-cost-btn pbm-cost-btn-outline">${t("costPrepayNowBtn")}</button>
                <button class="pbm-cost-btn pbm-cost-btn-neutral">${t("costPayAtVenueBtn")}</button>
            </div>
            <div class="pbm-cost-helper">${t("costPrepayOptionalHelper")}</div>
        `;
    } else {
        modeContent.innerHTML = `
            <div class="pbm-cost-note">
                <span class="pbm-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </span>
                <span>${t("costPayOnSpotNote")}</span>
            </div>
        `;
    }
}

function clearBookingAgreeError() {
    document.getElementById("pbmAgreeRow")?.classList.remove("pbm-agree-row-error");
    document.getElementById("pbmAgreeError")?.setAttribute("hidden", "");
}

function confirmPreBooking() {
    const agreed = document.getElementById("bookingAgreeCheckbox")?.checked;

    if (!agreed) {
        const agreeRow = document.getElementById("pbmAgreeRow");
        agreeRow?.classList.add("pbm-agree-row-error");
        document.getElementById("pbmAgreeError")?.removeAttribute("hidden");
        agreeRow?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
    }

    document.getElementById("preBookingModal").style.display = "none";

    bookSession({ sessionId: currentSessionId });
}

function closePreBookingModal() {
    document.getElementById("preBookingModal").style.display = "none";
}

fetch("components/pre-booking-modal.html")
    .then(res => res.text())
    .then(html => {
        const container = document.getElementById("preBookingModalContainer");
        container.innerHTML = html;
        if (typeof applyTranslations === "function") applyTranslations(container);
    });

fetch("components/booking-success-modal.html")
    .then(res => res.text())
    .then(html => {
        const container = document.getElementById("bookingSuccessModalContainer");
        container.innerHTML = html;
        if (typeof applyTranslations === "function") applyTranslations(container);
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
/**
 * event-card.js
 * Shared reading-session card renderer, used by index.html (Community) and
 * english-sessions.html (English Class) so both pages stay in sync.
 */

function buildEventCard(s, { isOnline, viewer }) {
    let flagImg = "";

    const isCanceled = !!s.canceledAt;
    const languages = s.languages || [];
    const languageCodes = languages.map(l => l.language);

    if (languageCodes.includes("en") && languageCodes.includes("th")) {
        flagImg = "assets/flags/thai-eng.png";
    } else if (languageCodes.includes("en")) {
        flagImg = "assets/flags/english.png";
    } else if (languageCodes.includes("th")) {
        flagImg = "assets/flags/thai.png";
    } else if (languageCodes.includes("zh")) {
        flagImg = "assets/flags/chinese.png";
    } else if (languageCodes.includes("ru")) {
        flagImg = "assets/flags/russian.png";
    } else if (languageCodes.includes("ja")) {
        flagImg = "assets/flags/japanese.png";
    } else if (languageCodes.includes("es")) {
        flagImg = "assets/flags/spanish.png";
    } else if (languageCodes.includes("yue")) {
        flagImg = "assets/flags/hk.png";
    }

    const status = isCanceled
        ? t("statusCanceled")
        : s.isFull
            ? t("statusFull")
            : t("statusAvailable");

    const statusClass = isCanceled
        ? "canceled"
        : s.isFull
            ? "full"
            : "available";

    const readableDateTime = `${Utils.formatDate(s.date)} · ${s.shortTime} (${Utils.getTimeZoneName()})`;

    let onlinePlatform = "Tencent";
    if (s.online) {
        const platformMeta = findMeta(s.options.platforms, s.online.platform);
        onlinePlatform = platformMeta?.label || s.online.platform;
    }

    const locationHtml = isOnline
        ? `<div class="event-location">🌐 ${t("tabOnline")} · ${onlinePlatform}</div>`
        : s.locationUrl
            ? `<div class="event-location">
                📍 <a href="${s.locationUrl}"
                    target="_blank"
                    rel="noopener"
                    onclick="event.stopPropagation()"
                >${s.location || "View location"}</a>
           </div>`
            : s.location
                ? `<div class="event-location">📍 ${s.location}</div>`
                : "";

    const cost = formatEventCost(s.cost);
    const costHtml = cost
        ? `<div class="cost-pill ${cost.style}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M6 12h.01M18 12h.01"></path></svg>
                ${cost.label}
           </div>`
        : "";

    const hostHtml =
        s.hosts?.length
            ? `
                <div class="event-hosts">
                    <div class="host-avatars">
                        ${s.hosts.map(host => `
                            <img
                                src="${host.profile?.profilePic || 'assets/logos/lingping_logo.png'}"
                                class="host-avatar-small"
                                alt="${host.profile?.displayName || host.displayName}"
                                onclick="event.stopPropagation(); viewProfile('${host._id}')"
                            />
                        `).join("")}
                    </div>

                    <div class="host-names">
                        ${t("hostedBy")} ${s.hosts.map(host => `
                            <span
                                class="host-link"
                                onclick="event.stopPropagation(); viewProfile('${host._id}')"
                            >
                                ${host.profile?.displayName || host.displayName}
                            </span>
                        `).join(", ")} ${t("hostedByEnd")}
                    </div>
                </div>`
            : "";

    return `
                <div class="event-card">
                    <div class="event-photo">
                        <img class="event-img" src="${s.photoUrl}" alt="${s.title}">

                        ${flagImg ? `
                            <img class="lang-flag" src="${flagImg}" />
                        ` : ""}
                    </div>
                    <div class="event-body">
                        <!-- Title + Status -->
                        <div class="event-row">
                            <div class="event-title">${s.title}</div>
                            <div class="status ${statusClass}"> ${status} </div>
                        </div class="event-row">
                         ${renderLanguageChips(s.languages, s.options)}

                        <div class="event-row">
                            ${readableDateTime}
                        </div>

                        <div class="event-row">
                            ${locationHtml}
                        </div>

                        ${costHtml ? `<div class="event-row">${costHtml}</div>` : ""}

                        ${window.Materials ? Materials.stripHtml(s.materials) : ""}

                        <div class="event-row event-footer">
                            ${hostHtml}

                            ${renderSessionActionHtml(s, viewer)}
                        </div>



                    </div class="event-body">
                </div class="event-card">
        `;
}


/* ---------------- Member's own status on cards ---------------- */

// Appends the logged-in member's id so GET /reading-sessions returns
// myStatus / myWaitlistPosition / viewer.blockedUntil. Logged out → unchanged.
// TODO: replace with Authorization header when JWT lands.
function withViewer(url) {
    const userId = localStorage.getItem("userId");
    if (!userId) return url;
    return `${url}${url.includes("?") ? "&" : "?"}userId=${encodeURIComponent(userId)}`;
}

// t() returns the key itself when a translation is missing (stale cache).
function cardText(key, fallback) {
    const text = window.t ? t(key) : key;
    return text && text !== key ? text : fallback;
}

function formatBlockedUntil(iso) {
    const lang = window.getSiteLanguage ? window.getSiteLanguage() : "en";
    const locale = lang === "zh" ? "zh-CN" : lang === "th" ? "th-TH" : "en-US";
    return new Date(iso).toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric" });
}

function openSessionDetail(session) {
    localStorage.setItem("selectedSession", JSON.stringify(session));
    window.location.href = "event-detail.html";
}

const ACTION_ICONS = {
    check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    clock: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><polyline points="12 7 12 12 15 14"></polyline></svg>',
    lock: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"></rect><path d="M8 11V7a4 4 0 0 1 8 0v4"></path></svg>',
    mic: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"></rect><path d="M5 11a7 7 0 0 0 14 0"></path><line x1="12" y1="18" x2="12" y2="22"></line></svg>'
};

// Single source of truth for the card's action button. First match wins.
// Returns { label, variant, disabled, subtext, icon, onTap }.
function getSessionAction(session, viewer) {
    const myStatus = session.myStatus ?? "none";
    const blockedUntil = viewer?.blockedUntil ?? null;

    if (session.canceledAt) {
        const hadBooking = myStatus === "booked" || session.hadBooking === true;
        return {
            label: cardText("sessionCancelled", "Session cancelled"),
            variant: "disabled",
            disabled: true,
            subtext: hadBooking ? cardText("noPenaltyForYou", "No penalty for you") : null,
            onTap: null
        };
    }

    if (myStatus === "hosting") {
        return { label: cardText("youreHosting", "You're hosting"), variant: "chip-host", icon: "mic", onTap: () => openSessionDetail(session) };
    }

    if (myStatus === "booked") {
        return { label: cardText("booked", "Booked"), variant: "chip-booked", icon: "check", onTap: () => openSessionDetail(session) };
    }

    if (myStatus === "waitlisted") {
        const pos = session.myWaitlistPosition;
        const base = cardText("onWaitlist", "On waitlist");
        // No leave-waitlist endpoint yet, so this opens the session detail.
        return { label: pos ? `${base} · #${pos}` : base, variant: "chip-waitlist", icon: "clock", onTap: () => openSessionDetail(session) };
    }

    if (blockedUntil) {
        return {
            label: cardText("bookingPaused", "Booking paused"),
            variant: "disabled",
            disabled: true,
            icon: "lock",
            subtext: `${cardText("pausedUntil", "until")} ${formatBlockedUntil(blockedUntil)}`,
            whyLink: "community_guidelines.html#late-cancellation-no-show",
            onTap: null
        };
    }

    if (session.isFull) {
        return { label: cardText("joinWaitlist", "Join waitlist"), variant: "outline", onTap: () => handleBookClick(session.id) };
    }

    return { label: cardText("join", "Join"), variant: "primary", onTap: () => handleBookClick(session.id) };
}

function renderSessionActionHtml(session, viewer) {
    const a = getSessionAction(session, viewer);
    const icon = a.icon ? ACTION_ICONS[a.icon] : "";
    const why = a.whyLink
        ? ` <a class="session-action-why" href="${a.whyLink}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${cardText("why", "Why?")}</a>`
        : "";
    const sub = a.subtext ? `<div class="session-action-sub">${a.subtext}${why}</div>` : "";

    return `
        <div class="session-action">
            <button type="button" class="book-btn session-action-btn sa-${a.variant}" ${a.disabled ? "disabled" : ""}
                onclick='event.stopPropagation(); handleCardAction("${session.id}")'>${icon}<span>${a.label}</span></button>
            ${sub}
        </div>`;
}

// Cards are rendered as HTML strings, so the button looks its session up again.
function handleCardAction(sessionId) {
    const list = typeof sessions !== "undefined" ? sessions : [];
    const session = list.find(x => x.id === sessionId);
    if (!session) return;
    const viewer = typeof sessionViewer !== "undefined" ? sessionViewer : null;
    const action = getSessionAction(session, viewer);
    if (!action.disabled && action.onTap) action.onTap();
}

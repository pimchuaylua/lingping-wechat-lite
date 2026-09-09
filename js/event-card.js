/**
 * event-card.js
 * Shared reading-session card renderer, used by index.html (Community) and
 * english-sessions.html (English Class) so both pages stay in sync.
 */

function buildEventCard(s, { isOnline }) {
    let flagImg = "";

    const isCanceled = s.maxParticipants === -1;
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

    const status = s.maxParticipants === -1
        ? "Canceled"
        : s.isFull
            ? "Full"
            : "Available";

    const statusClass = s.maxParticipants === -1
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
        ? `<div class="event-location">🌐 Online · ${onlinePlatform}</div>`
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
                        Hosted by ${s.hosts.map(host => `
                            <span
                                class="host-link"
                                onclick="event.stopPropagation(); viewProfile('${host._id}')"
                            >
                                ${host.profile?.displayName || host.displayName}
                            </span>
                        `).join(", ")}
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
                         ${renderLanguageChips(s.languages)}

                        <div class="event-row">
                            ${readableDateTime}
                        </div>

                        <div class="event-row">
                            ${locationHtml}
                        </div>

                        <div class="event-row event-footer">
                            ${hostHtml}

                             <button class="book-btn ${isCanceled ? "" : s.isFull ? "waitlist" : "available"}" ${isCanceled ? "disabled" : ""} onclick='event.stopPropagation(); handleBookClick("${s.id}")'>
                            ${s.isFull ? "Join Waitlist" : "Book"}
                        </button>
                        </div>



                    </div class="event-body">
                </div class="event-card">
        `;
}

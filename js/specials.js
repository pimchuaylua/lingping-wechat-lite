/**
 * specials.js
 * "Specials": one-off sessions picked by the Lingping team (isSpecial /
 * specialLabel on every session from GET /reading-sessions).
 *
 *   Specials.tagHtml(s) / Specials.photoTagHtml(s)  the ★ label pill
 *   Specials.loadRow(levelId)  the home "Specials" row (#specialsRow)
 *   Specials.openBookedSheet({ sessionId, bookData })  "You're booked!" sheet
 *       shown after a booking, with up to 2 specials to join. Called by
 *       showBookingSuccessModal() in js/booking.js.
 */
(function () {
    const cfg = () => window.CONFIG;
    const esc = v => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

    // t() returns the key itself when a translation is missing.
    function tx(key, fallback) {
        const text = window.t ? t(key) : key;
        return text && text !== key ? text : fallback;
    }

    const STAR = '<svg class="sp-star" aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></svg>';
    const CHECK = '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    const CALENDAR = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>';

    const labelOf = s => s.specialLabel || tx("specialTag", "Special");
    const tagHtml = s => `<span class="sp-tag">${STAR}<span>${esc(labelOf(s))}</span></span>`;
    const photoTagHtml = s => s.isSpecial ? `<span class="sp-photo-tag">${STAR}<span>${esc(labelOf(s))}</span></span>` : "";

    /* ---------------- Dates: "Today · 5:00 PM" / "Sat 13 Dec · 7:00 PM" ---------------- */

    function locale() {
        const lang = window.getSiteLanguage ? window.getSiteLanguage() : "en";
        return lang === "zh" ? "zh-CN" : lang === "th" ? "th-TH" : "en-GB";
    }

    function dayText(d) {
        if (d.toDateString() === new Date().toDateString()) return tx("calToday", "Today");
        return d.toLocaleDateString(locale(), { weekday: "short", day: "numeric", month: "short" }).replace(",", "");
    }

    function timeText(d) {
        if (window.Utils && Utils.formatTime && locale() === "zh-CN") return Utils.formatTime(d);
        return d.toLocaleTimeString(locale() === "en-GB" ? "en-US" : locale(), { hour: "numeric", minute: "2-digit" });
    }

    const whenText = iso => { const d = new Date(iso); return `${dayText(d)} · ${timeText(d)}`; };

    function placeText(s) {
        const level = String(s.level || s.levelName || "");
        return level.toLowerCase().includes("online") ? tx("tabOnline", "Online") : (s.location || "");
    }

    /* ---------------- Host: avatar + "with Name" ---------------- */

    const hostName = h => h?.profile?.displayName || h?.displayName || "";

    // 1 host → "Pleng", 2 → "Pleng & Sia", 3+ → "Pleng +2"
    function hostNames(hosts) {
        const names = (hosts || []).map(hostName).filter(Boolean);
        if (names.length <= 1) return names[0] || "";
        if (names.length === 2) return `${names[0]} & ${names[1]}`;
        return `${names[0]} +${names.length - 1}`;
    }

    const hostLineHtml = s => {
        const names = hostNames(s.hosts);
        return names ? `<span class="sp-host">${esc(tx("withHost", "with"))} <b>${esc(names)}</b></span>` : "";
    };

    // First host's photo in an orange ring (their initial if there's no photo),
    // with the session photo as a small badge. Sessions without a host fall
    // back to the session photo in the ring and no badge.
    function avatarHtml(s, large) {
        const host = (s.hosts || [])[0];
        const name = hostName(host);
        const pic = host ? host.profile?.profilePic : s.photoUrl;
        const initial = esc((Array.from(name.trim())[0] || "").toUpperCase());
        // The initial sits under the photo, so a photo that fails to load shows it.
        const img = pic ? `<img src="${esc(pic)}" alt="" loading="lazy" onerror="this.remove()">` : "";
        const badge = host && s.photoUrl
            ? `<span class="sp-avatar-badge"><img src="${esc(s.photoUrl)}" alt="" loading="lazy" onerror="this.parentNode.remove()"></span>`
            : "";
        return `<span class="sp-avatar${large ? " sp-avatar--lg" : ""}"><span class="sp-avatar-ring"><span class="sp-avatar-initial" aria-hidden="true">${initial}</span>${img}</span>${badge}</span>`;
    }

    async function getJson(url) {
        const res = await fetch(url, { headers: { "X-API-KEY": cfg().API_KEY } });
        if (!res.ok) throw new Error(`${url} failed: ${res.status}`);
        return res.json();
    }

    function withUser(url) {
        const userId = localStorage.getItem("userId");
        return userId ? `${url}${url.includes("?") ? "&" : "?"}userId=${encodeURIComponent(userId)}` : url;
    }

    /* ---------------- Home: Specials row ---------------- */

    let rowRequest = 0;

    // Same level (Online / city) as the list. Renders nothing when there are
    // no specials or the call fails.
    async function loadRow(levelId) {
        const host = document.getElementById("specialsRow");
        if (!host) return;
        const request = ++rowRequest;
        let list = [];
        try {
            const params = new URLSearchParams({ special: "true", level: levelId });
            const json = await getJson(withUser(`${cfg().BASE_URL}/reading-sessions?${params}`));
            // A backend without specials ignores special=true and sends the normal list.
            list = (json.data || []).filter(s => s.isSpecial === true && !s.canceledAt);
        } catch (err) {
            console.error(err);
        }
        if (request !== rowRequest) return; // the location changed meanwhile

        host.hidden = !list.length;
        host.innerHTML = list.length ? `
            <h2 class="sp-heading">${STAR}<span>${esc(tx("specialsHeading", "Specials"))}</span></h2>
            <div class="sp-scroller">${list.map(s => `
                <a class="sp-card" href="event-detail.html?sessionId=${encodeURIComponent(s._id)}">
                    ${avatarHtml(s, false)}
                    <span class="sp-card-text">
                        ${tagHtml(s)}
                        <span class="sp-card-title">${esc(s.title)}</span>
                        ${hostLineHtml(s)}
                        <span class="sp-card-when">${esc(whenText(s.startTime))}</span>
                    </span>
                </a>`).join("")}
            </div>` : "";
    }

    /* ---------------- After booking: "You're booked!" sheet ---------------- */

    let overlay = null;
    let triggerEl = null;
    let joiningId = null; // a special being booked from the sheet

    function getSheet() {
        if (overlay) return overlay;
        overlay = document.createElement("div");
        overlay.className = "sp-overlay";
        overlay.hidden = true;
        overlay.innerHTML = `
            <div class="sp-sheet" role="dialog" aria-modal="true" aria-label="${esc(tx("bookingConfirmedLabel", "Booking confirmed"))}" tabindex="-1">
                <div class="sp-grab" aria-hidden="true"></div>
                <div class="sp-booked">
                    <span class="sp-booked-check">${CHECK}</span>
                    <div class="sp-booked-text">
                        <h2 class="sp-booked-title">${esc(tx("youreBooked", "You're booked!"))}</h2>
                        <p class="sp-booked-sub" id="spBookedSub"></p>
                    </div>
                </div>
                <button type="button" class="sp-calendar" id="spCalendarBtn" hidden>${CALENDAR}<span>${esc(tx("addToGoogleCalendar", "Add to Google Calendar"))}</span></button>
                <div class="sp-suggest" id="spSuggest" hidden>
                    <hr class="sp-divider">
                    <h3 class="sp-heading sp-heading--sheet">${STAR}<span>${esc(tx("dontMissSpecials", "Don't miss these specials"))}</span></h3>
                    <p class="sp-suggest-sub">${esc(tx("dontMissSpecialsSub", "One-off sessions picked by the Lingping team. Spots go fast."))}</p>
                    <div class="sp-rows" id="spRows"></div>
                </div>
                <button type="button" class="btn-primary sp-done" id="spDoneBtn">${esc(tx("done", "Done"))}</button>
            </div>`;
        document.body.appendChild(overlay);

        overlay.addEventListener("click", e => { if (e.target === overlay) closeSheet(); });
        overlay.querySelector("#spDoneBtn").onclick = closeSheet;
        overlay.querySelector("#spRows").addEventListener("click", e => {
            const btn = e.target.closest("[data-join]");
            if (btn) joinFromSheet(btn.dataset.join);
        });
        return overlay;
    }

    // A Confirm Booking / error popup opened on top of the sheet owns the keyboard.
    function popupAbove() {
        return [...document.querySelectorAll(".modal, .cancel-dialog-overlay, .mo-overlay")]
            .some(el => !el.hidden && getComputedStyle(el).display !== "none");
    }

    function onKeydown(e) {
        if (!overlay || overlay.hidden || popupAbove()) return;
        if (e.key === "Escape") {
            e.preventDefault();
            closeSheet();
        } else if (e.key === "Tab") {
            const focusable = [...overlay.querySelectorAll("button, a[href]")].filter(el => !el.closest("[hidden]") && !el.disabled);
            if (!focusable.length) return;
            const first = focusable[0], last = focusable[focusable.length - 1];
            if (e.shiftKey && (document.activeElement === first || document.activeElement === overlay.querySelector(".sp-sheet"))) {
                e.preventDefault(); last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault(); first.focus();
            }
        }
    }

    function closeSheet() {
        if (!overlay || overlay.hidden) return;
        overlay.hidden = true;
        joiningId = null;
        document.body.classList.remove("sp-sheet-open");
        document.removeEventListener("keydown", onKeydown);
        if (triggerEl && document.contains(triggerEl) && triggerEl.focus) triggerEl.focus();
        triggerEl = null;
    }

    // The booked session's title and time: from the page if it has it, else the API.
    async function bookedSession(sessionId) {
        const list = typeof sessions !== "undefined" && Array.isArray(sessions) ? sessions : [];
        const local = list.find(x => x.id === sessionId)
            || (typeof s !== "undefined" && s && s.id === sessionId ? s : null);
        if (local) return { title: local.title, startTime: local.startTimeISO };
        const json = await getJson(`${cfg().BASE_URL}/reading-sessions/${encodeURIComponent(sessionId)}`);
        return json.data;
    }

    function rowHtml(sp) {
        const meta = [whenText(sp.startTime), placeText(sp)].filter(Boolean).join(" · ");
        return `
            <div class="sp-row" data-row="${esc(sp._id)}">
                ${avatarHtml(sp, true)}
                <span class="sp-row-text">
                    ${tagHtml(sp)}
                    <a class="sp-row-title" href="event-detail.html?sessionId=${encodeURIComponent(sp._id)}">${esc(sp.title)}</a>
                    ${hostLineHtml(sp)}
                    <span class="sp-row-foot">
                        <span class="sp-row-meta">${esc(meta)}</span>
                        <span class="sp-row-action">
                            <button type="button" class="btn-primary sp-join" data-join="${esc(sp._id)}">${esc(tx("join", "Join"))}</button>
                        </span>
                    </span>
                </span>
            </div>`;
    }

    let suggestions = [];

    function openBookedSheet({ sessionId, bookData }) {
        const el = getSheet();

        // Booked a special from this sheet: mark its row, no second sheet.
        if (!el.hidden && joiningId && joiningId === sessionId) {
            joiningId = null;
            const action = el.querySelector(`[data-row="${CSS.escape(sessionId)}"] .sp-row-action`);
            const icon = typeof ACTION_ICONS !== "undefined" ? ACTION_ICONS.check : ""; // js/event-card.js
            if (action) action.innerHTML = `<span class="book-btn sa-chip-booked sp-booked-chip">${icon}<span>${esc(tx("booked", "Booked"))}</span></span>`;
            el.querySelector("#spDoneBtn").focus();
            return;
        }

        triggerEl = el.hidden ? document.activeElement : triggerEl;
        joiningId = null;
        suggestions = [];

        const sub = el.querySelector("#spBookedSub");
        sub.textContent = "";
        const suggest = el.querySelector("#spSuggest");
        suggest.hidden = true;
        el.querySelector("#spRows").innerHTML = "";

        const calendarBtn = el.querySelector("#spCalendarBtn");
        const calendarLink = bookData?.data?.googleCalendarLink;
        calendarBtn.hidden = !calendarLink;
        calendarBtn.onclick = calendarLink ? () => window.open(calendarLink, "_blank") : null;

        el.hidden = false;
        document.body.classList.add("sp-sheet-open");
        document.addEventListener("keydown", onKeydown);
        el.querySelector(".sp-sheet").focus();

        bookedSession(sessionId)
            .then(b => {
                if (!b || el.hidden) return;
                const d = new Date(b.startTime);
                sub.textContent = [b.title, isNaN(d) ? "" : `${dayText(d)}, ${timeText(d)}`].filter(Boolean).join(" · ");
            })
            .catch(err => console.error(err));

        // Opens straight away; the specials section appears if any come back.
        const params = new URLSearchParams({ limit: "2" });
        getJson(withUser(`${cfg().BASE_URL}/reading-sessions/${encodeURIComponent(sessionId)}/special-suggestions?${params}`))
            .then(json => {
                suggestions = (json.data || []).filter(x => x.isSpecial === true);
                if (!suggestions.length || el.hidden) return;
                el.querySelector("#spRows").innerHTML = suggestions.map(rowHtml).join("");
                suggest.hidden = false;
            })
            .catch(err => console.error(err));
    }

    // The normal booking flow (Confirm Booking modal, guidelines, penalties);
    // bookSession() then calls back into openBookedSheet for this session.
    async function joinFromSheet(id) {
        const raw = suggestions.find(x => x._id === id);
        if (!raw || typeof preBookingModal !== "function") return;
        if (!localStorage.getItem("userId")) {
            bookSession({ sessionId: id }); // sends them to log in
            return;
        }
        let options = typeof eventOptions !== "undefined" && eventOptions ? eventOptions : null;
        if (!options && typeof loadSessionOptions === "function") {
            try { options = await loadSessionOptions(); } catch (err) { console.error(err); }
        }
        joiningId = id;
        preBookingModal(id, formatReadingSessionToDisplay(raw, options));
    }

    window.Specials = { tagHtml, photoTagHtml, loadRow, openBookedSheet, closeSheet };
})();

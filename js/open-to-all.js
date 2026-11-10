/**
 * open-to-all.js
 * "Open to all" sessions: most sessions are members-only; admins mark a few
 * as open to anyone with a Lingping account.
 *
 *   OpenToAll.tagHtml(session)                 → "Open to all" pill for cards
 *   OpenToAll.showMembersOnlySheet(session, id) → pop-up for a 403 MEMBERS_ONLY booking
 *   OpenToAll.fetchIsAdmin(userId)             → GET /users/:id → role === "admin"
 *   OpenToAll.mountField(el, { initial, isEdit })
 *       → { getValue, handleSaveError }        admin-only "Who can join" form field
 *
 * The server ignores isOpenToAll from non-admins; hiding the field is only UX.
 */
(function () {
    const svg = (inner, size) =>
        `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

    const ICONS = {
        globe: size => svg('<circle cx="12" cy="12" r="9"></circle><line x1="3" y1="12" x2="21" y2="12"></line><path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18z"></path>', size),
        lock: size => svg('<rect x="4" y="11" width="16" height="10" rx="2"></rect><path d="M8 11V7a4 4 0 0 1 8 0v4"></path>', size),
        close: size => svg('<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>', size),
        info: size => svg('<circle cx="12" cy="12" r="9"></circle><line x1="12" y1="11" x2="12" y2="16"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>', size)
    };

    const EN = {
        openToAll: "Open to all",
        membersOnlyTitle: "This one needs a membership",
        membersOnlyBody: "Start or renew your membership to join {title}, and we'll finish booking it for you.",
        membersOnlyBodyGeneric: "Start or renew your membership to join this session, and we'll finish booking it for you.",
        seeMembership: "See membership",
        orTryOpenSession: "Or try an open session, free to join",
        join: "Join",
        close: "Close"
    };

    // translations.js when the page loads it; English otherwise.
    function L(key, vars) {
        let s = window.t ? t(key) : key;
        if (!s || s === key) s = EN[key] || key;
        if (vars) Object.keys(vars).forEach(k => { s = s.replace(`{${k}}`, vars[k]); });
        return s;
    }

    function esc(v) {
        return String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    }

    function cfg() {
        return window.CONFIG || {};
    }

    /* ---------------- 1. Card tag ---------------- */

    function tagHtml(session) {
        if (session?.isOpenToAll !== true) return "";
        return `<div class="ota-tag">${ICONS.globe(12)}<span>${esc(L("openToAll"))}</span></div>`;
    }

    /* ---------------- 2. Members-only pop-up ---------------- */

    function siteLocale() {
        const lang = window.getSiteLanguage ? window.getSiteLanguage() : "en";
        return lang === "zh" ? "zh-CN" : lang === "th" ? "th-TH" : "en-US";
    }

    function whenText(iso) {
        if (!iso) return "";
        const d = new Date(iso);
        const day = d.toLocaleDateString(siteLocale(), { weekday: "short", month: "short", day: "numeric" });
        const time = window.Utils?.formatTime ? Utils.formatTime(d) : d.toLocaleTimeString(siteLocale(), { hour: "numeric", minute: "2-digit" });
        return `${day} · ${time}`;
    }

    function placeText(session) {
        const level = String(session?.levelName || session?.level || "").toLowerCase();
        if (level.includes("online")) return window.t ? t("tabOnline") : "Online";
        return session?.location || "";
    }

    function thumbHtml(session) {
        if (session?.photoUrl) return `<img class="mo-thumb" src="${esc(session.photoUrl)}" alt="">`;
        const code = (session?.languages || [])[0]?.language || "";
        return `<span class="mo-thumb mo-thumb-initials" aria-hidden="true">${esc(code.slice(0, 2).toUpperCase())}</span>`;
    }

    let sheetTrigger = null;

    function closeSheet() {
        const overlay = document.getElementById("membersOnlySheet");
        if (!overlay || overlay.hidden) return;
        overlay.hidden = true;
        document.removeEventListener("keydown", onSheetKeydown);
        document.body.style.overflow = "";
        if (sheetTrigger && document.contains(sheetTrigger)) sheetTrigger.focus();
        sheetTrigger = null;
    }

    function onSheetKeydown(e) {
        const overlay = document.getElementById("membersOnlySheet");
        if (e.key === "Escape") {
            e.preventDefault();
            closeSheet();
            return;
        }
        if (e.key !== "Tab" || !overlay) return;
        const focusable = [...overlay.querySelectorAll("button, a[href]")].filter(el => !el.closest("[hidden]"));
        if (!focusable.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    function fmtDay(d) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }

    // Next upcoming open-to-all session with a free spot that the member isn't
    // already in. Prefers the same community (Online / Bangkok / …).
    async function findOpenSession(excludeId, level) {
        const now = new Date();
        const params = new URLSearchParams({ fromDate: fmtDay(now), toDate: fmtDay(new Date(now.getTime() + 21 * 86400000)) });
        let url = `${cfg().BASE_URL}/reading-sessions?${params}`;
        const userId = localStorage.getItem("userId");
        if (userId) url += `&userId=${encodeURIComponent(userId)}`;

        const res = await fetch(url, { headers: { "X-API-KEY": cfg().API_KEY } });
        if (!res.ok) return null;
        const json = await res.json();
        const candidates = (json.data || [])
            .filter(x => x.isOpenToAll === true && !x.isFull && !x.canceledAt && x._id !== excludeId
                && new Date(x.startTime) > now
                && !["booked", "hosting", "waitlisted"].includes(x.myStatus))
            .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        return candidates.find(x => level && x.level === level) || candidates[0] || null;
    }

    function getSheet() {
        let overlay = document.getElementById("membersOnlySheet");
        if (overlay) return overlay;
        overlay = document.createElement("div");
        overlay.id = "membersOnlySheet";
        overlay.className = "mo-overlay";
        overlay.hidden = true;
        overlay.addEventListener("click", e => {
            if (e.target === overlay || e.target.closest("[data-mo-close]")) closeSheet();
        });
        document.body.appendChild(overlay);
        return overlay;
    }

    /**
     * session: the card/detail session object if known (title, startTimeISO,
     * levelName, photoUrl, languages); sessionId is enough on its own.
     * onSeeMembership: called before leaving for the membership page (booking.js
     * uses it to remember the session so payment.js can finish booking it).
     */
    function showMembersOnlySheet(session, sessionId, { onSeeMembership } = {}) {
        const overlay = getSheet();
        const title = session?.title || "";
        const when = whenText(session?.startTimeISO || session?.startTime);
        const place = placeText(session);

        overlay.innerHTML = `
            <div class="mo-sheet" role="dialog" aria-modal="true" aria-labelledby="moTitle" aria-describedby="moBody">
                <div class="mo-grabber" aria-hidden="true"></div>
                <div class="mo-head">
                    <span class="mo-lock">${ICONS.lock(22)}</span>
                    <button type="button" class="mo-close" data-mo-close aria-label="${esc(L("close"))}">${ICONS.close(20)}</button>
                </div>
                <h2 class="mo-title" id="moTitle">${esc(L("membersOnlyTitle"))}</h2>
                <p class="mo-body" id="moBody">${esc(title ? L("membersOnlyBody", { title }) : L("membersOnlyBodyGeneric"))}</p>
                ${title ? `
                <div class="mo-session">
                    ${thumbHtml(session)}
                    <div class="mo-session-text">
                        <div class="mo-session-title">${esc(title)}</div>
                        <div class="mo-session-meta">${esc([when, place].filter(Boolean).join(" · "))}</div>
                    </div>
                </div>` : ""}
                <button type="button" class="mo-primary" data-mo-membership>${esc(L("seeMembership"))}</button>
                <div class="mo-open-wrap" hidden>
                    <div class="mo-open-label">${esc(L("orTryOpenSession"))}</div>
                    <div class="mo-open-slot"></div>
                </div>
            </div>`;

        overlay.querySelector("[data-mo-membership]").onclick = () => {
            if (onSeeMembership) onSeeMembership();
            if (typeof goToMembership === "function") goToMembership();
            else window.location.href = "subscriptions/subscription_main.html";
        };

        if (overlay.hidden) {
            sheetTrigger = document.activeElement;
            overlay.hidden = false;
            document.body.style.overflow = "hidden";
            document.addEventListener("keydown", onSheetKeydown);
        }
        overlay.querySelector("[data-mo-membership]").focus();

        // Opened without the session's details (e.g. booking right after login):
        // fetch them and fill in the session card.
        if (!title && sessionId && !session?._fetched) {
            fetch(`${cfg().BASE_URL}/reading-sessions/${encodeURIComponent(sessionId)}`, { headers: { "X-API-KEY": cfg().API_KEY } })
                .then(res => res.json())
                .then(json => {
                    if (json?.data?.title && !overlay.hidden) {
                        showMembersOnlySheet({ ...json.data, _fetched: true }, sessionId, { onSeeMembership });
                    }
                })
                .catch(err => console.error(err));
            return;
        }

        // The suggestion loads after the sheet is up; if none, the section stays hidden.
        findOpenSession(sessionId, session?.levelName || session?.level).then(open => {
            if (!open || overlay.hidden) return;
            const wrap = overlay.querySelector(".mo-open-wrap");
            const meta = `${L("openToAll")} · ${whenText(open.startTime)}`;
            wrap.querySelector(".mo-open-slot").innerHTML = `
                <a class="mo-open" href="event-detail.html?sessionId=${encodeURIComponent(open._id)}">
                    <span class="mo-open-text">
                        <span class="mo-open-title">${esc(open.title)}</span>
                        <span class="mo-open-meta">${esc(meta)}</span>
                    </span>
                    <span class="mo-open-join">${esc(L("join"))}</span>
                </a>`;
            wrap.hidden = false;
        }).catch(err => console.error("Open session lookup failed:", err));
    }

    /* ---------------- 3. Admin-only "Who can join" field ---------------- */

    async function fetchIsAdmin(userId) {
        if (!userId) return false;
        try {
            const res = await fetch(`${cfg().BASE_URL}/users/${encodeURIComponent(userId)}`, {
                headers: { "X-API-KEY": cfg().API_KEY }
            });
            const json = await res.json();
            return (json?.data?.role || json?.data?.user?.role) === "admin";
        } catch (err) {
            console.error("Could not load user role:", err);
            return false;
        }
    }

    function mountField(el, { initial = false, isEdit = false } = {}) {
        const saved = initial === true;
        el.innerHTML = `
            <fieldset class="ota-field">
                <legend class="label ota-legend">Who can join <span class="ota-admin-pill">Admin only</span></legend>
                <div class="hint ota-hint">Members only by default. Open to all lets non-members book this session.</div>
                <div class="ota-options">
                    <label class="ota-option">
                        <input type="radio" name="whoCanJoin" value="members" ${saved ? "" : "checked"}>
                        <span class="ota-option-text">
                            <span class="ota-option-title">${ICONS.lock(15)}Members only</span>
                            <span class="ota-option-desc">Only members with an active membership can book.</span>
                        </span>
                    </label>
                    <label class="ota-option">
                        <input type="radio" name="whoCanJoin" value="open" ${saved ? "checked" : ""}>
                        <span class="ota-option-text">
                            <span class="ota-option-title">${ICONS.globe(15)}Open to all</span>
                            <span class="ota-option-desc">Anyone with a Lingping account can book. Shows an “Open to all” tag.</span>
                        </span>
                    </label>
                </div>
                <div class="ota-note" hidden>${ICONS.info(16)}<span>People who already booked keep their spot. This only changes who can book from now on.</span></div>
                <div class="ota-error" id="otaError" role="alert" hidden></div>
            </fieldset>`;

        const getValue = () => el.querySelector('input[name="whoCanJoin"]:checked')?.value === "open";
        const errorEl = el.querySelector(".ota-error");

        el.addEventListener("change", () => {
            if (isEdit) el.querySelector(".ota-note").hidden = getValue() === saved;
            errorEl.hidden = true;
        });

        return {
            getValue,
            // Inline error for a 400 about this field. Returns true if handled.
            handleSaveError(json) {
                const text = [json?.message, json?.result?.message, json?.result?.error, json?.error]
                    .flat().filter(v => typeof v === "string").join(" ");
                if (!/isOpenToAll|open[ _-]?to[ _-]?all/i.test(text)) return false;
                const msg = [json?.result?.message, json?.message].flat().find(v => typeof v === "string" && v.trim());
                errorEl.textContent = msg || "Couldn't save who can join. Please try again.";
                errorEl.hidden = false;
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                return true;
            }
        };
    }

    window.OpenToAll = { tagHtml, showMembersOnlySheet, closeMembersOnlySheet: closeSheet, fetchIsAdmin, mountField };
})();

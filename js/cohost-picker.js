/**
 * cohost-picker.js
 * Host row + "Co-hosts" list + search / profile bottom sheet, used by
 * add-event.html and edit-event.html.
 *
 *   CohostPicker.mount(el, { hostId, hostName, hostPic, max, initial, hostIsYou })
 *     initial:   existing co-hosts [{ id, name, pic, bio }] (edit page)
 *     hostIsYou: false when an admin edits someone else's session (default true)
 *   CohostPicker.fromUser(user)    → { id, name, pic, bio } from a session's hosts[] entry
 *   CohostPicker.handleSaveError(json) → true if it was a host error (shown inline)
 *   CohostPicker.getIds()          → co-host user ids (host not included)
 *   CohostPicker.showError(msg)    → red message under Co-hosts
 *   CohostPicker.remove(userId)
 *
 * Search: GET /users/search?q=&limit=&userId= → [{ _id, profile: { displayName, profilePic, bio } }]
 */
(function () {
    const SEARCH_DEBOUNCE_MS = 250;
    const MIN_QUERY = 2;

    // [background, text] — each person always gets the same pair (hash of their id).
    const AVATAR_COLORS = [
        ["#f7d9b5", "#7a4a12"],
        ["#cfe2f7", "#1d4f86"],
        ["#d8edd5", "#2e6b33"],
        ["#f6b55e", "#5a3300"],
        ["#e6dcf7", "#4b3a86"],
        ["#f7d0d6", "#8a2b3c"]
    ];

    const ICONS = {
        plus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
        close: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
        search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
        check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        back: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"></path></svg>'
    };

    let opts = null;
    let root = null;
    let cohosts = [];            // [{ id, name, pic, bio }]
    let results = [];            // last search results, same shape
    let searchTimer = null;
    let searchSeq = 0;           // ignore replies to older searches
    let lastQuery = "";
    let sheet = null;
    let sheetTriggerEl = null;
    const profileCache = new Map(); // userId → GET /users/:id/profile data
    let profileSeq = 0;

    function esc(str) {
        return String(str ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    }

    function colorFor(id) {
        let h = 0;
        for (const ch of String(id || "")) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
        return AVATAR_COLORS[h % AVATAR_COLORS.length];
    }

    function avatarHtml(person, size) {
        const [bg, fg] = colorFor(person.id);
        const initial = esc((person.name || "?").trim().charAt(0).toUpperCase() || "?");
        const style = `width:${size}px;height:${size}px;font-size:${Math.round(size * 0.42)}px;background:${bg};color:${fg};`;
        // Broken photo URLs fall back to the initial.
        const img = person.pic
            ? `<img src="${esc(person.pic)}" alt="" onerror="this.remove()">`
            : "";
        return `<span class="ch-avatar" style="${style}" aria-hidden="true">${initial}${img}</span>`;
    }

    function fromApi(u) {
        const p = u.profile || {};
        return { id: u._id, name: p.displayName || u.displayName || "Member", pic: p.profilePic || "", bio: p.bio || "" };
    }

    function isAdded(id) {
        return cohosts.some(c => c.id === id);
    }

    function isFull() {
        return cohosts.length >= opts.max;
    }

    /* ---------------- Form section ---------------- */

    function renderSection() {
        const host = { id: opts.hostId, name: opts.hostName, pic: opts.hostPic };
        const count = cohosts.length;

        const listHtml = count
            ? `<div class="ch-card">
                    ${cohosts.map(c => `
                        <div class="ch-row">
                            ${avatarHtml(c, 40)}
                            <div class="ch-row-text">
                                <div class="ch-row-name">${esc(c.name)}</div>
                                <a class="ch-row-link" href="view-profile.html?userId=${encodeURIComponent(c.id)}" target="_blank" rel="noopener">View profile ›</a>
                            </div>
                            <button type="button" class="ch-icon-btn" data-remove="${esc(c.id)}" aria-label="Remove ${esc(c.name)}">${ICONS.close}</button>
                        </div>`).join("")}
                    ${isFull() ? "" : `
                        <button type="button" class="ch-add-another" data-open-search>${ICONS.plus}<span>Add another</span></button>`}
               </div>`
            : `<div class="ch-hint">Hosting with a friend? Add them so members see you both on the event.</div>
               <button type="button" class="ch-add-dashed" data-open-search>${ICONS.plus}<span>Add co-host</span></button>`;

        root.innerHTML = `
            <div class="section">
                <div class="label">Host</div>
                <div class="ch-host">
                    ${avatarHtml(host, 28)}
                    <span class="ch-host-name">${esc(host.name)}</span>
                    ${opts.hostIsYou ? `<span class="ch-host-you">· you</span>` : ""}
                </div>
            </div>

            <div class="section ch-section ${count ? "" : "ch-section-empty"}" tabindex="-1">
                <div class="ch-section-head">
                    <div class="label">Co-hosts</div>
                    <div class="ch-section-meta">${count ? `${count} of ${opts.max}` : `Optional · up to ${opts.max}`}</div>
                </div>
                ${listHtml}
                <div class="ch-error" id="cohostError" role="alert" hidden></div>
            </div>`;
    }

    function onSectionClick(e) {
        const removeBtn = e.target.closest("[data-remove]");
        if (removeBtn) {
            remove(removeBtn.getAttribute("data-remove"));
            return;
        }
        const openBtn = e.target.closest("[data-open-search]");
        if (openBtn) openSearch(openBtn);
    }

    function add(person) {
        if (!person || isAdded(person.id) || person.id === opts.hostId || isFull()) return;
        cohosts.push(person);
        clearError();
        renderSection();
    }

    function remove(id) {
        cohosts = cohosts.filter(c => c.id !== id);
        renderSection();
        if (sheet && !sheet.hidden) renderSheetResults();
    }

    function showError(msg) {
        const el = root.querySelector("#cohostError");
        if (!el) return;
        el.textContent = msg;
        el.hidden = !msg;
        if (msg) el.closest(".ch-section").scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function clearError() {
        const el = root.querySelector("#cohostError");
        if (el) { el.textContent = ""; el.hidden = true; }
    }

    /* ---------------- Bottom sheet ---------------- */

    function getSheet() {
        if (sheet) return sheet;
        sheet = document.createElement("div");
        sheet.className = "ch-overlay";
        sheet.hidden = true;
        sheet.innerHTML = `<div class="ch-sheet" role="dialog" aria-modal="true" aria-labelledby="chSheetTitle"><div class="ch-handle"></div><div class="ch-sheet-body"></div></div>`;
        sheet.addEventListener("click", e => {
            if (e.target === sheet) closeSheet();
        });
        document.body.appendChild(sheet);
        return sheet;
    }

    function sheetBody() {
        return getSheet().querySelector(".ch-sheet-body");
    }

    function onKeydown(e) {
        if (e.key === "Escape") {
            e.preventDefault();
            closeSheet();
            return;
        }
        if (e.key !== "Tab") return;
        // Keep focus inside the sheet.
        const focusables = [...sheet.querySelectorAll("button:not([disabled]), input, a[href]")]
            .filter(el => el.offsetParent !== null);
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    function openSearch(triggerEl) {
        const overlay = getSheet();
        if (overlay.hidden) {
            sheetTriggerEl = triggerEl || document.activeElement;
            overlay.hidden = false;
            document.body.classList.add("ch-no-scroll");
            document.addEventListener("keydown", onKeydown);
        }
        renderSearchView();
    }

    function closeSheet() {
        if (!sheet || sheet.hidden) return;
        sheet.hidden = true;
        document.body.classList.remove("ch-no-scroll");
        document.removeEventListener("keydown", onKeydown);
        clearTimeout(searchTimer);
        // The section re-renders, so the original button may be gone — fall back to the new one.
        const target = sheetTriggerEl && document.body.contains(sheetTriggerEl)
            ? sheetTriggerEl
            : root.querySelector("[data-open-search]") || root.querySelector(".ch-section");
        if (target && typeof target.focus === "function") target.focus();
    }

    // Desktop sizes the dialog per view (fixed for search, fit-content for a profile).
    function setSheetView(view) {
        getSheet().querySelector(".ch-sheet").setAttribute("data-view", view);
    }

    function renderSearchView() {
        setSheetView("search");
        const body = sheetBody();
        body.innerHTML = `
            <div class="ch-sheet-head">
                <div class="ch-sheet-title" id="chSheetTitle">Add co-host</div>
                <button type="button" class="ch-icon-btn" data-close aria-label="Close">${ICONS.close}</button>
            </div>
            <div class="ch-search">
                <span class="ch-search-icon">${ICONS.search}</span>
                <input type="search" id="chSearchInput" placeholder="Search by name" autocomplete="off" aria-label="Search members by name" value="${esc(lastQuery)}">
                <button type="button" class="ch-search-clear" data-clear aria-label="Clear search" ${lastQuery ? "" : "hidden"}>${ICONS.close}</button>
            </div>
            <div class="ch-search-hint">Search Lingping members by name · tap a photo to see their profile</div>
            <div class="ch-results" id="chResults" aria-live="polite"></div>`;

        body.querySelector("[data-close]").onclick = closeSheet;
        const input = body.querySelector("#chSearchInput");
        const clearBtn = body.querySelector("[data-clear]");
        input.addEventListener("input", () => {
            clearBtn.hidden = !input.value;
            scheduleSearch(input.value);
        });
        clearBtn.onclick = () => {
            input.value = "";
            clearBtn.hidden = true;
            scheduleSearch("");
            input.focus();
        };
        body.querySelector("#chResults").addEventListener("click", onResultsClick);

        renderSheetResults();
        input.focus();
    }

    function scheduleSearch(raw) {
        clearTimeout(searchTimer);
        const q = raw.trim();
        lastQuery = raw;
        if (q.length < MIN_QUERY) {
            searchSeq++; // drop any reply still in flight
            results = [];
            renderSheetResults();
            return;
        }
        searchTimer = setTimeout(() => runSearch(q), SEARCH_DEBOUNCE_MS);
    }

    async function runSearch(q) {
        const seq = ++searchSeq;
        renderSheetResults({ loading: true });
        try {
            const { BASE_URL, API_KEY } = window.CONFIG;
            const params = new URLSearchParams({ q, limit: "10", userId: opts.hostId });
            const res = await fetch(`${BASE_URL}/users/search?${params}`, {
                headers: { "X-API-KEY": API_KEY }
            });
            const json = await res.json();
            if (seq !== searchSeq) return;
            if (!res.ok || !json.status) throw new Error(json.message || "Search failed");
            results = (json.data || []).map(fromApi);
            renderSheetResults();
        } catch (err) {
            if (seq !== searchSeq) return;
            console.error("Co-host search failed:", err);
            results = [];
            renderSheetResults({ error: true });
        }
    }

    function renderSheetResults(state = {}) {
        const box = sheet && sheet.querySelector("#chResults");
        if (!box) return;
        const q = lastQuery.trim();

        if (q.length < MIN_QUERY) {
            box.innerHTML = `<div class="ch-empty">Type at least ${MIN_QUERY} letters of their name.</div>`;
            return;
        }
        if (state.loading && !results.length) {
            box.innerHTML = `<div class="ch-empty">Searching…</div>`;
            return;
        }
        if (state.error) {
            box.innerHTML = `<div class="ch-empty">Couldn't search right now. Please try again.</div>`;
            return;
        }

        const rows = results.map(p => {
            const isSelf = p.id === opts.hostId;
            const added = isAdded(p.id);
            let action = "";
            if (isSelf) action = "";
            else if (added) action = `<button type="button" class="ch-pill ch-pill-added" data-toggle="${esc(p.id)}" aria-label="Remove ${esc(p.name)}">${ICONS.check}<span>Added</span></button>`;
            else action = `<button type="button" class="ch-pill ch-pill-add" data-toggle="${esc(p.id)}" ${isFull() ? "disabled" : ""}>Add</button>`;

            return `
                <div class="ch-result ${isSelf ? "ch-result-self" : ""}">
                    ${isSelf
                        ? avatarHtml(p, 44)
                        : `<button type="button" class="ch-result-person" data-profile="${esc(p.id)}" aria-label="See ${esc(p.name)}'s profile">${avatarHtml(p, 44)}</button>`}
                    <div class="ch-result-text" ${isSelf ? "" : `data-profile="${esc(p.id)}"`}>
                        <div class="ch-result-name">${esc(p.name)}</div>
                        <div class="ch-result-bio">${isSelf ? (opts.hostIsYou ? "That's you, already the host" : "Already the host") : esc(p.bio)}</div>
                    </div>
                    ${action}
                </div>`;
        }).join("");

        const fullNote = isFull() ? `<div class="ch-empty">You can add up to ${opts.max} co-hosts.</div>` : "";

        box.innerHTML = `
            ${rows}
            ${fullNote}
            <div class="ch-nomatch"><strong>No match?</strong> Only Lingping members show up here. Ask your friend to sign up first.</div>`;
    }

    function onResultsClick(e) {
        const toggle = e.target.closest("[data-toggle]");
        if (toggle) {
            const id = toggle.getAttribute("data-toggle");
            if (isAdded(id)) remove(id);
            else add(results.find(p => p.id === id));
            renderSheetResults();
            // Re-rendering replaced the button; keep keyboard focus on the same row.
            sheet.querySelector(`[data-toggle="${CSS.escape(id)}"]`)?.focus();
            return;
        }
        const profile = e.target.closest("[data-profile]");
        if (profile) renderProfileView(profile.getAttribute("data-profile"));
    }

    function renderProfileView(id) {
        const p = results.find(x => x.id === id);
        if (!p) return;
        const added = isAdded(id);
        setSheetView("profile");
        const body = sheetBody();

        body.innerHTML = `
            <div class="ch-sheet-head">
                <button type="button" class="ch-back" data-back>${ICONS.back}<span>Search</span></button>
                <button type="button" class="ch-icon-btn" data-close aria-label="Close">${ICONS.close}</button>
            </div>
            <div class="ch-profile">
                <div class="ch-profile-avatar">${avatarHtml(p, 112)}</div>
                <div class="ch-profile-name" id="chSheetTitle">${esc(p.name)}</div>
                ${p.bio ? `<div class="ch-profile-bio">${esc(p.bio)}</div>` : ""}
                <div class="ch-profile-more" id="chProfileMore">
                    ${profileCache.has(id) ? profileDetailsHtml(profileCache.get(id), p.name) : `<div class="ch-empty">Loading profile…</div>`}
                </div>
            </div>
            <div class="ch-profile-actions">
                <div class="ch-profile-note">${esc(p.name)} will appear as a host on your event card and session page.</div>
                ${added
                    ? `<button type="button" class="ch-primary ch-primary-added" disabled>${ICONS.check}<span>${esc(p.name)} is a co-host</span></button>`
                    : isFull()
                        ? `<button type="button" class="ch-primary" disabled>You can add up to ${opts.max} co-hosts</button>`
                        : `<button type="button" class="ch-primary" data-add>${ICONS.plus}<span>Add ${esc(p.name)} as co-host</span></button>`}
                <button type="button" class="ch-text-btn" data-back>Not now</button>
            </div>`;

        body.querySelector("[data-close]").onclick = closeSheet;
        body.querySelectorAll("[data-back]").forEach(b => b.onclick = renderSearchView);
        if (!profileCache.has(id)) loadProfileDetails(id, p.name);
        const addBtn = body.querySelector("[data-add]");
        if (addBtn) {
            addBtn.onclick = () => {
                add(p);
                closeSheet();
            };
            addBtn.focus();
        } else {
            body.querySelector("[data-back]").focus();
        }
    }

    // Same sections as view-profile.html: About, Topics of Interest, Fun Facts.
    function profileDetailsHtml(data, name) {
        if (!data) return "";
        const about = (data.description || "").trim();
        const topics = (data.topicsOfInterests || []).map(t => t?.name).filter(Boolean);
        const facts = (data.funPrompts || []).filter(fp => fp?.answer && fp.answer.trim());

        const html = `
            ${about.length > 1 ? `
                <div class="ch-profile-section">
                    <div class="ch-profile-section-title">About ${esc(name)}</div>
                    <p class="ch-profile-desc">${esc(about)}</p>
                </div>` : ""}
            ${topics.length ? `
                <div class="ch-profile-section">
                    <div class="ch-profile-section-title">Topics of Interest</div>
                    <div>${topics.map(t => `<span class="ch-topic">${esc(t)}</span>`).join("")}</div>
                </div>` : ""}
            ${facts.length ? `
                <div class="ch-profile-section">
                    <div class="ch-profile-section-title">Fun Facts</div>
                    ${facts.map(fp => `
                        <div class="ch-fun">
                            <strong>${esc(fp.question)}</strong>
                            <div class="ch-fun-answer">${esc(fp.answer)}</div>
                        </div>`).join("")}
                </div>` : ""}`;
        return html.trim();
    }

    async function loadProfileDetails(id, name) {
        const seq = ++profileSeq;
        let data = null;
        try {
            const { BASE_URL, API_KEY } = window.CONFIG;
            const res = await fetch(`${BASE_URL}/users/${encodeURIComponent(id)}/profile`, {
                headers: { "X-API-KEY": API_KEY }
            });
            if (res.ok) {
                const json = await res.json();
                data = json?.data || null;
            }
        } catch (err) {
            console.error("Failed to load co-host profile:", err);
        }
        if (data) profileCache.set(id, data);

        // The user may have gone back or opened someone else meanwhile.
        const box = sheet && sheet.querySelector("#chProfileMore");
        if (!box || seq !== profileSeq) return;
        box.innerHTML = data ? profileDetailsHtml(data, name) : "";
    }

    /* ---------------- Public API ---------------- */

    window.CohostPicker = {
        mount(el, options) {
            root = el;
            opts = { max: 3, hostIsYou: true, ...options };
            cohosts = (options.initial || []).filter(c => c && c.id && c.id !== opts.hostId);
            root.addEventListener("click", onSectionClick);
            renderSection();
        },
        // Update the host row once the profile (photo / display name) has loaded.
        setHost({ name, pic }) {
            if (name) opts.hostName = name;
            if (pic) opts.hostPic = pic;
            renderSection();
        },
        getIds() {
            return cohosts.map(c => c.id);
        },
        getName(id) {
            return cohosts.find(c => c.id === id)?.name || null;
        },
        remove,
        showError,
        clearError,
        fromUser(u) {
            if (!u) return null;
            if (typeof u === "string") return { id: u, name: "Member", pic: "", bio: "" };
            const p = u.profile || {};
            return { id: u._id || u.id, name: p.displayName || u.displayName || "Member", pic: p.profilePic || u.profilePic || "", bio: p.bio || "" };
        },
        // Host-related rejections from POST/PATCH /reading-sessions show under
        // Co-hosts instead of an alert(). A co-host that no longer exists is removed.
        handleSaveError(json) {
            const result = json?.result || {};
            const code = result.error || "";
            const message = Array.isArray(json?.message) ? json.message.join(" ") : (json?.message || result.message || "");
            const badId = result.userId;
            if (!/^HOST_/.test(code) && !/\bhosts?\b/i.test(message)) return false;

            if (badId && /invalid|not found|not exist/i.test(message)) {
                const name = cohosts.find(c => c.id === badId)?.name;
                remove(badId);
                showError(name
                    ? `${name} couldn't be found, so we removed them. Please check and try again.`
                    : message);
            } else {
                showError(message || "Please check your co-hosts and try again.");
            }
            return true;
        }
    };
})();

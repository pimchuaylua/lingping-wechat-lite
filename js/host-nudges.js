/**
 * host-nudges.js
 * "Host anything, anytime" nudges on the index.html events list. Copy lives in
 * js/host-content.js.
 *
 *   HostNudges.groupByDay(sessions)  → [{ date, sessions }], one per day with sessions
 *   HostNudges.dayHeaderHtml(date)
 *   HostNudges.nudgeCardHtml({ noMatch })  compact "Host Anything, Anytime!" card:
 *       the first few idea chips in a sideways scroller; "+ More" shows the rest.
 *   HostNudges.toggle(btn)  "+ More" / "− Less", remembered per member.
 */
(function () {
    const C = window.HostContent;
    // Per user, so one account's More/Less choice doesn't carry over to the next.
    // New key: the old "Hide" values meant all chips hidden, not three shown.
    const collapsedKey = () => `lp_hostNudgeFewer:${localStorage.getItem("userId") || "guest"}`;

    const esc = v => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

    // "YYYY-MM-DD" → local midnight (new Date("YYYY-MM-DD") would be UTC).
    function parseDay(iso) {
        const [y, m, d] = iso.split("-").map(Number);
        return new Date(y, m - 1, d);
    }

    function dateLocale() {
        const lang = window.getSiteLanguage ? window.getSiteLanguage() : "en";
        return lang === "zh" ? "zh-CN" : lang === "th" ? "th-TH" : "en-US";
    }

    function groupByDay(sessions) {
        const byDay = new Map();
        sessions.forEach(s => {
            if (!byDay.has(s.date)) byDay.set(s.date, []);
            byDay.get(s.date).push(s);
        });
        return [...byDay.keys()].sort().map(date => ({ date, sessions: byDay.get(date) }));
    }

    function dayHeaderHtml(date) {
        const label = parseDay(date).toLocaleDateString(dateLocale(), { weekday: "short", month: "short", day: "numeric" });
        return `<h2 class="hn-day">${esc(label)}</h2>`;
    }

    // The member's own More / Less choice wins; otherwise use the default.
    function isCollapsed(defaultCollapsed) {
        try {
            const saved = localStorage.getItem(collapsedKey());
            return saved === null ? defaultCollapsed : saved === "1";
        } catch (e) {
            return defaultCollapsed; // storage blocked
        }
    }

    function toggleInnerHtml(collapsed) {
        const n = C.NUDGE;
        return `${C.icon(collapsed ? "plus" : "minus", 15, 2.2)}<span>${esc(collapsed ? n.moreLabel : n.fewerLabel)}</span>`;
    }

    function nudgeCardHtml({ noMatch = false } = {}) {
        const n = C.NUDGE;
        const collapsed = isCollapsed(true);
        const chips = n.chips.map((chip, i) => {
            const href = chip.category
                ? `${C.LINKS.startPage}?category=${encodeURIComponent(chip.category)}`
                : C.LINKS.startPage;
            const style = chip.tint ? `background:${chip.tint};color:${chip.ink}` : `color:${chip.ink}`;
            const extra = i >= n.visibleChips;
            return `<a class="hn-chip${chip.tint ? "" : " hn-chip--else"}${extra ? " hn-chip--more" : ""}" href="${href}" style="${style}"${extra && collapsed ? " hidden" : ""}>${C.icon(chip.icon, 15, 2)}<span>${esc(chip.label)}</span></a>`;
        }).join("");

        // The + circle and the title both open the start page.
        return `
            <section class="hn-card" aria-label="${esc(n.title)}">
                ${noMatch ? `<p class="hn-nomatch">${esc(n.noMatch)}</p>` : ""}
                <a class="hn-head" href="${C.LINKS.startPage}">
                    <span class="hn-plus" aria-hidden="true">${C.icon("plus", 18, 2.4)}</span>
                    <h3 class="hn-title">${esc(n.title)}</h3>
                </a>
                <div class="hn-chips${collapsed ? " is-fewer" : ""}" id="hnChips">${chips}<button type="button"
                    class="hn-chip hn-toggle" aria-expanded="${!collapsed}" aria-controls="hnChips"
                    onclick="HostNudges.toggle(this)">${toggleInnerHtml(collapsed)}</button></div>
            </section>`;
    }

    // + More / − Less: shows the rest of the chips; remembered per member.
    function toggle(btn) {
        const collapsed = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!collapsed));
        btn.innerHTML = toggleInnerHtml(collapsed);
        const chips = document.getElementById(btn.getAttribute("aria-controls"));
        if (chips) {
            chips.classList.toggle("is-fewer", collapsed);
            chips.querySelectorAll(".hn-chip--more").forEach(el => { el.hidden = collapsed; });
        }
        try {
            localStorage.setItem(collapsedKey(), collapsed ? "1" : "0");
        } catch (e) { /* storage blocked: until the next render only */ }
    }

    window.HostNudges = { groupByDay, dayHeaderHtml, nudgeCardHtml, toggle };
})();

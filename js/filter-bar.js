/**
 * filter-bar.js
 * Location tabs + city dropdown, a "What are you feeling?" (category)
 * page, a merged Language & Level page, and a real single-date/date-range
 * calendar.
 *
 * Category/Language/Level options, icons and flags come from data already
 * loaded elsewhere on the page (eventOptions from /reading-sessions/options,
 * CATEGORY_ICONS / LANG_META from render-langague-level.js) — nothing here
 * is hardcoded.
 *
 * Usage: FilterBar.init({ onlineLevelId, cities, eventOptions, getSessions,
 * initialLevelId, onLocationChange, onDateApply, onFiltersChange }).
 */

const FilterBar = (function () {
    let cfg = null;
    const state = { categories: new Set(), languages: new Set(), levels: new Set() };
    const LEVEL_ICONS = { beginner: '🌱', upper_beginner: '🌿', intermediate: '🗣️', advanced: '🔥' };

    let rangeStart = null; // Date at local midnight, or null = no date filter
    let rangeEnd = null;   // Date, or null = single day / no selection
    let calMonths = [];    // [{ year, month0 }, ...]
    let calIndex = 0;

    function todayMidnight() {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }
    function addDays(date, n) {
        const d = new Date(date);
        d.setDate(d.getDate() + n);
        return d;
    }
    function sameDay(a, b) {
        return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    }
    function toISO(d) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }

    /* ---------------- Location: Online / In Person + city dropdown ---------------- */

    function setLocation(which) {
        document.getElementById('lpTabOnline').classList.toggle('lp-loc-tab--active', which === 'online');
        document.getElementById('lpTabPerson').classList.toggle('lp-loc-tab--active', which === 'person');
        document.getElementById('lpDtTabOnline')?.classList.toggle('lp-loc-tab--active', which === 'online');
        document.getElementById('lpDtTabPerson')?.classList.toggle('lp-loc-tab--active', which === 'person');
        document.getElementById('lpCityWrap').classList.toggle('lp-show', which === 'person');
        document.getElementById('lpDtCityWrap')?.classList.toggle('lp-show', which === 'person');
        if (which !== 'person') closeCityDrop();

        if (which === 'online') {
            cfg.onLocationChange(cfg.onlineLevelId);
        } else {
            const active = document.querySelector('.lp-citydrop-item--active');
            const city = cfg.cities.find(c => c.name === active?.dataset?.name) || cfg.cities[0];
            if (city) cfg.onLocationChange(city.levelId);
        }
        updateWhereLabel(which);
    }
    function toggleCityDrop() {
        document.getElementById('lpCityListPanel').classList.toggle('lp-open');
        document.getElementById('lpCityBtn').classList.toggle('lp-open');
    }
    function closeCityDrop() {
        document.getElementById('lpCityListPanel').classList.remove('lp-open');
        document.getElementById('lpCityBtn').classList.remove('lp-open');
    }
    function selectCity(name) {
        const city = cfg.cities.find(c => c.name === name);
        if (!city) return;
        document.getElementById('lpCityLabel').textContent = name;
        document.querySelectorAll('.lp-citydrop-item').forEach(item => {
            item.classList.toggle('lp-citydrop-item--active', item.dataset.name === name);
        });
        closeCityDrop();
        closeDtSegs();
        cfg.onLocationChange(city.levelId);
        updateWhereLabel('person');
    }

    /** Desktop "Where" segment shares the same location state as the mobile tabs/city list. */
    function updateWhereLabel(which) {
        const val = document.getElementById('lpDtLocVal');
        if (!val) return;
        if (which === 'online') {
            val.textContent = '🌐 Online';
        } else {
            const cityName = document.getElementById('lpCityLabel')?.textContent || cfg.cities[0]?.name || '';
            val.textContent = `📍 ${cityName}`;
        }
    }

    /** Renders the same city list into both the mobile dropdown and the
     * desktop "Where" dropdown so they never drift out of sync. */
    function renderCityList() {
        let html = '';
        let lastCountry = null;
        cfg.cities.forEach(city => {
            if (city.country && city.country !== lastCountry) {
                html += `<div class="lp-citydrop-category">${city.country}</div>`;
                lastCountry = city.country;
            }
            html += `<div class="lp-citydrop-item" data-name="${city.name}" onclick="FilterBar.selectCity('${city.name}')">${city.name}</div>`;
        });
        const panel = document.getElementById('lpCityListPanel');
        if (panel) panel.innerHTML = html;
        const dtList = document.getElementById('lpDtCityList');
        if (dtList) dtList.innerHTML = html;
    }

    /** Preselect the Online/In-Person tab + city to match a level id already in effect (e.g. restored from localStorage). */
    function setInitialLocation(levelId) {
        const city = cfg.cities.find(c => c.levelId === levelId);
        if (city) {
            document.querySelectorAll('.lp-citydrop-item').forEach(item => {
                item.classList.toggle('lp-citydrop-item--active', item.dataset.name === city.name);
            });
            document.getElementById('lpCityLabel').textContent = city.name;
            document.getElementById('lpTabOnline').classList.remove('lp-loc-tab--active');
            document.getElementById('lpTabPerson').classList.add('lp-loc-tab--active');
            document.getElementById('lpDtTabOnline')?.classList.remove('lp-loc-tab--active');
            document.getElementById('lpDtTabPerson')?.classList.add('lp-loc-tab--active');
            document.getElementById('lpCityWrap').classList.add('lp-show');
            document.getElementById('lpDtCityWrap')?.classList.add('lp-show');
            updateWhereLabel('person');
        } else {
            document.querySelector('.lp-citydrop-item')?.classList.add('lp-citydrop-item--active');
            document.getElementById('lpTabOnline').classList.add('lp-loc-tab--active');
            document.getElementById('lpTabPerson').classList.remove('lp-loc-tab--active');
            document.getElementById('lpDtTabOnline')?.classList.add('lp-loc-tab--active');
            document.getElementById('lpDtTabPerson')?.classList.remove('lp-loc-tab--active');
            updateWhereLabel('online');
        }
    }

    /* ---------------- Mood (category) — mobile full-screen page + desktop dropdown ---------------- */

    function openMood() {
        renderMoodList();
        document.getElementById('lpMoodPanel').classList.add('lp-open');
    }
    function closeMood() { document.getElementById('lpMoodPanel').classList.remove('lp-open'); }
    function resetMood() {
        state.categories = new Set();
        renderMoodList();
        cfg.onFiltersChange();
    }

    /** Single source of truth for category state — re-renders every surface
     * that shows it (mobile list, desktop dropdown list, both labels, quick chips). */
    function renderMoodList() {
        const opts = {
            iconFor: v => CATEGORY_ICONS[v] || '',
            showDesc: false,
            onToggle: renderMoodList
        };
        renderCheckList(document.getElementById('lpMoodList'), cfg.eventOptions.categories, state.categories, opts);
        renderCheckList(document.getElementById('lpDtMoodList'), cfg.eventOptions.categories, state.categories, opts);
        updateMoodLabel();
        updateQuickChips();
        updateSearchBadge();
        cfg.onFiltersChange();
    }

    /** Builds the "N picked" label text. `withIcon` is false for mobile,
     * whose leading emoji is a static sibling of the label span (baked into
     * the HTML, always visible) — including it in the text too would
     * duplicate it. Desktop's span has no such sibling, so it needs its own
     * icon inline. */
    function updateMoodLabel() {
        const picked = (cfg.eventOptions.categories || []).filter(it => state.categories.has(it.value));
        function text(withIcon) {
            if (!picked.length) return null;
            const icon = withIcon ? `${CATEGORY_ICONS[picked[0].value] || ''} ` : '';
            const base = `${icon}${picked[0].label}`;
            return picked.length === 1 ? base : `${base} +${picked.length - 1}`;
        }

        [
            { btn: document.getElementById('lpMoodBtn'), label: document.getElementById('lpMoodLabel'), text: text(false), placeholder: 'What are you feeling?' },
            { btn: document.getElementById('lpDtSegMood'), label: document.getElementById('lpDtMoodVal'), text: text(true), placeholder: '💭 What are you feeling?' }
        ].forEach(({ btn, label, text, placeholder }) => {
            if (!btn || !label) return;
            label.textContent = text || placeholder;
            btn.classList.toggle('lp-placeholder', !text);
        });

        const summary = document.getElementById('lpMoodSummary');
        if (summary) summary.textContent = text(false) || '';
    }

    function updateQuickChips() {
        document.querySelectorAll('.lp-dt-qchip[data-cat]').forEach(el => {
            const value = el.dataset.cat;
            el.classList.toggle('lp-active', state.categories.has(value));
            const meta = (cfg.eventOptions.categories || []).find(c => c.value === value);
            if (meta) el.textContent = `${CATEGORY_ICONS[value] || ''} ${meta.label}`;
        });
    }

    function toggleQuickCategory(value) {
        if (state.categories.has(value)) state.categories.delete(value); else state.categories.add(value);
        renderMoodList();
    }

    /* ---------------- Language & Level — mobile full-screen page + desktop dropdown ---------------- */

    function openLangLevel() {
        renderLangLevelLists();
        document.getElementById('lpLangLevelPanel').classList.add('lp-open');
    }
    function closeLangLevel() { document.getElementById('lpLangLevelPanel').classList.remove('lp-open'); }
    function resetLangLevel() {
        state.languages = new Set();
        state.levels = new Set();
        renderLangLevelLists();
        cfg.onFiltersChange();
    }

    function renderLangLevelLists() {
        const langOpts = { iconFor: v => LANG_META[v]?.flag || '', showDesc: false, onToggle: renderLangLevelLists };
        const lvlOpts = { iconFor: v => LEVEL_ICONS[v] || '', showDesc: true, onToggle: renderLangLevelLists };

        renderCheckList(document.getElementById('lpLangList'), cfg.eventOptions.languages, state.languages, langOpts);
        renderCheckList(document.getElementById('lpDtLangList'), cfg.eventOptions.languages, state.languages, langOpts);
        renderCheckList(document.getElementById('lpLevelList'), cfg.eventOptions.proficiencyLevels, state.levels, lvlOpts);
        renderCheckList(document.getElementById('lpDtLevelList'), cfg.eventOptions.proficiencyLevels, state.levels, lvlOpts);

        updateLangLevelLabel();
        updateSearchBadge();
        cfg.onFiltersChange();
    }

    /** Same withIcon split as updateMoodLabel: mobile's 🗣️ is a static
     * sibling of the label span, desktop's span has no such sibling. */
    function updateLangLevelLabel() {
        const pickedLang = (cfg.eventOptions.languages || []).filter(it => state.languages.has(it.value));
        const pickedLvl = (cfg.eventOptions.proficiencyLevels || []).filter(it => state.levels.has(it.value));

        function text(withIcon) {
            if (!pickedLang.length && !pickedLvl.length) return null;
            const parts = [];
            if (pickedLang.length) {
                const icon = withIcon ? `${LANG_META[pickedLang[0].value]?.flag || ''} ` : '';
                const t = `${icon}${pickedLang[0].label}`;
                parts.push(pickedLang.length === 1 ? t : `${t} +${pickedLang.length - 1}`);
            }
            if (pickedLvl.length) {
                parts.push(pickedLvl.length === 1 ? pickedLvl[0].label : `${pickedLvl[0].label} +${pickedLvl.length - 1}`);
            }
            return parts.join(' · ');
        }

        [
            { btn: document.getElementById('lpLangLevelBtn'), label: document.getElementById('lpLangLevelLabel'), text: text(false), placeholder: 'Which language?' },
            { btn: document.getElementById('lpDtSegLang'), label: document.getElementById('lpDtLangVal'), text: text(true), placeholder: '🗣️ Which language?' }
        ].forEach(({ btn, label, text, placeholder }) => {
            if (!btn || !label) return;
            label.textContent = text || placeholder;
            btn.classList.toggle('lp-placeholder', !text);
        });

        const summary = document.getElementById('lpLangSummary');
        if (summary) summary.textContent = text(false) || '';
    }

    /** Badge on the collapsed search pill: total facets selected across
     * category/language/level, hidden entirely at 0. */
    function updateSearchBadge() {
        const badge = document.getElementById('lpSearchBadge');
        if (!badge) return;
        const count = state.categories.size + state.languages.size + state.levels.size;
        badge.textContent = String(count);
        badge.hidden = count === 0;
    }

    function toggleSearchExpand() {
        document.getElementById('lpSearchbar')?.classList.toggle('lp-open');
        document.getElementById('lpSearchExpand')?.classList.toggle('lp-open');
    }

    function resetAllFilters() {
        state.categories = new Set();
        state.languages = new Set();
        state.levels = new Set();
        renderMoodList();
        renderLangLevelLists();
    }

    /* ---------------- Desktop dropdown open/close ---------------- */

    const DT_SEG_IDS = { loc: 'lpDtSegLoc', mood: 'lpDtSegMood', lang: 'lpDtSegLang' };

    function toggleDtSeg(name) {
        const target = document.getElementById(DT_SEG_IDS[name]);
        if (!target) return;
        const wasOpen = target.classList.contains('lp-dt-open');
        Object.values(DT_SEG_IDS).forEach(id => document.getElementById(id)?.classList.remove('lp-dt-open'));
        if (!wasOpen) target.classList.add('lp-dt-open');
    }

    function closeDtSegs() {
        Object.values(DT_SEG_IDS).forEach(id => document.getElementById(id)?.classList.remove('lp-dt-open'));
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.lp-dt-pill')) closeDtSegs();
    });

    /* ---------------- Shared checkbox-list renderer ---------------- */

    /** Renders a multi-select checkbox list into `container`. Row tap toggles
     * membership in `selectedSet` and calls `onToggle` (which re-renders every
     * surface reading that Set — mobile and desktop stay in sync from one
     * source of truth); when `showDesc` is true, an (i) button toggles the
     * description open/closed without affecting selection or closing anything. */
    function renderCheckList(container, items, selectedSet, { iconFor, showDesc, onToggle }) {
        if (!container) return;
        container.innerHTML = (items || []).map(item => {
            const active = selectedSet.has(item.value);
            const hasDesc = showDesc && item.description;
            return `
                <div class="lp-picker-item${active ? ' lp-active' : ''}" data-value="${item.value}">
                    <span class="lp-ic">${iconFor(item.value)}</span>
                    <span class="lp-txt">
                        <span class="lp-lbl">${item.label}${hasDesc ? ` <button type="button" class="lp-info-btn" aria-label="More info">i</button>` : ''}</span>
                        ${hasDesc ? `<span class="lp-desc">${item.description}</span>` : ''}
                    </span>
                    <span class="lp-check">${active ? '✓' : ''}</span>
                </div>
            `;
        }).join('');

        container.querySelectorAll('.lp-picker-item').forEach(row => {
            const value = row.dataset.value;
            row.onclick = () => {
                if (selectedSet.has(value)) selectedSet.delete(value); else selectedSet.add(value);
                if (onToggle) onToggle();
            };
            const infoBtn = row.querySelector('.lp-info-btn');
            if (infoBtn) {
                infoBtn.onclick = (e) => {
                    e.stopPropagation();
                    row.classList.toggle('lp-desc-open');
                };
            }
        });
    }

    function filterSessions(sessions) {
        return (sessions || []).filter(s => {
            if (state.categories.size && !(s.categories || []).some(c => state.categories.has(c))) return false;
            if (state.languages.size && !(s.languages || []).some(l => state.languages.has(l.language))) return false;
            if (state.levels.size && !(s.languages || []).some(l => state.levels.has(l.proficiencyLevel))) return false;
            return true;
        });
    }

    /* ---------------- Calendar: single date or range ---------------- */

    function buildCalMonths() {
        const t = todayMidnight();
        calMonths = [0, 1, 2].map(i => {
            const d = new Date(t.getFullYear(), t.getMonth() + i, 1);
            return { year: d.getFullYear(), month0: d.getMonth() };
        });
    }

    function monthIndexFor(date) {
        const idx = calMonths.findIndex(m => m.year === date.getFullYear() && m.month0 === date.getMonth());
        return idx === -1 ? 0 : idx;
    }

    function renderCalendar() {
        const m = calMonths[calIndex];
        const monthLabel = new Date(m.year, m.month0, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        document.getElementById('lpCalMonthLabel').textContent = monthLabel;
        document.getElementById('lpCalPrev').classList.toggle('lp-disabled', calIndex === 0);
        document.getElementById('lpCalNext').classList.toggle('lp-disabled', calIndex === calMonths.length - 1);

        const today = todayMidnight();
        const firstDow = new Date(m.year, m.month0, 1).getDay();
        const daysInMonth = new Date(m.year, m.month0 + 1, 0).getDate();

        const grid = document.getElementById('lpCalGrid');
        grid.innerHTML = '';
        for (let i = 0; i < firstDow; i++) {
            const blank = document.createElement('div');
            blank.className = 'lp-cal-cell lp-empty';
            grid.appendChild(blank);
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(m.year, m.month0, d);
            const cls = ['lp-cal-cell'];
            const isPast = date < today;
            if (isPast) cls.push('lp-disabled');
            if (sameDay(date, today)) cls.push('lp-today');
            if (sameDay(date, rangeStart) || sameDay(date, rangeEnd)) cls.push('lp-active');
            else if (rangeStart && rangeEnd && date > rangeStart && date < rangeEnd) cls.push('lp-inrange');

            const cell = document.createElement('div');
            cell.className = cls.join(' ');
            cell.textContent = d;
            if (!isPast) cell.onclick = () => onDayTap(date);
            grid.appendChild(cell);
        }
    }

    function onDayTap(date) {
        if (!rangeStart || rangeEnd) {
            rangeStart = date;
            rangeEnd = null;
        } else if (date < rangeStart) {
            rangeEnd = rangeStart;
            rangeStart = date;
        } else if (date > rangeStart) {
            rangeEnd = date;
        }
        afterDateChange();
    }

    function afterDateChange() {
        renderCalendar();
        updateDateLabel();
        updateCalFooter();
        updateQuickState();
    }

    function updateDateLabel() {
        const text = !rangeStart
            ? 'Anytime'
            : !rangeEnd
                ? Utils.formatDate(rangeStart)
                : `${Utils.formatDate(rangeStart)} – ${Utils.formatDate(rangeEnd)}`;
        const label = document.getElementById('lpDateLabel');
        if (label) label.textContent = text;
        document.getElementById('lpDateBtn')?.classList.toggle('lp-placeholder', !rangeStart);
        const dtVal = document.getElementById('lpDtDateVal');
        if (dtVal) dtVal.textContent = text;
        document.getElementById('lpDtSegWhen')?.classList.toggle('lp-placeholder', !rangeStart);
        const summary = document.getElementById('lpDateSummary');
        if (summary) summary.textContent = text;
    }

    function updateCalFooter() {
        const btn = document.getElementById('lpCalFootBtn');
        if (!rangeStart) {
            btn.textContent = 'Show upcoming events';
        } else if (!rangeEnd) {
            btn.textContent = `Show events on ${Utils.formatDate(rangeStart)}`;
        } else {
            btn.textContent = `Show events ${Utils.formatDate(rangeStart)} – ${Utils.formatDate(rangeEnd)}`;
        }
    }

    function updateQuickState() {
        const today = todayMidnight();
        const isToday = rangeStart && !rangeEnd && sameDay(rangeStart, today);
        const weekend = weekendRange();
        const isWeekend = rangeStart && rangeEnd && sameDay(rangeStart, weekend.start) && sameDay(rangeEnd, weekend.end);
        const isWeek = rangeStart && rangeEnd && sameDay(rangeStart, today) && sameDay(rangeEnd, addDays(today, 6));
        document.getElementById('lpQToday').classList.toggle('lp-active', !!isToday);
        document.getElementById('lpQWeekend').classList.toggle('lp-active', !!isWeekend);
        document.getElementById('lpQWeek').classList.toggle('lp-active', !!isWeek);
    }

    function weekendRange() {
        const today = todayMidnight();
        const dow = today.getDay();
        const satOffset = (6 - dow + 7) % 7;
        const sat = addDays(today, satOffset);
        return { start: sat, end: addDays(sat, 1) };
    }

    function calShift(dir) {
        const next = calIndex + dir;
        if (next < 0 || next >= calMonths.length) return;
        calIndex = next;
        renderCalendar();
    }

    function openCalendar() {
        document.getElementById('lpCalendarPanel').classList.add('lp-open');
        calIndex = rangeStart ? monthIndexFor(rangeStart) : 0;
        renderCalendar();
        updateQuickState();
    }
    function closeCalendar() {
        document.getElementById('lpCalendarPanel').classList.remove('lp-open');
        cfg.onDateApply(rangeStart ? toISO(rangeStart) : null, rangeEnd ? toISO(rangeEnd) : (rangeStart ? toISO(rangeStart) : null));
    }

    function quickPick(kind) {
        const today = todayMidnight();
        if (kind === 'today') { rangeStart = today; rangeEnd = null; }
        else if (kind === 'weekend') { const w = weekendRange(); rangeStart = w.start; rangeEnd = w.end; }
        else if (kind === 'week') { rangeStart = today; rangeEnd = addDays(today, 6); }
        calIndex = monthIndexFor(rangeStart);
        afterDateChange();
    }

    function resetDates() {
        rangeStart = null;
        rangeEnd = null;
        calIndex = 0;
        afterDateChange();
    }

    /* ---------------- Init ---------------- */

    function init(config) {
        cfg = config;
        buildCalMonths();
        renderCityList();
        setInitialLocation(config.initialLevelId);
        renderMoodList();
        renderLangLevelLists();
        updateDateLabel();
        updateCalFooter();
        updateSearchBadge();
    }

    return {
        init,
        getState: () => state,
        filterSessions,
        setLocation,
        toggleCityDrop,
        selectCity,
        openMood,
        closeMood,
        resetMood,
        openLangLevel,
        closeLangLevel,
        resetLangLevel,
        resetAllFilters,
        toggleQuickCategory,
        toggleDtSeg,
        toggleSearchExpand,
        openCalendar,
        closeCalendar,
        resetDates,
        quickPick,
        calShift,
    };
})();

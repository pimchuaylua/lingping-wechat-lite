/**
 * filter-bar.js
 * Location tabs + city dropdown, a "What do you feel like doing?" (category)
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
        document.getElementById('lpCityWrap').classList.toggle('lp-show', which === 'person');
        if (which !== 'person') closeCityDrop();

        if (which === 'online') {
            cfg.onLocationChange(cfg.onlineLevelId);
        } else {
            const active = document.querySelector('.lp-citydrop-item--active');
            const city = cfg.cities.find(c => c.name === active?.dataset?.name) || cfg.cities[0];
            if (city) cfg.onLocationChange(city.levelId);
        }
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
        cfg.onLocationChange(city.levelId);
    }

    function renderCityList() {
        const panel = document.getElementById('lpCityListPanel');
        if (!panel) return;
        let html = '';
        let lastCountry = null;
        cfg.cities.forEach(city => {
            if (city.country && city.country !== lastCountry) {
                html += `<div class="lp-citydrop-category">${city.country}</div>`;
                lastCountry = city.country;
            }
            html += `<div class="lp-citydrop-item" data-name="${city.name}" onclick="FilterBar.selectCity('${city.name}')">${city.name}</div>`;
        });
        panel.innerHTML = html;
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
            document.getElementById('lpCityWrap').classList.add('lp-show');
        } else {
            document.querySelector('.lp-citydrop-item')?.classList.add('lp-citydrop-item--active');
            document.getElementById('lpTabOnline').classList.add('lp-loc-tab--active');
            document.getElementById('lpTabPerson').classList.remove('lp-loc-tab--active');
        }
    }

    /* ---------------- Mood (category) page ---------------- */

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

    function renderMoodList() {
        renderCheckList(document.getElementById('lpMoodList'), cfg.eventOptions.categories, state.categories, {
            iconFor: v => CATEGORY_ICONS[v] || '',
            showDesc: false,
            onChange: () => { updateMoodLabel(); cfg.onFiltersChange(); }
        });
        updateMoodLabel();
    }

    function updateMoodLabel() {
        const btn = document.getElementById('lpMoodBtn');
        const label = document.getElementById('lpMoodLabel');
        const picked = (cfg.eventOptions.categories || []).filter(it => state.categories.has(it.value));
        if (!picked.length) {
            label.textContent = 'What do you feel like doing?';
            btn.classList.add('lp-placeholder');
            return;
        }
        btn.classList.remove('lp-placeholder');
        const text = `${CATEGORY_ICONS[picked[0].value] || ''} ${picked[0].label}`;
        label.textContent = picked.length === 1 ? text : `${text} +${picked.length - 1}`;
    }

    /* ---------------- Language & Level page ---------------- */

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
        renderCheckList(document.getElementById('lpLangList'), cfg.eventOptions.languages, state.languages, {
            iconFor: v => LANG_META[v]?.flag || '',
            showDesc: false,
            onChange: () => { updateLangLevelLabel(); cfg.onFiltersChange(); }
        });
        renderCheckList(document.getElementById('lpLevelList'), cfg.eventOptions.proficiencyLevels, state.levels, {
            iconFor: v => LEVEL_ICONS[v] || '',
            showDesc: true,
            onChange: () => { updateLangLevelLabel(); cfg.onFiltersChange(); }
        });
        updateLangLevelLabel();
    }

    function updateLangLevelLabel() {
        const btn = document.getElementById('lpLangLevelBtn');
        const label = document.getElementById('lpLangLevelLabel');
        const pickedLang = (cfg.eventOptions.languages || []).filter(it => state.languages.has(it.value));
        const pickedLvl = (cfg.eventOptions.proficiencyLevels || []).filter(it => state.levels.has(it.value));

        if (!pickedLang.length && !pickedLvl.length) {
            label.textContent = 'Which language?';
            btn.classList.add('lp-placeholder');
            return;
        }
        btn.classList.remove('lp-placeholder');

        const parts = [];
        if (pickedLang.length) {
            const t = `${LANG_META[pickedLang[0].value]?.flag || ''} ${pickedLang[0].label}`;
            parts.push(pickedLang.length === 1 ? t : `${t} +${pickedLang.length - 1}`);
        }
        if (pickedLvl.length) {
            parts.push(pickedLvl.length === 1 ? pickedLvl[0].label : `${pickedLvl[0].label} +${pickedLvl.length - 1}`);
        }
        label.textContent = parts.join(' · ');
    }

    /* ---------------- Shared checkbox-list renderer ---------------- */

    /** Renders a multi-select checkbox list into `container`. Row tap toggles
     * membership in `selectedSet`; when `showDesc` is true, an (i) button
     * toggles the description open/closed without affecting selection. */
    function renderCheckList(container, items, selectedSet, { iconFor, showDesc, onChange }) {
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
                renderCheckList(container, items, selectedSet, { iconFor, showDesc, onChange });
                if (onChange) onChange();
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
        const label = document.getElementById('lpDateLabel');
        if (!rangeStart) {
            label.textContent = 'Anytime';
        } else if (!rangeEnd) {
            label.textContent = Utils.formatDate(rangeStart);
        } else {
            label.textContent = `${Utils.formatDate(rangeStart)} – ${Utils.formatDate(rangeEnd)}`;
        }
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
        openCalendar,
        closeCalendar,
        resetDates,
        quickPick,
        calShift,
    };
})();

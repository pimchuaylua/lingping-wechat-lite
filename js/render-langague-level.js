// Formats an optional reading-session `cost` field into a display-ready
// pill/label. Returns null when `cost` is absent — callers should render
// no cost UI at all in that case (event is fully covered by membership).
function formatEventCost(cost) {
    if (!cost) return null;

    const amountLabel = cost.amountType === 'fixed'
        ? `${cost.amount} ${cost.currency}`
        : `${cost.amountMin}–${cost.amountMax} ${cost.currency}`;

    const tt = window.t || (key => key);
    const pillByMode = {
        payOnSpot: { label: tt('costPillPayOnSpot').replace('{amount}', amountLabel), style: 'outline' },
        prepayRequired: { label: tt('costPillPrepayRequired').replace('{amount}', amountLabel), style: 'solid' },
        prepayOptional: { label: tt('costPillPrepayOptional').replace('{amount}', amountLabel), style: 'outline' },
    };

    const pill = pillByMode[cost.paymentMode] || { label: amountLabel, style: 'outline' };

    return {
        amountLabel,
        label: pill.label,
        style: pill.style,
        paymentMode: cost.paymentMode,
        currency: cost.currency,
        prepayInstructions: cost.prepayInstructions || null,
    };
}

const CATEGORY_META = {
    discussion: { label: '💬 Discussion' },
    language: { label: '🗣️ Language' },
    sports: { label: '⚽ Sports' },
    explore_the_city: { label: '🏙️ Explore the city' },
    culture: { label: '🎎 Culture' },
    food: { label: '🍜 Food' },
    movie: { label: '🎬 Movie' },
    book: { label: '📚 Book club' },
    music: { label: '🎵 Music' },
    arts: { label: '🎨 Arts' },
    social: { label: '❤️ Social' },
};

const LANG_META = {
    en: { label: 'English', flag: '🇬🇧' },
    th: { label: 'Thai', flag: '🇹🇭' },
    zh: { label: 'Chinese', flag: '🇨🇳' },
    yue: { label: 'Cantonese', flag: '🇭🇰' },
    ja: { label: 'Japanese', flag: '🇯🇵' },
    es: { label: 'Spanish', flag: '🇪🇸' },
    fr: { label: 'French', flag: '🇫🇷' },
    ru: { label: 'Russian', flag: '🇷🇺' },
    it: { label: 'Italian', flag: '🇮🇹' },
    de: { label: 'German', flag: '🇩🇪' },
};

const LEVEL_META = {
    beginner: { label: 'Beginner', bg: '#e3f0e1', color: '#356b2c' },
    upper_beginner: { label: 'Upper Beginner', bg: '#dcecf5', color: '#1c5c86' },
    intermediate: { label: 'Intermediate', bg: '#fbe8cf', color: '#8a520a' },
    advanced: { label: 'Advanced-Native', bg: '#f3ddec', color: '#8a2670' },
};

const LEVEL_LABELS = {
    beginner: 'Beginner',
    upper_beginner: 'Upper Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced-Native',
};

function renderChips(items) {
    return items.map(({ label, bg, color }) =>
        `<span class="chip" style="background:${bg};color:${color};">${label}</span>`
    ).join('');
}

// fetched once, e.g. from /categories and /proficiency-levels, or embedded in config
let categoryOptions = [];   // [{ value, label, description }, ...]
let levelOptions = [];      // [{ value, label, description }, ...]

function findMeta(list, value) {
    return (list || []).find(item => item.value === value);
}

// Looks up a hand-translated label by the stable code first (works
// whether the fallback label came from our own LANG_META/LEVEL_META or
// the live options API), falling back to whatever was already resolved.
function translatedLangLabel(code, fallbackLabel) {
    const key = `lang_${code}`;
    return (window.t && TRANSLATIONS[key]) ? t(key) : fallbackLabel;
}
function translatedLevelLabel(code, fallbackLabel) {
    const key = `level_${code}`;
    return (window.t && TRANSLATIONS[key]) ? t(key) : fallbackLabel;
}
function translatedCategoryLabel(code, fallbackLabel) {
    const key = `cat_${code}`;
    return (window.t && TRANSLATIONS[key]) ? t(key) : fallbackLabel;
}

async function loadSessionOptions() {
    const res = await fetch(`${BASE_URL}/reading-sessions/options`, {
        headers: {
            "Content-Type": "application/json",
            "X-API-KEY": API_KEY
        }
    });
    const json = await res.json();
    return json.data;
}

function renderLanguageChipsForEventDetails(languages = [], options) {

    if (!languages || !languages.length) {
        return `
      <div class="lang-level-row">
        <span class="level-desc">All Lingping members who want to hang out, connect, and catch up. You can speak any language you’re comfortable with.</span>
      </div>
    `;
    }

    if (!options) return '';

    const groups = groupLanguageLevels(languages);

    // One description per distinct level across all languages, in level order.
    const levelsUsed = LEVEL_ORDER.filter(lvl => groups.some(g => g.levels.includes(lvl)));
    const descriptions = levelsUsed.map(lvl => {
        const meta = findMeta(options.proficiencyLevels, lvl);
        if (!meta?.description) return '';
        return `<div class="level-desc-row"><strong>${translatedLevelLabel(lvl, meta.label || lvl)}:</strong> ${meta.description}</div>`;
    }).join('');

    return `
      <div class="lang-chip-row">${groups.map(g => langLevelChipHtml(g, options)).join('')}</div>
      ${descriptions ? `<div class="level-desc-list">${descriptions}</div>` : ''}
    `;
}

function renderFormatChips(categories = [], options) {
    if (!categories || !categories.length || !options) return '';

    return categories.map(cat => {
        const meta = findMeta(options.categories, cat);
        const label = meta?.label || cat;
        const desc = meta?.description || '';

        return `
      <div class="lang-level-row">
        <div class="chip-row">
          <span class="chip chip-format">${CATEGORY_ICONS[cat] || ''} ${label}</span>
        </div>
        ${desc ? `<span class="level-desc">${desc}</span>` : ''}
      </div>
    `;
    }).join('');
}

// Not copy — just chip color-coding by difficulty, and emoji since your API objects don't include one
const LEVEL_COLORS = {
    beginner: { bg: '#e3f0e1', color: '#356b2c' },
    upper_beginner: { bg: '#dcecf5', color: '#1c5c86' },
    intermediate: { bg: '#fbe8cf', color: '#8a520a' },
    advanced: { bg: '#f3ddec', color: '#8a2670' },
};

const CATEGORY_ICONS = {
    discussion: '💬', language: '🗣️', sports: '⚽',
    explore_the_city: '🏙️', culture: '🎎', food: '🍜',
    movie: '🎬', book: '📚', music: '🎵', arts: '🎨',
    social: '❤️',
};

/* ---------------- Language + level chips ----------------
 * One chip per language containing its own levels:
 *   [🇬🇧 English ▁▂▃▄ Int – Native]
 * Sessions store `languages` as flat pairs — [{ language, proficiencyLevel }]
 * (one entry per language/level combo) — so grouping by language gives the
 * pairing. groupLanguageLevels() also accepts the grouped shape
 * [{ code, levels: [...] }] so the renderer keeps working if the API changes.
 */
const LEVEL_ORDER = ['beginner', 'upper_beginner', 'intermediate', 'advanced'];
const LEVEL_BAR_COLORS = {
    beginner: '#2e9e48',
    upper_beginner: '#a3b51c',
    intermediate: '#ec8a1a',
    advanced: '#d93a2b',
};
const LEVEL_SHORT_FALLBACK = {
    beginner: 'Beg',
    upper_beginner: 'Upper Beg',
    intermediate: 'Int',
    advanced: 'Native',
};

function chipText(key, fallback) {
    return (window.t && typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[key]) ? t(key) : fallback;
}

/** → [{ code, levels: [ordered level codes] }] in first-seen language order. */
function groupLanguageLevels(languages = []) {
    const groups = new Map();
    (languages || []).forEach(entry => {
        if (!entry) return;
        const code = entry.code || entry.language;
        if (!code) return;
        if (!groups.has(code)) groups.set(code, new Set());
        const levels = Array.isArray(entry.levels) ? entry.levels : [entry.proficiencyLevel];
        levels.filter(Boolean).forEach(lvl => groups.get(code).add(lvl));
    });
    return [...groups].map(([code, set]) => ({
        code,
        levels: LEVEL_ORDER.filter(lvl => set.has(lvl)).concat([...set].filter(lvl => !LEVEL_ORDER.includes(lvl)))
    }));
}

function levelShortLabel(lvl) {
    return chipText(`levelShort_${lvl}`, LEVEL_SHORT_FALLBACK[lvl] || lvl);
}

/** "All levels" | "Int – Native" (contiguous) | "Intermediate" (single) | "Beg, Native" */
function levelRangeLabel(levels, options) {
    const known = levels.filter(lvl => LEVEL_ORDER.includes(lvl));
    if (!known.length) return '';
    if (known.length === LEVEL_ORDER.length) return chipText('allLevels', 'All levels');
    if (known.length === 1) {
        const meta = findMeta(options?.proficiencyLevels, known[0]);
        return translatedLevelLabel(known[0], meta?.label || LEVEL_LABELS[known[0]] || known[0]);
    }
    const idx = known.map(lvl => LEVEL_ORDER.indexOf(lvl));
    const contiguous = idx.every((v, i) => i === 0 || v === idx[i - 1] + 1);
    return contiguous
        ? `${levelShortLabel(known[0])} – ${levelShortLabel(known[known.length - 1])}`
        : known.map(levelShortLabel).join(', ');
}

function levelBarHtml(levels, options) {
    const covered = new Set(levels);
    const known = LEVEL_ORDER.filter(lvl => covered.has(lvl));
    if (!known.length) return '';
    const fullName = lvl => translatedLevelLabel(lvl, findMeta(options?.proficiencyLevels, lvl)?.label || LEVEL_LABELS[lvl] || lvl);
    const idx = known.map(lvl => LEVEL_ORDER.indexOf(lvl));
    const contiguous = idx.every((v, i) => i === 0 || v === idx[i - 1] + 1);
    const desc = known.length === LEVEL_ORDER.length
        ? chipText('allLevels', 'All levels')
        : known.length > 1 && contiguous
            ? `${fullName(known[0])} ${chipText('levelTo', 'to')} ${fullName(known[known.length - 1])}`
            : known.map(fullName).join(', ');
    const aria = `${chipText('levelsAria', 'Levels')}: ${desc}`;

    const segments = LEVEL_ORDER.map((lvl, i) => {
        const color = covered.has(lvl) ? LEVEL_BAR_COLORS[lvl] : '#dddddd';
        return `<span class="level-bar-seg" style="height:${6 + i * 3}px;background:${color};"></span>`;
    }).join('');
    return `<span class="level-bar" role="img" aria-label="${aria.replace(/"/g, '&quot;')}">${segments}</span>`;
}

function langLevelChipHtml(group, options) {
    const meta = LANG_META[group.code] || { label: group.code, flag: '' };
    const apiLabel = findMeta(options?.languages, group.code)?.label;
    const langLabel = translatedLangLabel(group.code, apiLabel || meta.label);
    const rangeLabel = levelRangeLabel(group.levels, options);
    return `<span class="lang-level-chip">
        ${meta.flag ? `<span class="lang-level-flag">${meta.flag}</span>` : ''}
        <span class="lang-level-name">${langLabel}</span>
        ${levelBarHtml(group.levels, options)}
        ${rangeLabel ? `<span class="lang-level-label">${rangeLabel}</span>` : ''}
    </span>`;
}

function renderLanguageChips(languages = [], options) {
    if (!languages || !languages.length) return '';
    const chips = groupLanguageLevels(languages).map(g => langLevelChipHtml(g, options)).join('');
    return `<div class="event-row"><div class="lang-chip-row">${chips}</div></div>`;
}

const CATEGORY_META = {
    discussion: { label: '💬 Discussion' },
    language: { label: '🗣️ Language' },
    sports: { label: '⚽ Sports' },
    explore_the_city: { label: '🏙️ Explore the city' },
    culture: { label: '🎎 Culture' },
    food: { label: '🍜 Food' },
    movie: { label: '🎬 Movie' },
    book: { label: '📚 Book club' },
};

const LANG_META = {
    en: { label: 'English', flag: '🇬🇧' },
    th: { label: 'Thai', flag: '🇹🇭' },
    zh: { label: 'Chinese', flag: '🇨🇳' },
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

    if (!languages.length) {
        return `
      <div class="lang-level-row">
        <span class="level-desc">All Lingping members who want to hang out, connect, and catch up. You can speak any language you’re comfortable with.</span>
      </div>
    `;
    }

    if (!options) return '';

    return languages.map(({ language, proficiencyLevel }) => {
        const lang = findMeta(options.languages, language);
        const level = findMeta(options.proficiencyLevels, proficiencyLevel);
        const langLabel = lang?.label || language;
        const levelLabel = level?.label || proficiencyLevel;
        const levelDesc = level?.description || '';
        const colors = LEVEL_COLORS[proficiencyLevel] || { bg: '#eef0e4', color: '#4d5c2a' };

        return `
      <div class="lang-level-row">
        <div class="chip-row">
          <span class="chip chip-lang">${LANG_META[language]['flag'] || ''} ${langLabel}</span>
          <span class="chip" style="background:${colors.bg};color:${colors.color};">${levelLabel}</span>
        </div>
        ${levelDesc ? `<span class="level-desc">${levelDesc}</span>` : ''}
      </div>
    `;
    }).join('');
}

function renderFormatChips(categories = [], options) {
    if (!categories.length || !options) return '';

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
    movie: '🎬', book: '📚',
};

function renderLanguageChips(languages = []) {
    if (!languages.length) return '';

    const langChips = [...new Set(languages.map(l => l.language))]
        .map(code => {
            const meta = LANG_META[code] || { label: code, flag: '' };
            return `<span class="chip chip-lang">${meta.flag} ${meta.label}</span>`;
        }).join('');

    const levelChips = [...new Set(languages.map(l => l.proficiencyLevel))]
        .map(lvl => {
            const meta = LEVEL_META[lvl] || { label: lvl, bg: '#eef0e4', color: '#4d5c2a' };
            return `<span class="chip" style="background:${meta.bg};color:${meta.color};">${meta.label}</span>`;
        }).join('');

    return `<div class="event-row"><div class="chip-row">${langChips}${levelChips}</div></div>`;
}


/**
 * translate.js
 * Detects Chinese vs. English from the visitor's browser/phone language,
 * remembers the choice (or an explicit override) in localStorage, and
 * applies our own hand-picked translations (see translations.js) to the
 * page. No external translation service is used — Google's servers are
 * blocked in mainland China, so relying on the Google Translate widget
 * would silently fail to translate anything for visitors there.
 */

(function () {
    const LANG_KEY = 'lp_lang';

    /** Raw browser/phone locale → 'zh', 'th', or 'en', ignoring any stored
     * override. Used both for the initial default and to figure out which
     * "other" language this visitor's toggle should offer. */
    function rawDetect() {
        const nav = (navigator.language || navigator.userLanguage || '').toLowerCase();
        if (nav.startsWith('zh')) return 'zh';
        if (nav.startsWith('th')) return 'th';
        return 'en';
    }

    function detectLang() {
        const stored = localStorage.getItem(LANG_KEY);
        if (stored === 'en' || stored === 'zh' || stored === 'th') return stored;
        const detected = rawDetect();
        localStorage.setItem(LANG_KEY, detected);
        return detected;
    }

    /** Read-only, side-effect-free language check for other scripts
     * (event-card.js, filter-bar.js, translations.js's own t()). Safe to
     * call before this module's init() has run. */
    window.getSiteLanguage = function () {
        const stored = localStorage.getItem(LANG_KEY);
        if (stored === 'en' || stored === 'zh' || stored === 'th') return stored;
        return rawDetect();
    };

    window.setSiteLanguage = function (lang) {
        localStorage.setItem(LANG_KEY, lang);
        location.reload();
    };

    /** Applies translations to every element with a data-i18n attribute
     * (sets textContent), data-i18n-html (sets innerHTML — only for
     * dictionary entries that intentionally contain markup like <br>/<b>),
     * data-i18n-placeholder (sets the placeholder attribute), or
     * data-i18n-label (sets the label attribute — needed for <optgroup>,
     * whose visible text is an attribute, not content) under `root`
     * (defaults to the whole document). Static markup gets translated
     * this way; JS-generated strings should call t('key') directly
     * instead. */
    function applyTranslations(root) {
        if (typeof t !== 'function') return; // translations.js not loaded on this page
        (root || document).querySelectorAll('[data-i18n]').forEach(el => {
            el.textContent = t(el.getAttribute('data-i18n'));
        });
        (root || document).querySelectorAll('[data-i18n-html]').forEach(el => {
            el.innerHTML = t(el.getAttribute('data-i18n-html'));
        });
        (root || document).querySelectorAll('[data-i18n-label]').forEach(el => {
            el.label = t(el.getAttribute('data-i18n-label'));
        });
        (root || document).querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
        });
    }
    window.applyTranslations = applyTranslations;

    /* ---------------- Language picker (English / 中文 / ภาษาไทย) ---------------- */

    // Flags match the ones already used for language chips elsewhere in the
    // app (LANG_META in render-langague-level.js).
    const LANG_OPTIONS = [
        { code: 'en', label: '🇬🇧 English' },
        { code: 'zh', label: '🇨🇳 中文' },
        { code: 'th', label: '🇹🇭 ภาษาไทย' }
    ];

    // Short, flag-free labels for the segmented control in the menu — the
    // flagged LANG_OPTIONS above stays as-is for mountFloating()'s pill.
    const LANG_SEGMENT_LABELS = { en: 'EN', zh: '中文', th: 'ไทย' };

    function mountInMenu(menu, currentLang) {
        const divider = document.createElement('div');
        divider.className = 'menu-divider';
        menu.appendChild(divider);

        const switcher = document.createElement('div');
        switcher.className = 'lang-switcher';
        switcher.setAttribute('role', 'group');

        LANG_OPTIONS.forEach(({ code }) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'lang-switch-btn' + (code === currentLang ? ' active' : '');
            btn.textContent = LANG_SEGMENT_LABELS[code];
            btn.setAttribute('aria-pressed', String(code === currentLang));
            btn.onclick = () => {
                if (code !== currentLang) window.setSiteLanguage(code);
            };
            switcher.appendChild(btn);
        });

        menu.appendChild(switcher);
    }

    function mountFloating(currentLang) {
        // No header/menu on this page — a single pill that cycles through
        // all three languages on each tap.
        const btn = document.createElement('button');
        btn.type = 'button';
        const current = LANG_OPTIONS.find(o => o.code === currentLang) || LANG_OPTIONS[0];
        btn.textContent = current.label;
        // Sits bottom-right; pages with a fixed bottom action bar (e.g.
        // event-detail.html's Attend/Cancel bar) get extra clearance above
        // it instead of overlapping.
        const bookBar = document.querySelector('.book-bar');
        const bottomOffset = bookBar ? bookBar.offsetHeight + 12 : 16;
        btn.style.cssText = `
            position:fixed; right:12px; bottom:${bottomOffset}px; z-index:9999;
            background:var(--theme, #FFB050); color:#fff; border:none;
            border-radius:999px; padding:8px 14px; font-size:12px; font-weight:600;
            box-shadow:0 4px 14px rgba(0,0,0,0.18); cursor:pointer; font-family:inherit;
        `;
        btn.onclick = () => {
            const idx = LANG_OPTIONS.findIndex(o => o.code === currentLang);
            const next = LANG_OPTIONS[(idx + 1) % LANG_OPTIONS.length];
            window.setSiteLanguage(next.code);
        };
        document.body.appendChild(btn);
    }

    /** header.html is fetched async by dropdown.js, so its strings can't
     * be translated until it actually lands in the DOM. Waits for
     * #moreMenu to appear (with a timeout fallback for pages whose header
     * never loads, e.g. a dangling empty #header div), translates the
     * whole #header subtree, and mounts the picker into the menu — or as
     * a floating pill if no header shows up at all. */
    function mountToggle(currentLang) {
        const existing = document.getElementById('moreMenu');
        if (existing) {
            applyTranslations(document.getElementById('header') || existing);
            mountInMenu(existing, currentLang);
            return;
        }

        let settled = false;
        const observer = new MutationObserver(() => {
            const menu = document.getElementById('moreMenu');
            if (menu && !settled) {
                settled = true;
                observer.disconnect();
                applyTranslations(document.getElementById('header') || menu);
                mountInMenu(menu, currentLang);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });

        setTimeout(() => {
            if (settled) return;
            settled = true;
            observer.disconnect();
            mountFloating(currentLang);
        }, 2000);
    }

    /* ---------------- Init ---------------- */

    function init() {
        const lang = detectLang();
        applyTranslations();
        mountToggle(lang);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

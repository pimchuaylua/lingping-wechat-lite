/**
 * language-picker.js
 * Member languages: what they're learning (Beginner / Upper Beginner /
 * Intermediate / Advanced, same levels as index.html) and fluent in (Fluent / Native).
 *
 *   LanguagePicker.create(el, { options, initial, onChange })  → { isValid, getPayload, hint }
 *   LanguagesBlock.mount(el, { userId, languages, isOwn })     → profile "Languages" block
 *   LanguagesSummary.mount(el, { userId, languages })          → one-line row + "Change" (edit form)
 *   LanguageOnboarding.maybeShow({ userId })                   → Promise, resolves when done/skipped
 *   openEditLanguages({ userId, languages, onSaved, trigger })
 *
 * Backend:
 *   GET   /reading-sessions/options                → languages [{ value, label }], proficiencyLevels
 *   GET   /users/:id/profile                       → languages [{ code, role, level }]
 *   PATCH /users/:id/profile/languages?userId=:id  { languages } → { languages, onboardedAt }
 *         role: learning | fluent
 *         level: beginner | upper | intermediate | advanced (learning), fluent | native (fluent)
 */
(function () {
    const BASE_CODES = ["en", "th", "zh", "ja"];
    const ROLES = ["learning", "fluent"];
    const LEVELS = { learning: ["beginner", "upper", "intermediate", "advanced"], fluent: ["fluent", "native"] };
    // Learning levels use the same labels/descriptions as the event level filter on index.html.
    const LEVEL_OPTION_KEY = { beginner: "beginner", upper: "upper_beginner", intermediate: "intermediate", advanced: "advanced" };
    const ONBOARDED_KEY = id => `lpLanguagesOnboarded:${id}`;

    const TEXT = {
        en: {
            learningTitle: "I'm learning", fluentTitle: "I'm fluent in",
            helper: "Pick one or more, then your level", helperEmpty: "Pick one or more",
            more: "More", pickLevel: "Pick a level",
            levelFluent: "Fluent", levelNative: "Native",
            levelBeginner: "Beginner", levelUpper: "Upper Beginner",
            levelIntermediate: "Intermediate", levelAdvanced: "Advanced",
            levelsInfo: "About the levels", levelsInfoAria: "What do the levels mean?",
            levelsLearningTitle: "Learning levels", levelsFluentTitle: "Fluent levels",
            descFluent: "You can talk comfortably about most topics, even if it isn't your first language.",
            descNative: "It's your first language, or you grew up speaking it.",
            gotIt: "Got it",
            tagFluent: "fluent", tagLearning: "learning",
            sheetHelpLearning: "Pick all the languages you're learning",
            sheetHelpFluent: "Pick all the languages you're fluent in",
            inOtherLearning: 'In "learning"', inOtherFluent: 'In "fluent in"',
            done: "Done", selected: "selected", close: "Close",
            needOne: "Pick at least one language to continue", needLevel: "Pick a level for each language",
            canChange: "You can change this anytime in your profile.",
            welcome: "Welcome to Lingping", title: "Tell us about your languages",
            subtitle: "We'll use this to show you events at the right level and help you meet members to practise with.",
            continue: "Continue", skip: "Skip for now", saving: "Saving…",
            editTitle: "Edit languages", cancel: "Cancel", save: "Save",
            languages: "Languages", edit: "Edit", editAria: "Edit languages",
            speaks: "Speaks", learning: "Learning",
            emptyOwn: "Add the languages you speak and are learning, so members know how to practise with you.",
            addLanguages: "Add languages", change: "Change", none: "No languages added yet",
            errInvalid: "Something's off with your languages. Please check and try again.",
            errNetwork: "Couldn't save. Check your connection and try again.",
            errLogin: "Please log in again to save your languages.",
            errOptions: "Couldn't load languages. Please refresh and try again.",
            levelAria: "level"
        },
        zh: {
            learningTitle: "我正在学", fluentTitle: "我能流利使用",
            helper: "选择一种或多种，然后选择水平", helperEmpty: "选择一种或多种",
            more: "更多", pickLevel: "请选择水平",
            levelFluent: "流利", levelNative: "母语",
            levelBeginner: "初级", levelUpper: "中初级",
            levelIntermediate: "中级", levelAdvanced: "高级",
            levelsInfo: "关于水平", levelsInfoAria: "各个水平是什么意思？",
            levelsLearningTitle: "学习水平", levelsFluentTitle: "流利程度",
            descFluent: "你能自如地谈论大多数话题，即使这不是你的母语。",
            descNative: "这是你的母语，或你从小就说这种语言。",
            gotIt: "知道了",
            tagFluent: "流利", tagLearning: "在学",
            sheetHelpLearning: "选择你正在学习的所有语言",
            sheetHelpFluent: "选择你能流利使用的所有语言",
            inOtherLearning: "在“在学”中", inOtherFluent: "在“流利”中",
            done: "完成", selected: "已选", close: "关闭",
            needOne: "请至少选择一种语言", needLevel: "请为每种语言选择水平",
            canChange: "你可以随时在个人资料中修改。",
            welcome: "欢迎来到 Lingping", title: "告诉我们你的语言",
            subtitle: "我们会据此为你推荐合适水平的活动，并帮你找到一起练习的伙伴。",
            continue: "继续", skip: "暂时跳过", saving: "保存中…",
            editTitle: "编辑语言", cancel: "取消", save: "保存",
            languages: "语言", edit: "编辑", editAria: "编辑语言",
            speaks: "会说", learning: "在学",
            emptyOwn: "添加你会说和正在学的语言，让大家知道如何和你一起练习。",
            addLanguages: "添加语言", change: "修改", none: "还没有添加语言",
            errInvalid: "语言信息有误，请检查后重试。",
            errNetwork: "保存失败，请检查网络后重试。",
            errLogin: "请重新登录后再保存语言。",
            errOptions: "无法加载语言列表，请刷新重试。",
            levelAria: "水平"
        },
        th: {
            learningTitle: "ฉันกำลังเรียน", fluentTitle: "ฉันพูดได้คล่อง",
            helper: "เลือกได้หลายภาษา แล้วเลือกระดับ", helperEmpty: "เลือกได้หลายภาษา",
            more: "เพิ่มเติม", pickLevel: "เลือกระดับ",
            levelFluent: "คล่อง", levelNative: "เจ้าของภาษา",
            levelBeginner: "เริ่มต้น", levelUpper: "เริ่มต้น+",
            levelIntermediate: "กลาง", levelAdvanced: "สูง",
            levelsInfo: "เกี่ยวกับระดับ", levelsInfoAria: "แต่ละระดับหมายถึงอะไร?",
            levelsLearningTitle: "ระดับการเรียน", levelsFluentTitle: "ระดับความคล่อง",
            descFluent: "คุณพูดคุยเรื่องส่วนใหญ่ได้อย่างสบาย แม้จะไม่ใช่ภาษาแม่",
            descNative: "เป็นภาษาแม่ของคุณ หรือคุณพูดภาษานี้มาตั้งแต่เด็ก",
            gotIt: "เข้าใจแล้ว",
            tagFluent: "คล่อง", tagLearning: "กำลังเรียน",
            sheetHelpLearning: "เลือกทุกภาษาที่คุณกำลังเรียน",
            sheetHelpFluent: "เลือกทุกภาษาที่คุณพูดได้คล่อง",
            inOtherLearning: "อยู่ใน “กำลังเรียน”", inOtherFluent: "อยู่ใน “พูดได้คล่อง”",
            done: "เสร็จ", selected: "ที่เลือก", close: "ปิด",
            needOne: "เลือกอย่างน้อยหนึ่งภาษาเพื่อไปต่อ", needLevel: "เลือกระดับให้ทุกภาษา",
            canChange: "คุณเปลี่ยนได้ทุกเมื่อในโปรไฟล์",
            welcome: "ยินดีต้อนรับสู่ Lingping", title: "บอกเราเกี่ยวกับภาษาของคุณ",
            subtitle: "เราจะใช้ข้อมูลนี้เพื่อแนะนำกิจกรรมที่เหมาะกับระดับของคุณ และช่วยให้คุณเจอเพื่อนฝึกภาษา",
            continue: "ไปต่อ", skip: "ข้ามไปก่อน", saving: "กำลังบันทึก…",
            editTitle: "แก้ไขภาษา", cancel: "ยกเลิก", save: "บันทึก",
            languages: "ภาษา", edit: "แก้ไข", editAria: "แก้ไขภาษา",
            speaks: "พูดได้", learning: "กำลังเรียน",
            emptyOwn: "เพิ่มภาษาที่คุณพูดได้และกำลังเรียน เพื่อให้สมาชิกรู้ว่าจะฝึกกับคุณยังไง",
            addLanguages: "เพิ่มภาษา", change: "เปลี่ยน", none: "ยังไม่ได้เพิ่มภาษา",
            errInvalid: "ข้อมูลภาษาไม่ถูกต้อง กรุณาตรวจสอบแล้วลองใหม่",
            errNetwork: "บันทึกไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่",
            errLogin: "กรุณาเข้าสู่ระบบอีกครั้งเพื่อบันทึกภาษา",
            errOptions: "โหลดรายการภาษาไม่ได้ กรุณารีเฟรชแล้วลองใหม่",
            levelAria: "ระดับ"
        }
    };

    function L(key) {
        const lang = window.getSiteLanguage ? window.getSiteLanguage() : "en";
        return (TEXT[lang] && TEXT[lang][key]) || TEXT.en[key] || key;
    }

    const ICONS = {
        book: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>',
        chat: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>',
        check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        plus: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
        close: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
        info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="11"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
        pencil: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path></svg>'
    };

    function esc(str) {
        return String(str ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    }

    function cfg() {
        return window.CONFIG || {};
    }

    /* ---------------- API ---------------- */

    let optionsPromise = null;

    function loadOptions() {
        if (!optionsPromise) {
            optionsPromise = fetch(`${cfg().BASE_URL}/reading-sessions/options`, {
                headers: { "X-API-KEY": cfg().API_KEY }
            })
                .then(res => res.json())
                .then(json => {
                    const d = json?.data || {};
                    return { languages: d.languages || [], proficiencyLevels: d.proficiencyLevels || [] };
                })
                .catch(err => {
                    optionsPromise = null;
                    throw err;
                });
        }
        return optionsPromise;
    }

    async function fetchProfile(userId) {
        const res = await fetch(`${cfg().BASE_URL}/users/${encodeURIComponent(userId)}/profile?userId=${encodeURIComponent(userId)}`, {
            headers: { "X-API-KEY": cfg().API_KEY }
        });
        if (!res.ok) return null;
        const json = await res.json().catch(() => ({}));
        return json?.data || null;
    }

    function patchLanguages(userId, languages) {
        return fetch(`${cfg().BASE_URL}/users/${encodeURIComponent(userId)}/profile/languages?userId=${encodeURIComponent(userId)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", "X-API-KEY": cfg().API_KEY },
            body: JSON.stringify({ languages })
        });
    }

    // Brand-new members may not have a profile document yet; create a minimal one.
    async function createProfile(userId) {
        const res = await fetch(`${cfg().BASE_URL}/users/${encodeURIComponent(userId)}/profile`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-API-KEY": cfg().API_KEY },
            body: JSON.stringify({
                userId,
                displayName: localStorage.getItem("username") || " ",
                bio: " ",
                description: " ",
                funPrompts: [],
                topicsOfInterests: []
            })
        });
        return res.ok;
    }

    // Returns { ok, data } or { ok: false, message }.
    async function saveLanguages(userId, languages) {
        try {
            let res = await patchLanguages(userId, languages);
            let json = await res.json().catch(() => ({}));

            const code = json?.result?.error || json?.code;
            if (res.status === 404 && code === "PROFILE_NOT_FOUND" && await createProfile(userId)) {
                res = await patchLanguages(userId, languages);
                json = await res.json().catch(() => ({}));
            }

            if (res.ok && json?.status) {
                try { localStorage.setItem(ONBOARDED_KEY(userId), "1"); } catch (e) { }
                return { ok: true, data: json.data || { languages } };
            }

            console.error("Saving languages failed:", json);
            if (res.status === 401) return { ok: false, message: L("errLogin") };
            return { ok: false, message: L("errInvalid") };
        } catch (err) {
            console.error("Saving languages failed:", err);
            return { ok: false, message: L("errNetwork") };
        }
    }

    /* ---------------- Labels ---------------- */

    // zh/th text shared with the rest of the site (translations.js), when the page loads it.
    function siteText(key) {
        const lang = window.getSiteLanguage ? window.getSiteLanguage() : "en";
        if (lang === "en" || typeof TRANSLATIONS === "undefined" || !TRANSLATIONS[key]) return null;
        return TRANSLATIONS[key][lang] || null;
    }

    function langName(options, code) {
        return siteText(`lang_${code}`) || options?.languages?.find(l => l.value === code)?.label || code;
    }

    // Flag emoji per language code. Unknown codes just show no flag.
    const LANG_FLAG = {
        en: "🇬🇧", th: "🇹🇭", zh: "🇨🇳", ja: "🇯🇵", yue: "🇭🇰", es: "🇪🇸",
        fr: "🇫🇷", ru: "🇷🇺", it: "🇮🇹", de: "🇩🇪", ko: "🇰🇷", vi: "🇻🇳", pt: "🇵🇹"
    };

    function flagHtml(code) {
        const f = LANG_FLAG[code];
        return f ? `<span class="lpl-flag" aria-hidden="true">${f}</span>` : "";
    }

    function flagText(code) {
        return LANG_FLAG[code] ? `${LANG_FLAG[code]} ` : "";
    }

    const LEVEL_TEXT_KEY = {
        beginner: "levelBeginner", upper: "levelUpper", intermediate: "levelIntermediate",
        advanced: "levelAdvanced", fluent: "levelFluent", native: "levelNative"
    };

    function levelLabel(options, level) {
        const lang = window.getSiteLanguage ? window.getSiteLanguage() : "en";
        // English labels come from the options endpoint (as on index.html), except
        // "Advanced–Native", which reads oddly for a language you're learning.
        if (lang === "en" && LEVEL_OPTION_KEY[level] && level !== "advanced") {
            const fromOptions = options?.proficiencyLevels?.find(p => p.value === LEVEL_OPTION_KEY[level])?.label;
            if (fromOptions) return fromOptions;
        }
        return L(LEVEL_TEXT_KEY[level] || level);
    }

    function levelDescription(options, level) {
        if (level === "fluent") return L("descFluent");
        if (level === "native") return L("descNative");
        return siteText(`levelDesc_${LEVEL_OPTION_KEY[level]}`)
            || options?.proficiencyLevels?.find(p => p.value === LEVEL_OPTION_KEY[level])?.description || "";
    }

    // (i) → what each level means, for the card's role.
    function openLevelInfo(options, role, current) {
        const dlg = openDialog({ title: role === "learning" ? L("levelsLearningTitle") : L("levelsFluentTitle"), size: "auto" });
        dlg.body.innerHTML = `<dl class="lpl-info-list">${LEVELS[role].map(level => `
            <div class="lpl-info-item ${level === current ? "is-current" : ""}">
                <dt>${esc(levelLabel(options, level))}</dt>
                <dd>${esc(levelDescription(options, level))}</dd>
            </div>`).join("")}</dl>`;
        dlg.footer.innerHTML = `<button type="button" class="lpl-btn-dark" data-ok>${esc(L("gotIt"))}</button>`;
        dlg.footer.querySelector("[data-ok]").onclick = () => dlg.close();
        dlg.footer.querySelector("[data-ok]").focus();
    }

    function normalize(languages) {
        return (languages || [])
            .filter(l => l && l.code && ROLES.includes(l.role))
            .map(l => ({ code: l.code, role: l.role, level: LEVELS[l.role].includes(l.level) ? l.level : null }));
    }

    function sameList(a, b) {
        const key = l => `${l.code}|${l.role}|${l.level}`;
        if (a.length !== b.length) return false;
        const sa = a.map(key).sort().join(",");
        const sb = b.map(key).sort().join(",");
        return sa === sb;
    }

    /* ---------------- Dialogs (sheet on phone, centred on desktop) ---------------- */

    const dialogStack = [];

    function onDialogKeydown(e) {
        const top = dialogStack[dialogStack.length - 1];
        if (!top) return;
        if (e.key === "Escape") {
            e.preventDefault();
            top.close();
            return;
        }
        if (e.key !== "Tab") return;
        const focusables = [...top.panel.querySelectorAll("button:not([disabled]), a[href], input, [tabindex='0']")]
            .filter(el => el.offsetParent !== null);
        if (!focusables.length) return;
        const first = focusables[0], last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    // Returns { panel, body, footer, close }. `onClose` runs on × / backdrop / Esc / close().
    function openDialog({ title, size = "auto", onClose }) {
        const trigger = document.activeElement;
        const id = `lpLangDlg${Date.now()}${dialogStack.length}`;
        const overlay = document.createElement("div");
        overlay.className = "lpl-overlay";
        overlay.innerHTML = `
            <div class="lpl-dialog lpl-dialog-${size}" role="dialog" aria-modal="true" aria-labelledby="${id}">
                <div class="lpl-dialog-head">
                    <div class="lpl-dialog-title" id="${id}">${esc(title)}</div>
                    <button type="button" class="lpl-icon-btn" data-close aria-label="${esc(L("close"))}">${ICONS.close}</button>
                </div>
                <div class="lpl-dialog-body"></div>
                <div class="lpl-dialog-foot"></div>
            </div>`;
        document.body.appendChild(overlay);

        let closed = false;
        const api = {
            panel: overlay.querySelector(".lpl-dialog"),
            body: overlay.querySelector(".lpl-dialog-body"),
            footer: overlay.querySelector(".lpl-dialog-foot"),
            close() {
                if (closed) return;
                closed = true;
                overlay.remove();
                const i = dialogStack.indexOf(api);
                if (i >= 0) dialogStack.splice(i, 1);
                if (!dialogStack.length) {
                    document.removeEventListener("keydown", onDialogKeydown);
                    document.body.classList.remove("lpl-no-scroll");
                }
                if (trigger && typeof trigger.focus === "function" && document.body.contains(trigger)) trigger.focus();
                if (onClose) onClose();
            }
        };

        overlay.addEventListener("click", e => { if (e.target === overlay) api.close(); });
        overlay.querySelector("[data-close]").onclick = () => api.close();
        if (!dialogStack.length) {
            document.addEventListener("keydown", onDialogKeydown);
            document.body.classList.add("lpl-no-scroll");
        }
        dialogStack.push(api);
        return api;
    }

    /* ---------------- LanguagePicker ---------------- */

    function createPicker(root, { options, initial, onChange }) {
        let list = normalize(initial);

        const roleOf = code => list.find(l => l.code === code)?.role || null;
        const changed = () => { render(); if (onChange) onChange(); };

        function chipHtml(code, role) {
            const owner = roleOf(code);
            const name = esc(langName(options, code));
            if (owner === role) {
                return `<button type="button" class="lpl-chip is-picked" aria-pressed="true" data-chip="${esc(code)}" data-role="${role}">${ICONS.check}${flagHtml(code)}<span>${name}</span></button>`;
            }
            if (owner) {
                const tag = owner === "fluent" ? L("tagFluent") : L("tagLearning");
                return `<button type="button" class="lpl-chip is-other" disabled aria-pressed="false">${flagHtml(code)}<span>${name}</span><span class="lpl-chip-tag">· ${esc(tag)}</span></button>`;
            }
            return `<button type="button" class="lpl-chip" aria-pressed="false" data-chip="${esc(code)}" data-role="${role}">${flagHtml(code)}<span>${name}</span></button>`;
        }

        function levelRowHtml(item) {
            const name = esc(langName(options, item.code));
            const opts = LEVELS[item.role].map(level => {
                const on = item.level === level;
                return `<button type="button" class="lpl-seg-btn ${on ? "is-on" : ""}" aria-pressed="${on}" data-level="${level}" data-code="${esc(item.code)}">${esc(levelLabel(options, level))}</button>`;
            }).join("");
            return `
                <div class="lpl-level-row">
                    <div class="lpl-level-head">
                        <span class="lpl-level-name">${flagHtml(item.code)}${name}</span>
                        <span class="lpl-level-side">
                            ${item.level ? "" : `<span class="lpl-level-missing">${esc(L("pickLevel"))}</span>`}
                            <button type="button" class="lpl-info-btn" data-info="${item.role}" data-info-code="${esc(item.code)}" aria-label="${esc(L("levelsInfoAria"))}">${ICONS.info}</button>
                        </span>
                    </div>
                    <div class="lpl-seg lpl-seg-${LEVELS[item.role].length}" role="group" aria-label="${name} ${esc(L("levelAria"))}">${opts}</div>
                </div>`;
        }

        function cardHtml(role) {
            const picked = list.filter(l => l.role === role);
            // Languages picked from "More" show as chips too, after the base four.
            const extra = list.filter(l => !BASE_CODES.includes(l.code) && l.role === role).map(l => l.code);
            const codes = [...BASE_CODES, ...extra];
            const title = role === "learning" ? L("learningTitle") : L("fluentTitle");
            return `
                <section class="lpl-card" aria-label="${esc(title)}">
                    <div class="lpl-card-title">${role === "learning" ? `<span class="lpl-ic-book">${ICONS.book}</span>` : `<span class="lpl-ic-chat">${ICONS.chat}</span>`}<span>${esc(title)}</span></div>
                    <div class="lpl-card-help">${esc(picked.length ? L("helper") : L("helperEmpty"))}</div>
                    <div class="lpl-chips">
                        ${codes.map(c => chipHtml(c, role)).join("")}
                        <button type="button" class="lpl-chip lpl-chip-more" data-more="${role}">${ICONS.plus}<span>${esc(L("more"))}</span></button>
                    </div>
                    ${picked.map(levelRowHtml).join("")}
                </section>`;
        }

        function render() {
            root.innerHTML = `<div class="lpl-picker">${ROLES.map(cardHtml).join("")}</div>`;
        }

        function refocus(selector) {
            const el = root.querySelector(selector);
            if (el) el.focus();
        }

        root.addEventListener("click", e => {
            const chip = e.target.closest("[data-chip]");
            if (chip) {
                const code = chip.dataset.chip, role = chip.dataset.role;
                if (roleOf(code) === role) list = list.filter(l => l.code !== code);
                else if (!roleOf(code)) list.push({ code, role, level: null });
                changed();
                refocus(`[data-chip="${CSS.escape(code)}"][data-role="${role}"]`);
                return;
            }
            const seg = e.target.closest("[data-level]");
            if (seg) {
                const item = list.find(l => l.code === seg.dataset.code);
                if (item) item.level = seg.dataset.level;
                changed();
                refocus(`[data-code="${CSS.escape(seg.dataset.code)}"][data-level="${seg.dataset.level}"]`);
                return;
            }
            const info = e.target.closest("[data-info]");
            if (info) {
                openLevelInfo(options, info.dataset.info, list.find(l => l.code === info.dataset.infoCode)?.level);
                return;
            }
            const more = e.target.closest("[data-more]");
            if (more) openMoreSheet(more.dataset.more);
        });

        function openMoreSheet(role) {
            const ticks = new Set(list.filter(l => l.role === role).map(l => l.code));
            const dlg = openDialog({ title: role === "learning" ? L("learningTitle") : L("fluentTitle"), size: "tall" });

            function renderSheet() {
                const otherLabel = role === "learning" ? L("inOtherFluent") : L("inOtherLearning");
                dlg.body.innerHTML = `
                    <div class="lpl-sheet-help">${esc(role === "learning" ? L("sheetHelpLearning") : L("sheetHelpFluent"))}</div>
                    <div class="lpl-sheet-list">
                        ${options.languages.map(lang => {
                            const owner = roleOf(lang.value);
                            if (owner && owner !== role) {
                                return `<div class="lpl-sheet-row is-other"><span>${flagHtml(lang.value)}${esc(langName(options, lang.value))}</span><span class="lpl-sheet-other">${esc(otherLabel)}</span></div>`;
                            }
                            const on = ticks.has(lang.value);
                            return `<button type="button" class="lpl-sheet-row ${on ? "is-on" : ""}" role="checkbox" aria-checked="${on}" data-tick="${esc(lang.value)}">
                                        <span>${flagHtml(lang.value)}${esc(langName(options, lang.value))}</span><span class="lpl-box" aria-hidden="true">${on ? ICONS.check : ""}</span>
                                    </button>`;
                        }).join("")}
                    </div>`;
                dlg.footer.innerHTML = `<button type="button" class="lpl-btn-dark" data-done>${esc(L("done"))} · ${ticks.size} ${esc(L("selected"))}</button>`;
                dlg.footer.querySelector("[data-done]").onclick = apply;
            }

            function apply() {
                // Keep existing picks (and their levels) in order, drop unticked, append new ones.
                list = list.filter(l => l.role !== role || ticks.has(l.code));
                ticks.forEach(code => {
                    if (!list.some(l => l.code === code)) list.push({ code, role, level: null });
                });
                dlg.close();
                changed();
            }

            dlg.body.addEventListener("click", e => {
                const row = e.target.closest("[data-tick]");
                if (!row) return;
                const code = row.dataset.tick;
                if (ticks.has(code)) ticks.delete(code); else ticks.add(code);
                renderSheet();
                dlg.body.querySelector(`[data-tick="${CSS.escape(code)}"]`)?.focus();
            });

            renderSheet();
            (dlg.body.querySelector("[data-tick]") || dlg.panel.querySelector("[data-close]")).focus();
        }

        render();

        return {
            isValid: () => list.length > 0 && list.every(l => l.level),
            hint: () => !list.length ? L("needOne") : list.some(l => !l.level) ? L("needLevel") : "",
            getPayload: () => list.map(l => ({ code: l.code, role: l.role, level: l.level })),
            getList: () => list.slice()
        };
    }

    /* ---------------- Edit pop-up ---------------- */

    async function openEditLanguages({ userId, languages, onSaved }) {
        let options;
        try {
            options = await loadOptions();
        } catch (err) {
            alert(L("errOptions"));
            return;
        }

        const original = normalize(languages);
        const dlg = openDialog({ title: L("editTitle"), size: "edit" });
        const pickerEl = document.createElement("div");
        dlg.body.appendChild(pickerEl);
        dlg.body.classList.add("lpl-grey");

        dlg.footer.innerHTML = `
            <div class="lpl-error" role="alert" hidden></div>
            <div class="lpl-hint"></div>
            <div class="lpl-foot-row">
                <button type="button" class="lpl-btn-outline" data-cancel>${esc(L("cancel"))}</button>
                <button type="button" class="lpl-btn-dark" data-save>${esc(L("save"))}</button>
            </div>`;
        const saveBtn = dlg.footer.querySelector("[data-save]");
        const errorEl = dlg.footer.querySelector(".lpl-error");
        const hintEl = dlg.footer.querySelector(".lpl-hint");

        const update = () => {
            const valid = picker.isValid();
            const dirty = !sameList(picker.getPayload(), original);
            saveBtn.disabled = !valid || !dirty;
            hintEl.textContent = valid ? "" : picker.hint();
            hintEl.hidden = valid;
        };
        const picker = createPicker(pickerEl, { options, initial: original, onChange: update });
        update();

        dlg.footer.querySelector("[data-cancel]").onclick = () => dlg.close();
        saveBtn.onclick = async () => {
            if (saveBtn.disabled) return;
            saveBtn.disabled = true;
            saveBtn.textContent = L("saving");
            errorEl.hidden = true;
            const result = await saveLanguages(userId, picker.getPayload());
            saveBtn.textContent = L("save");
            if (result.ok) {
                dlg.close();
                if (onSaved) onSaved(normalize(result.data.languages || picker.getPayload()), options);
            } else {
                errorEl.textContent = result.message;
                errorEl.hidden = false;
                update();
            }
        };

        (pickerEl.querySelector(".lpl-chip") || saveBtn).focus();
    }

    /* ---------------- Profile block ---------------- */

    function chipsHtml(items, role, options) {
        return `<ul class="lpl-tags lpl-tags-${role}">${items.map(l =>
            `<li>${flagHtml(l.code)}${esc(langName(options, l.code))}${l.level ? ` · ${esc(levelLabel(options, l.level))}` : ""}</li>`).join("")}</ul>`;
    }

    const LanguagesBlock = {
        async mount(el, { userId, languages, isOwn }) {
            let current = normalize(languages);
            let options = { languages: [], proficiencyLevels: [] };
            try { options = await loadOptions(); } catch (err) { console.error(err); }

            const render = () => {
                const fluent = current.filter(l => l.role === "fluent");
                const learning = current.filter(l => l.role === "learning");

                if (!current.length && !isOwn) {
                    el.innerHTML = "";
                    el.hidden = true;
                    return;
                }
                el.hidden = false;

                el.innerHTML = `
                    <div class="lpl-block">
                        <div class="lpl-block-head">
                            <h3 class="lpl-block-title">${esc(L("languages"))}</h3>
                            ${isOwn && current.length ? `<button type="button" class="lpl-link-btn" data-edit aria-label="${esc(L("editAria"))}">${ICONS.pencil}<span>${esc(L("edit"))}</span></button>` : ""}
                        </div>
                        ${current.length ? `
                            ${fluent.length ? `<div class="lpl-group-label"><span class="lpl-ic-chat">${ICONS.chat}</span>${esc(L("speaks"))}</div>${chipsHtml(fluent, "fluent", options)}` : ""}
                            ${learning.length ? `<div class="lpl-group-label"><span class="lpl-ic-book">${ICONS.book}</span>${esc(L("learning"))}</div>${chipsHtml(learning, "learning", options)}` : ""}
                        ` : `
                            <div class="lpl-empty">
                                <p>${esc(L("emptyOwn"))}</p>
                                <button type="button" class="lpl-btn-orange" data-edit>${ICONS.plus}<span>${esc(L("addLanguages"))}</span></button>
                            </div>`}
                    </div>`;
            };

            el.addEventListener("click", e => {
                if (!e.target.closest("[data-edit]")) return;
                openEditLanguages({
                    userId,
                    languages: current,
                    onSaved: saved => {
                        current = saved;
                        render();
                        el.querySelector("[data-edit]")?.focus();
                    }
                });
            });

            render();
        }
    };

    /* ---------------- Edit-profile form row ---------------- */

    const LanguagesSummary = {
        async mount(el, { userId, languages }) {
            let current = normalize(languages);
            let options = { languages: [], proficiencyLevels: [] };
            try { options = await loadOptions(); } catch (err) { console.error(err); }

            const summary = () => {
                const names = role => current.filter(l => l.role === role).map(l => flagText(l.code) + langName(options, l.code)).join(", ");
                const parts = [];
                if (names("fluent")) parts.push(`${L("speaks")} ${names("fluent")}`);
                if (names("learning")) parts.push(`${L("learning")} ${names("learning")}`);
                return parts.join(" · ") || L("none");
            };

            const render = () => {
                el.innerHTML = `
                    <div class="lpl-summary">
                        <div class="lpl-summary-text">
                            <div class="lpl-summary-label">${esc(L("languages"))}</div>
                            <div class="lpl-summary-value">${esc(summary())}</div>
                        </div>
                        <button type="button" class="lpl-btn-outline lpl-btn-small" data-change>${esc(current.length ? L("change") : L("addLanguages"))}</button>
                    </div>`;
            };

            el.addEventListener("click", e => {
                if (!e.target.closest("[data-change]")) return;
                e.preventDefault(); // sits inside the profile <form>
                openEditLanguages({
                    userId,
                    languages: current,
                    onSaved: saved => {
                        current = saved;
                        render();
                        el.querySelector("[data-change]")?.focus();
                    }
                });
            });

            render();
        }
    };

    /* ---------------- Onboarding (shown once after login) ---------------- */

    // GET /users/:id/profile doesn't return onboardedAt yet, so when it's
    // missing fall back to: no languages saved and not finished on this device.
    function needsOnboarding(userId, profile) {
        if (!profile) return true;
        if (profile.onboardedAt) return false;
        if (profile.onboardedAt === null) return true;
        if ((profile.languages || []).length) return false;
        try { if (localStorage.getItem(ONBOARDED_KEY(userId))) return false; } catch (e) { }
        return true;
    }

    const LanguageOnboarding = {
        async maybeShow({ userId }) {
            if (!userId) return;
            let profile, options;
            try {
                [profile, options] = await Promise.all([fetchProfile(userId), loadOptions()]);
            } catch (err) {
                console.error("Language onboarding skipped:", err);
                return;
            }
            if (!needsOnboarding(userId, profile) || !options.languages.length) return;

            return new Promise(resolve => {
                const name = profile?.displayName?.trim() || "";
                const page = document.createElement("div");
                page.className = "lpl-onboard";
                page.setAttribute("role", "dialog");
                page.setAttribute("aria-modal", "true");
                page.setAttribute("aria-labelledby", "lplOnboardTitle");
                page.innerHTML = `
                    <div class="lpl-onboard-scroll">
                        <div class="lpl-onboard-inner">
                            <div class="lpl-onboard-welcome">${esc(L("welcome"))}${name ? `, ${esc(name)}` : ""}</div>
                            <h1 class="lpl-onboard-title" id="lplOnboardTitle" tabindex="-1">${esc(L("title"))}</h1>
                            <p class="lpl-onboard-sub">${esc(L("subtitle"))}</p>
                            <div id="lplOnboardPicker"></div>
                        </div>
                    </div>
                    <div class="lpl-onboard-foot">
                        <div class="lpl-onboard-inner">
                            <div class="lpl-error" role="alert" hidden></div>
                            <button type="button" class="lpl-btn-dark lpl-btn-full" data-continue>${esc(L("continue"))}</button>
                            <div class="lpl-hint lpl-onboard-hint" aria-live="polite"></div>
                            <button type="button" class="lpl-text-btn" data-skip>${esc(L("skip"))}</button>
                        </div>
                    </div>`;
                document.body.appendChild(page);
                document.body.classList.add("lpl-no-scroll");

                const continueBtn = page.querySelector("[data-continue]");
                const skipBtn = page.querySelector("[data-skip]");
                const hintEl = page.querySelector(".lpl-onboard-hint");
                const errorEl = page.querySelector(".lpl-error");
                let busy = false;

                const update = () => {
                    continueBtn.disabled = busy || !picker.isValid();
                    hintEl.textContent = picker.isValid() ? L("canChange") : picker.hint();
                };
                const picker = createPicker(page.querySelector("#lplOnboardPicker"), {
                    options,
                    initial: profile?.languages || [],
                    onChange: update
                });
                update();

                const finish = () => {
                    page.remove();
                    if (!dialogStack.length) document.body.classList.remove("lpl-no-scroll");
                    resolve();
                };

                async function submit(languages, btn) {
                    if (busy) return;
                    busy = true;
                    const label = btn.textContent;
                    btn.textContent = L("saving");
                    continueBtn.disabled = true;
                    skipBtn.disabled = true;
                    errorEl.hidden = true;

                    const result = await saveLanguages(userId, languages);
                    busy = false;
                    btn.textContent = label;
                    skipBtn.disabled = false;
                    if (result.ok) {
                        finish();
                    } else {
                        errorEl.textContent = result.message;
                        errorEl.hidden = false;
                        update();
                    }
                }

                continueBtn.onclick = () => picker.isValid() && submit(picker.getPayload(), continueBtn);
                skipBtn.onclick = () => submit([], skipBtn);

                page.querySelector("#lplOnboardTitle").focus();
            });
        }
    };

    window.LanguagePicker = { create: createPicker, loadOptions };
    window.LanguagesBlock = LanguagesBlock;
    window.LanguagesSummary = LanguagesSummary;
    window.LanguageOnboarding = LanguageOnboarding;
    window.openEditLanguages = openEditLanguages;
})();

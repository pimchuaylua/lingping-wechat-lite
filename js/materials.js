/**
 * materials.js
 * "Before you come" materials (Reading / Song / Video / PDF) that hosts attach
 * to a session.
 *
 *   Materials.stripHtml(materials)                  → events-list card strip
 *   Materials.detailSectionHtml(materials, host)    → event-detail section (#materials)
 *   Materials.confirmNoticeHtml(materials)          → Confirm Booking notice
 *   Materials.createEditor(el, { initial, userId, onBusyChange })
 *       → { getPayload, validate, isBusy, handleSaveError }   (add/edit event forms)
 *
 * Session field: materials: [{ type, url, fileName?, fileSize? }], [] when none.
 * PDF upload:    POST /reading-sessions/material-pdf?userId=  (field "file")
 *                → data: { url, fileName, fileSize }
 * Save errors:   result.error = MATERIAL_* (+ result.index into the list sent).
 */
(function () {
    const MAX_MATERIALS = 5;
    const MAX_PDF_BYTES = 10 * 1024 * 1024;
    const TYPE_ORDER = ["reading", "song", "video", "pdf"];

    const svg = (inner, size = 18) =>
        `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

    const ICONS = {
        book: svg('<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"></path><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"></path>'),
        music: svg('<path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle>'),
        play: svg('<rect x="2" y="4" width="20" height="16" rx="4"></rect><polygon points="10 9 15 12 10 15 10 9"></polygon>'),
        doc: svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="14" y2="17"></line>'),
        external: svg('<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line>'),
        upload: svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line>'),
        trash: svg('<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>'),
        plus: svg('<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>'),
        check: svg('<polyline points="20 6 9 17 4 12"></polyline>', 14)
    };

    const MATERIAL_TYPES = {
        reading: { icon: ICONS.book, fg: "#0F5A53", bg: "#E5F3F1", canUpload: true, defaultSource: "link" },
        song: { icon: ICONS.music, fg: "#5B45C9", bg: "#F1ECFB", canUpload: false, defaultSource: "link" },
        video: { icon: ICONS.play, fg: "#A3470E", bg: "#FDEEE0", canUpload: false, defaultSource: "link" },
        pdf: { icon: ICONS.doc, fg: "#2C5C9E", bg: "#E7EEF8", canUpload: true, defaultSource: "upload" }
    };

    const TEXT = {
        en: {
            type_reading: "Reading", type_song: "Song", type_video: "Video", type_pdf: "PDF",
            count_reading: ["{n} reading", "{n} readings"], count_song: ["{n} song", "{n} songs"],
            count_video: ["{n} video", "{n} videos"], count_pdf: ["{n} PDF", "{n} PDFs"],
            countSep: ", ",
            beforeYouCome: "Before you come", see: "See",
            hostAsks: "{name} asks you to check these before the session.",
            hostAsksNoName: "Your host asks you to check these before the session.",
            opensNewTab: "(opens in a new tab)",
            confirmTitle: "Please check these before you come",
            confirmLine: "{counts}. The links stay on the session page after you book.",
            optional: "(optional)",
            helper: "Add links or a PDF members should check before the session.",
            typeAria: "Material type", sourceAria: "How to add it",
            pasteLink: "Paste link", uploadPdf: "Upload PDF", link: "Link",
            uploadHint: "From your phone or computer · max 10 MB",
            uploading: "Uploading… {p}%", uploadProgress: "Upload progress",
            cancel: "Cancel", uploaded: "Uploaded · {size}", replace: "Replace", remove: "Remove",
            addMaterial: "Add material", maxReached: "You can add up to 5 materials",
            waitingUpload: "Waiting for upload to finish…",
            errTooBig: "That file is over 10 MB. Try a smaller PDF.",
            errNotPdf: "Please choose a PDF file.",
            errInvalidPdf: "That file isn't a valid PDF.",
            errUploadFailed: "Upload failed. Try again.",
            errLogin: "Please log in to upload a file.",
            errRateLimit: "Too many uploads in the last hour. Try again later.",
            errUrl: "Please enter a full link, like https://…",
            errType: "Please pick Reading, Song, Video or PDF.",
            errUploadNotAllowed: "Songs and videos can only be links."
        },
        zh: {
            type_reading: "阅读", type_song: "歌曲", type_video: "视频", type_pdf: "PDF",
            count_reading: "{n} 篇阅读", count_song: "{n} 首歌", count_video: "{n} 个视频", count_pdf: "{n} 个 PDF",
            countSep: "、",
            beforeYouCome: "参加前看看", see: "查看",
            hostAsks: "{name} 希望你在活动前看看这些内容。",
            hostAsksNoName: "主持人希望你在活动前看看这些内容。",
            opensNewTab: "（在新标签页打开）",
            confirmTitle: "参加前请先看看这些内容",
            confirmLine: "{counts}。预订后，这些链接会一直保留在活动页面上。",
            optional: "（选填）",
            helper: "添加成员在活动前需要看的链接或 PDF。",
            typeAria: "材料类型", sourceAria: "添加方式",
            pasteLink: "粘贴链接", uploadPdf: "上传 PDF", link: "链接",
            uploadHint: "从手机或电脑上传 · 最大 10 MB",
            uploading: "上传中… {p}%", uploadProgress: "上传进度",
            cancel: "取消", uploaded: "已上传 · {size}", replace: "替换", remove: "删除",
            addMaterial: "添加材料", maxReached: "最多可添加 5 个材料",
            waitingUpload: "正在等待上传完成…",
            errTooBig: "文件超过 10 MB，请选择更小的 PDF。",
            errNotPdf: "请选择 PDF 文件。",
            errInvalidPdf: "这个文件不是有效的 PDF。",
            errUploadFailed: "上传失败，请重试。",
            errLogin: "请先登录再上传文件。",
            errRateLimit: "过去一小时上传次数太多，请稍后再试。",
            errUrl: "请输入完整链接，例如 https://…",
            errType: "请选择阅读、歌曲、视频或 PDF。",
            errUploadNotAllowed: "歌曲和视频只能添加链接。"
        },
        th: {
            type_reading: "บทความ", type_song: "เพลง", type_video: "วิดีโอ", type_pdf: "PDF",
            count_reading: "บทความ {n} ชิ้น", count_song: "เพลง {n} เพลง", count_video: "วิดีโอ {n} คลิป", count_pdf: "PDF {n} ไฟล์",
            countSep: ", ",
            beforeYouCome: "ก่อนมาร่วม", see: "ดู",
            hostAsks: "{name} อยากให้คุณดูสิ่งเหล่านี้ก่อนเริ่มกิจกรรม",
            hostAsksNoName: "โฮสต์อยากให้คุณดูสิ่งเหล่านี้ก่อนเริ่มกิจกรรม",
            opensNewTab: "(เปิดในแท็บใหม่)",
            confirmTitle: "กรุณาดูสิ่งเหล่านี้ก่อนมาร่วม",
            confirmLine: "{counts} หลังจองแล้ว ลิงก์จะยังอยู่ในหน้ากิจกรรม",
            optional: "(ไม่บังคับ)",
            helper: "เพิ่มลิงก์หรือ PDF ที่อยากให้สมาชิกดูก่อนเริ่มกิจกรรม",
            typeAria: "ประเภทเนื้อหา", sourceAria: "วิธีเพิ่ม",
            pasteLink: "วางลิงก์", uploadPdf: "อัปโหลด PDF", link: "ลิงก์",
            uploadHint: "จากมือถือหรือคอมพิวเตอร์ · ไม่เกิน 10 MB",
            uploading: "กำลังอัปโหลด… {p}%", uploadProgress: "ความคืบหน้าการอัปโหลด",
            cancel: "ยกเลิก", uploaded: "อัปโหลดแล้ว · {size}", replace: "เปลี่ยนไฟล์", remove: "ลบ",
            addMaterial: "เพิ่มเนื้อหา", maxReached: "เพิ่มได้สูงสุด 5 รายการ",
            waitingUpload: "กำลังรออัปโหลดให้เสร็จ…",
            errTooBig: "ไฟล์ใหญ่เกิน 10 MB ลองเลือก PDF ที่เล็กกว่านี้",
            errNotPdf: "กรุณาเลือกไฟล์ PDF",
            errInvalidPdf: "ไฟล์นี้ไม่ใช่ PDF ที่ถูกต้อง",
            errUploadFailed: "อัปโหลดไม่สำเร็จ ลองอีกครั้ง",
            errLogin: "กรุณาเข้าสู่ระบบก่อนอัปโหลดไฟล์",
            errRateLimit: "อัปโหลดบ่อยเกินไปในชั่วโมงที่ผ่านมา ลองใหม่ภายหลัง",
            errUrl: "กรุณาใส่ลิงก์แบบเต็ม เช่น https://…",
            errType: "กรุณาเลือก บทความ เพลง วิดีโอ หรือ PDF",
            errUploadNotAllowed: "เพลงและวิดีโอเพิ่มได้เฉพาะลิงก์"
        }
    };

    function lang() {
        const l = window.getSiteLanguage ? window.getSiteLanguage() : "en";
        return TEXT[l] ? l : "en";
    }

    function L(key, vars) {
        let s = TEXT[lang()][key] ?? TEXT.en[key] ?? key;
        if (vars) Object.keys(vars).forEach(k => { s = s.replace(`{${k}}`, vars[k]); });
        return s;
    }

    function esc(v) {
        return String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    }

    /* ---------------- Shared helpers ---------------- */

    function known(materials) {
        return (Array.isArray(materials) ? materials : []).filter(m => m && MATERIAL_TYPES[m.type] && m.url);
    }

    function isSafeUrl(url) {
        return /^https?:\/\//i.test(String(url || "").trim());
    }

    function typeLabel(type) {
        return L(`type_${type}`);
    }

    function materialTypesSummary(materials) {
        const present = new Set(known(materials).map(m => m.type));
        return TYPE_ORDER.filter(t => present.has(t)).map(typeLabel).join(L("countSep"));
    }

    function materialCountsText(materials) {
        const counts = {};
        known(materials).forEach(m => { counts[m.type] = (counts[m.type] || 0) + 1; });
        return TYPE_ORDER.filter(t => counts[t]).map(t => {
            const tpl = TEXT[lang()][`count_${t}`] ?? TEXT.en[`count_${t}`];
            const form = Array.isArray(tpl) ? tpl[counts[t] === 1 ? 0 : 1] : tpl;
            return form.replace("{n}", counts[t]);
        }).join(L("countSep"));
    }

    function displayUrl(url) {
        try {
            const u = new URL(url);
            const path = u.pathname === "/" ? "" : u.pathname;
            const text = u.hostname.replace(/^www\./, "") + path + u.search;
            return text.length > 32 ? text.slice(0, 31) + "…" : text;
        } catch {
            return String(url || "");
        }
    }

    function materialTitle(m) {
        return m.fileName || displayUrl(m.url);
    }

    function formatBytes(n) {
        if (!(n > 0)) return "";
        if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
        return `${(n / (1024 * 1024)).toFixed(1)} MB`;
    }

    /* ---------------- 1. Events list card strip ---------------- */

    function stripHtml(materials) {
        const list = known(materials);
        if (!list.length) return "";
        const types = new Set(list.map(m => m.type));
        const icon = types.size === 1 ? MATERIAL_TYPES[list[0].type].icon : ICONS.book;
        // A real button so it's reachable; its click bubbles to the card, which
        // opens event-detail.html#materials (see index.html / english-sessions.html).
        return `
            <button type="button" class="mat-strip">
                <span class="mat-strip-icon">${icon}</span>
                <span class="mat-strip-text">${esc(L("beforeYouCome"))} · ${esc(materialTypesSummary(list))}</span>
                <span class="mat-strip-see">${esc(L("see"))}</span>
            </button>`;
    }

    /* ---------------- 2. Session detail section ---------------- */

    function detailSectionHtml(materials, hostName) {
        const list = known(materials);
        if (!list.length) return "";
        const rows = list.map(m => {
            const t = MATERIAL_TYPES[m.type];
            const size = m.fileName ? formatBytes(m.fileSize) : "";
            const label = typeLabel(m.type) + (size ? ` · ${size}` : "");
            const title = materialTitle(m);
            const inner = `
                <span class="mat-item-icon" style="background:${t.bg};color:${t.fg}">${t.icon}</span>
                <span class="mat-item-main">
                    <span class="mat-item-type" style="color:${t.fg}">${esc(label)}</span>
                    <span class="mat-item-title">${esc(title)}</span>
                </span>`;
            if (!isSafeUrl(m.url)) {
                return `<li><div class="mat-item">${inner}</div></li>`;
            }
            return `
                <li>
                    <a class="mat-item" href="${esc(m.url.trim())}" target="_blank" rel="noopener noreferrer"
                       aria-label="${esc(`${typeLabel(m.type)}: ${title} ${L("opensNewTab")}`)}">
                        ${inner}
                        <span class="mat-item-ext">${ICONS.external}</span>
                    </a>
                </li>`;
        }).join("");

        return `
            <section class="mat-detail" id="materials" tabindex="-1" aria-labelledby="matDetailTitle">
                <h2 class="mat-detail-title" id="matDetailTitle">${esc(L("beforeYouCome"))}</h2>
                <p class="mat-detail-sub">${esc(hostName ? L("hostAsks", { name: hostName }) : L("hostAsksNoName"))}</p>
                <ul class="mat-list">${rows}</ul>
            </section>`;
    }

    /* ---------------- 3. Confirm Booking notice ---------------- */

    function confirmNoticeHtml(materials) {
        const list = known(materials);
        if (!list.length) return "";
        return `
            <div class="mat-notice">
                <span class="mat-notice-icon">${ICONS.book}</span>
                <div>
                    <div class="mat-notice-title">${esc(L("confirmTitle"))}</div>
                    <div class="mat-notice-line">${esc(L("confirmLine", { counts: materialCountsText(list) }))}</div>
                </div>
            </div>`;
    }

    /* ---------------- 4. Host form editor ---------------- */

    function normalizeLink(value) {
        const v = String(value || "").trim();
        if (!v) return "";
        return /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`;
    }

    function isValidLink(value) {
        try {
            const u = new URL(value);
            return (u.protocol === "http:" || u.protocol === "https:") && !!u.hostname;
        } catch {
            return false;
        }
    }

    function createEditor(el, { initial = [], userId, onBusyChange } = {}) {
        let keySeq = 0;
        let rows = known(initial).slice(0, MAX_MATERIALS).map(m => {
            const isUpload = !!m.fileName && MATERIAL_TYPES[m.type].canUpload;
            return {
                key: ++keySeq, type: m.type,
                source: isUpload ? "upload" : "link",
                url: m.url, fileName: isUpload ? m.fileName : "", fileSize: isUpload ? m.fileSize : 0,
                mode: isUpload ? "done" : "empty", progress: 0, error: "", xhr: null, prev: null
            };
        });
        let listError = "";
        let sentKeys = [];
        let pickingKey = null;
        let wasBusy = false;

        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "application/pdf,.pdf";
        fileInput.hidden = true;

        const rowByKey = key => rows.find(r => r.key === Number(key));
        const isBusy = () => rows.some(r => r.mode === "uploading");

        function notifyBusy() {
            const busy = isBusy();
            if (busy !== wasBusy) {
                wasBusy = busy;
                if (onBusyChange) onBusyChange(busy);
            }
        }

        function newRow(type = "reading") {
            return { key: ++keySeq, type, source: MATERIAL_TYPES[type].defaultSource, url: "", fileName: "", fileSize: 0, mode: "empty", progress: 0, error: "", xhr: null, prev: null };
        }

        function clearValue(row) {
            if (row.xhr) { row.xhr.abort(); row.xhr = null; }
            row.url = ""; row.fileName = ""; row.fileSize = 0;
            row.mode = "empty"; row.progress = 0; row.error = ""; row.prev = null;
        }

        function radioGroup(items, aria, attr) {
            return `<div class="${attr === "type" ? "mat-types" : "mat-source"}" role="radiogroup" aria-label="${esc(aria)}">${items.map(it => `
                <button type="button" role="radio" aria-checked="${it.on}" tabindex="${it.on ? 0 : -1}"
                    class="${attr === "type" ? "mat-type" : "mat-src"} ${it.on ? "is-on" : ""}" data-${attr}="${it.value}">${esc(it.label)}</button>`).join("")}
            </div>`;
        }

        function contentHtml(row) {
            if (row.source === "link") {
                const id = `matUrl${row.key}`;
                const ph = row.type === "pdf" ? "https://drive.google.com/…" : "https://";
                return `
                    <label class="mat-label" for="${id}">${esc(L("link"))}</label>
                    <input class="mat-input ${row.error ? "is-invalid" : ""}" id="${id}" type="url" inputmode="url"
                        autocomplete="off" autocapitalize="off" spellcheck="false"
                        placeholder="${esc(ph)}" value="${esc(row.url)}" data-url
                        ${row.error ? `aria-invalid="true" aria-describedby="matErr${row.key}"` : ""}>`;
            }
            if (row.mode === "uploading") {
                return `
                    <div class="mat-file">
                        <span class="mat-file-icon">${ICONS.doc}</span>
                        <span class="mat-file-main">
                            <span class="mat-file-name">${esc(row.fileName)}</span>
                            <span class="mat-file-sub" data-progress-text>${esc(L("uploading", { p: row.progress }))}</span>
                        </span>
                        <button type="button" class="mat-file-btn" data-cancel>${esc(L("cancel"))}</button>
                        <span class="mat-bar" role="progressbar" aria-label="${esc(L("uploadProgress"))}"
                            aria-valuemin="0" aria-valuemax="100" aria-valuenow="${row.progress}"><span style="width:${row.progress}%"></span></span>
                    </div>`;
            }
            if (row.mode === "done") {
                return `
                    <div class="mat-file">
                        <span class="mat-file-icon">${ICONS.doc}</span>
                        <span class="mat-file-main">
                            <span class="mat-file-name">${esc(row.fileName)}</span>
                            <span class="mat-file-ok">${ICONS.check}${esc(L("uploaded", { size: formatBytes(row.fileSize) }))}</span>
                        </span>
                        <button type="button" class="mat-file-btn" data-pick>${esc(L("replace"))}</button>
                    </div>`;
            }
            return `
                <button type="button" class="mat-upload" data-pick>
                    <span class="mat-upload-main">${ICONS.upload}${esc(L("uploadPdf"))}</span>
                    <span class="mat-upload-hint">${esc(L("uploadHint"))}</span>
                </button>`;
        }

        function rowHtml(row) {
            const t = MATERIAL_TYPES[row.type];
            return `
                <div class="mat-row ${row.error ? "has-error" : ""}" data-key="${row.key}">
                    <div class="mat-row-top">
                        ${radioGroup(TYPE_ORDER.map(v => ({ value: v, label: typeLabel(v), on: v === row.type })), L("typeAria"), "type")}
                        <button type="button" class="mat-remove" data-remove aria-label="${esc(L("remove"))}">${ICONS.trash}</button>
                    </div>
                    ${t.canUpload ? radioGroup([
                        { value: "link", label: L("pasteLink"), on: row.source === "link" },
                        { value: "upload", label: L("uploadPdf"), on: row.source === "upload" }
                    ], L("sourceAria"), "source") : ""}
                    <div class="mat-content">${contentHtml(row)}</div>
                    ${row.error ? `<div class="mat-error" id="matErr${row.key}" role="alert">${esc(row.error)}</div>` : ""}
                </div>`;
        }

        function render(focusSel) {
            const full = rows.length >= MAX_MATERIALS;
            el.innerHTML = `
                <div class="mat-editor">
                    <h2 class="mat-editor-title">${esc(L("beforeYouCome"))} <span class="mat-optional">${esc(L("optional"))}</span></h2>
                    <p class="mat-editor-help">${esc(L("helper"))}</p>
                    <div class="mat-rows">${rows.map(rowHtml).join("")}</div>
                    ${full
                        ? `<p class="mat-max">${esc(L("maxReached"))}</p>`
                        : `<button type="button" class="mat-add" data-add>${ICONS.plus}${esc(L("addMaterial"))}</button>`}
                    ${listError ? `<div class="mat-error" role="alert">${esc(listError)}</div>` : ""}
                </div>`;
            el.appendChild(fileInput);
            if (focusSel) el.querySelector(focusSel)?.focus();
            notifyBusy();
        }

        function rowSel(row, inner) {
            return `[data-key="${row.key}"] ${inner}`;
        }

        function setType(row, type) {
            if (row.type === type) return;
            const keep = MATERIAL_TYPES[row.type].canUpload && MATERIAL_TYPES[type].canUpload
                && (row.url || row.mode === "uploading");
            if (!keep) {
                clearValue(row);
                row.source = MATERIAL_TYPES[type].defaultSource;
            }
            row.type = type;
            row.error = "";
        }

        function setSource(row, source) {
            if (row.source === source) return;
            clearValue(row);
            row.source = source;
        }

        function checkFile(file) {
            const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
            if (!isPdf) return L("errNotPdf");
            if (file.size > MAX_PDF_BYTES) return L("errTooBig");
            return "";
        }

        function upload(row, file) {
            const problem = checkFile(file);
            if (problem) {
                row.error = problem;
                render(rowSel(row, "[data-pick]"));
                return;
            }
            if (!userId) {
                row.error = L("errLogin");
                render(rowSel(row, "[data-pick]"));
                return;
            }

            // Replacing a finished upload: remember it, so Cancel/failure puts it back.
            row.prev = row.mode === "done" ? { url: row.url, fileName: row.fileName, fileSize: row.fileSize } : null;
            row.url = ""; row.fileName = file.name; row.fileSize = file.size;
            row.mode = "uploading"; row.progress = 0; row.error = "";

            const { BASE_URL, API_KEY } = window.CONFIG;
            const xhr = new XMLHttpRequest();
            row.xhr = xhr;
            xhr.open("POST", `${BASE_URL}/reading-sessions/material-pdf?userId=${encodeURIComponent(userId)}`);
            xhr.setRequestHeader("X-API-KEY", API_KEY);

            xhr.upload.onprogress = e => {
                if (!e.lengthComputable || row.xhr !== xhr) return;
                row.progress = Math.min(99, Math.round((e.loaded / e.total) * 100));
                const box = el.querySelector(`[data-key="${row.key}"]`);
                box?.querySelector("[data-progress-text]")?.replaceChildren(L("uploading", { p: row.progress }));
                const bar = box?.querySelector(".mat-bar");
                if (bar) {
                    bar.setAttribute("aria-valuenow", row.progress);
                    bar.firstElementChild.style.width = `${row.progress}%`;
                }
            };

            const fail = message => {
                if (row.xhr !== xhr) return;
                row.xhr = null;
                restorePrev(row);
                row.error = message;
                render(rowSel(row, "[data-pick]"));
            };

            xhr.onload = () => {
                if (row.xhr !== xhr) return;
                let json = null;
                try { json = JSON.parse(xhr.responseText); } catch { /* not JSON */ }
                const data = json?.data;
                if (xhr.status >= 200 && xhr.status < 300 && data?.url) {
                    row.xhr = null;
                    row.url = data.url;
                    row.fileName = data.fileName || file.name;
                    row.fileSize = data.fileSize || file.size;
                    row.mode = "done"; row.progress = 100; row.prev = null;
                    render(rowSel(row, "[data-pick]"));
                    return;
                }
                const code = json?.result?.error;
                if (xhr.status === 413 || code === "FILE_TOO_LARGE") fail(L("errTooBig"));
                else if (xhr.status === 415 || code === "FILE_NOT_PDF") fail(L("errInvalidPdf"));
                else if (xhr.status === 401) fail(L("errLogin"));
                else if (xhr.status === 429) fail(L("errRateLimit"));
                else fail(L("errUploadFailed"));
            };
            xhr.onerror = () => fail(L("errUploadFailed"));

            const form = new FormData();
            form.append("file", file);
            xhr.send(form);
            render(rowSel(row, "[data-cancel]"));
        }

        function restorePrev(row) {
            if (row.prev) {
                Object.assign(row, row.prev, { mode: "done", progress: 100 });
            } else {
                row.url = ""; row.fileName = ""; row.fileSize = 0;
                row.mode = "empty"; row.progress = 0;
            }
            row.prev = null;
        }

        function validateRow(row) {
            if (row.source !== "link") return true;
            const normalized = normalizeLink(row.url);
            // Only add https:// when that makes it a real link; otherwise leave what they typed.
            row.url = isValidLink(normalized) ? normalized : String(row.url || "").trim();
            if (row.url && !isValidLink(row.url)) {
                row.error = L("errUrl");
                return false;
            }
            if (row.error === L("errUrl")) row.error = "";
            return true;
        }

        /* ---- Events ---- */

        el.addEventListener("click", e => {
            const rowEl = e.target.closest("[data-key]");
            const row = rowEl && rowByKey(rowEl.dataset.key);

            if (e.target.closest("[data-add]")) {
                if (rows.length >= MAX_MATERIALS) return;
                const r = newRow();
                rows.push(r);
                listError = "";
                render(rowSel(r, '[data-type="reading"]'));
                return;
            }
            if (!row) return;

            const typeBtn = e.target.closest("[data-type]");
            if (typeBtn) {
                setType(row, typeBtn.dataset.type);
                render(rowSel(row, `[data-type="${row.type}"]`));
                return;
            }
            const srcBtn = e.target.closest("[data-source]");
            if (srcBtn) {
                setSource(row, srcBtn.dataset.source);
                render(rowSel(row, `[data-source="${row.source}"]`));
                return;
            }
            if (e.target.closest("[data-remove]")) {
                const i = rows.indexOf(row);
                clearValue(row);
                rows.splice(i, 1);
                listError = "";
                const next = rows[i] || rows[i - 1];
                render(next ? rowSel(next, "[data-remove]") : "[data-add]");
                return;
            }
            if (e.target.closest("[data-cancel]")) {
                if (row.xhr) { row.xhr.abort(); row.xhr = null; }
                restorePrev(row);
                render(rowSel(row, "[data-pick]"));
                return;
            }
            if (e.target.closest("[data-pick]")) {
                pickingKey = row.key;
                fileInput.value = "";
                fileInput.click();
            }
        });

        fileInput.addEventListener("change", () => {
            const row = rowByKey(pickingKey);
            const file = fileInput.files && fileInput.files[0];
            pickingKey = null;
            if (row && file) upload(row, file);
        });

        el.addEventListener("input", e => {
            if (!e.target.matches("[data-url]")) return;
            const row = rowByKey(e.target.closest("[data-key]").dataset.key);
            if (row) row.url = e.target.value;
        });

        el.addEventListener("focusout", e => {
            if (!e.target.matches("[data-url]")) return;
            const row = rowByKey(e.target.closest("[data-key]")?.dataset.key);
            if (!row) return;
            validateRow(row);
            e.target.value = row.url;
            // Patch in place: a full re-render here would replace the button the
            // user is tapping (focus moves before the click lands) and swallow it.
            showRowError(row, e.target);
        });

        function showRowError(row, input) {
            const rowEl = el.querySelector(`[data-key="${row.key}"]`);
            if (!rowEl) return;
            rowEl.classList.toggle("has-error", !!row.error);
            input.classList.toggle("is-invalid", !!row.error);
            let msg = rowEl.querySelector(".mat-error");
            if (row.error) {
                if (!msg) {
                    msg = document.createElement("div");
                    msg.className = "mat-error";
                    msg.id = `matErr${row.key}`;
                    msg.setAttribute("role", "alert");
                    rowEl.appendChild(msg);
                }
                msg.textContent = row.error;
                input.setAttribute("aria-invalid", "true");
                input.setAttribute("aria-describedby", msg.id);
            } else {
                msg?.remove();
                input.removeAttribute("aria-invalid");
                input.removeAttribute("aria-describedby");
            }
        }

        // Arrow keys move within a radio group (roving tabindex).
        el.addEventListener("keydown", e => {
            const radio = e.target.closest('[role="radio"]');
            if (!radio || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
            const group = [...radio.parentElement.querySelectorAll('[role="radio"]')];
            const step = e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1;
            const next = group[(group.indexOf(radio) + step + group.length) % group.length];
            e.preventDefault();
            next.click();
        });

        render();

        return {
            isBusy,

            // Returns false (and shows/focuses the first problem) if anything is wrong.
            validate() {
                let first = null;
                rows.forEach(row => {
                    if (!validateRow(row) && !first) first = row;
                });
                render();
                if (first) {
                    const input = el.querySelector(rowSel(first, "[data-url]"));
                    input?.scrollIntoView({ behavior: "smooth", block: "center" });
                    input?.focus({ preventScroll: true });
                }
                return !first && !isBusy();
            },

            getPayload() {
                const sent = rows.filter(r => r.url && r.url.trim() && (r.source === "link" || r.mode === "done"));
                sentKeys = sent.map(r => r.key);
                return sent.map(r => r.source === "upload"
                    ? { type: r.type, url: r.url, fileName: r.fileName, fileSize: r.fileSize }
                    : { type: r.type, url: r.url.trim() });
            },

            // Shows MATERIAL_* save errors inline. Returns true if it handled one.
            handleSaveError(json) {
                const code = json?.result?.error || json?.error;
                if (typeof code !== "string" || !code.startsWith("MATERIAL_")) return false;

                if (code === "MATERIAL_LIMIT") {
                    listError = L("maxReached");
                    render();
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                    return true;
                }

                const row = rowByKey(sentKeys[json?.result?.index]);
                const message = code === "MATERIAL_INVALID_URL" ? L("errUrl")
                    : code === "MATERIAL_INVALID_TYPE" ? L("errType")
                    : code === "MATERIAL_UPLOAD_NOT_ALLOWED" ? L("errUploadNotAllowed")
                    : L("errUploadFailed");
                if (row) row.error = message; else listError = message;
                render();
                const target = row ? el.querySelector(`[data-key="${row.key}"]`) : el;
                target?.scrollIntoView({ behavior: "smooth", block: "center" });
                (row && el.querySelector(rowSel(row, "[data-url], [data-pick]")))?.focus({ preventScroll: true });
                return true;
            }
        };
    }

    window.Materials = {
        MAX_MATERIALS,
        MAX_PDF_BYTES,
        TYPE_ORDER,
        MATERIAL_TYPES,
        materialTypesSummary,
        materialCountsText,
        materialTitle,
        displayUrl,
        formatBytes,
        stripHtml,
        detailSectionHtml,
        confirmNoticeHtml,
        createEditor,
        text: L
    };
})();

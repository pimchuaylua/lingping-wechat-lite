// utils.js?v=20250210
window.Utils = {
    // Locale to format dates/times in — follows the site's EN/中文 toggle
    // (translate.js) where available, English elsewhere.
    _dateLocale() {
        return (typeof window.getSiteLanguage === "function" && window.getSiteLanguage() === "zh") ? "zh-CN" : "en-US";
    },

    formatDate(input) {
        let d;

        if (input instanceof Date) {
            d = input;
        } else if (typeof input === "string") {
            // Handles both ISO strings and YYYY-MM-DD
            d = new Date(input);
        } else {
            return "—";
        }

        if (isNaN(d)) return "—";

        return d.toLocaleDateString(this._dateLocale(), {
            weekday: "short",
            month: "short",
            day: "numeric"
        });
    }
    , formatLastValidDay(input) {
        let d;

        if (input instanceof Date) {
            d = new Date(input);
        } else if (typeof input === "string") {
            d = new Date(input);
        } else {
            return "—";
        }

        if (isNaN(d.getTime())) return "—";

        // Display the previous day
        d.setDate(d.getDate() - 1);

        return d.toLocaleDateString(this._dateLocale(), {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    }, formatFullDate(input) {
        let d;

        if (input instanceof Date) {
            d = input;
        } else if (typeof input === "string") {
            // Handles both ISO strings and YYYY-MM-DD
            d = new Date(input);
        } else {
            return "—";
        }

        if (isNaN(d.getTime())) return "—";

        return d.toLocaleDateString(this._dateLocale(), {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    },

    // Chinese day-period conventions split evening out from afternoon
    // (6pm+ reads as 晚上, not 下午), which Intl's built-in hour12
    // AM/PM doesn't support — so for zh we build the string by hand.
    formatTime(input) {
        let d;
        if (input instanceof Date) d = input;
        else if (typeof input === "string") d = new Date(input);
        else return "—";

        if (isNaN(d)) return "—";

        if (this._dateLocale() !== "zh-CN") {
            return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
        }

        const h = d.getHours();
        const m = String(d.getMinutes()).padStart(2, "0");
        let period;
        if (h >= 18) period = "晚上";
        else if (h >= 12) period = "下午";
        else if (h >= 6) period = "上午";
        else period = "凌晨";

        let h12 = h % 12;
        if (h12 === 0) h12 = 12;

        return `${period}${String(h12).padStart(2, "0")}:${m}`;
    },

    // getTimeZoneName() {
    //     const d = new Date();
    //     return new Intl.DateTimeFormat("en-US", {
    //         timeZoneName: "short"
    //     }).format(d).split(", ").pop();
    // },

    getUserTimeZone() {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    },

    getTimeZoneName() {
        const tz = this.getUserTimeZone();

        if (this._dateLocale() === "zh-CN") {
            const zhMap = {
                "Asia/Bangkok": "印支时间",
                "Asia/Tokyo": "日本时间",
                "Asia/Seoul": "韩国时间",
                "Europe/London": "格林尼治时间",
                "America/New_York": "美国东部时间",
                "America/Los_Angeles": "美国西部时间",
                "Asia/Shanghai": "中国时间",
                "Asia/Beijing": "中国时间",
                "Asia/Jakarta": "印尼西部时间"
            };
            if (zhMap[tz]) return zhMap[tz];
            return tz.split("/").pop().replace("_", " ");
        }

        const shortMap = {
            "Asia/Bangkok": "ICT",
            "Asia/Tokyo": "JST",
            "Asia/Seoul": "KST",
            "Europe/London": "GMT",
            "America/New_York": "ET",
            "America/Los_Angeles": "PT",
            "Asia/Shanghai": "CST",   // China
            "Asia/Beijing": "CST",    // China (alias, sometimes used)
            "Asia/Jakarta": "WIB"     // Indonesia (Jakarta)
        };

        if (shortMap[tz]) return shortMap[tz];

        return tz.split("/").pop().replace("_", " ");
    },

    // Production rejects uploads over ~1 MB (413, which the browser reports as
    // a CORS error), so resize + re-encode photos as JPEG before uploading.
    // Steps the quality down until the file fits; returns a File.
    async compressImage(file, { maxDim = 1600, maxBytes = 900 * 1024 } = {}) {
        if (!file || !file.type.startsWith("image/") || file.type === "image/gif") return file;
        if (file.size <= maxBytes && file.type === "image/jpeg") return file;

        let bitmap;
        try {
            bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
        } catch (err) {
            // e.g. HEIC on browsers that can't decode it — upload the original.
            return file;
        }

        let dim = maxDim;
        for (let attempt = 0; attempt < 6; attempt++) {
            const scale = Math.min(1, dim / Math.max(bitmap.width, bitmap.height));
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(bitmap.width * scale);
            canvas.height = Math.round(bitmap.height * scale);
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "#fff"; // transparent PNG areas would turn black in JPEG
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

            for (const quality of [0.85, 0.75, 0.65]) {
                const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", quality));
                if (blob && blob.size <= maxBytes) {
                    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
                    return new File([blob], name, { type: "image/jpeg" });
                }
            }
            dim = Math.round(dim * 0.75);
        }
        return file;
    },

    goBackOrHome(fallbackUrl = "../index.html") {
        if (document.referrer && document.referrer !== "") {
            window.history.back();
        } else {
            window.location.href = fallbackUrl;
        }
    }
};

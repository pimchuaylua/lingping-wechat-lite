// utils.js?v=20250210
window.Utils = {
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

        return d.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric"
        });
    }
    ,

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

    goBackOrHome(fallbackUrl = "../index.html") {
        if (document.referrer && document.referrer !== "") {
            window.history.back();
        } else {
            window.location.href = fallbackUrl;
        }
    }
};

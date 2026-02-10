// utils.js?v=2025019
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

    getTimeZoneName() {
        const d = new Date();
        return new Intl.DateTimeFormat("en-US", {
            timeZoneName: "long"
        }).format(d).split(", ").pop();
    }
};

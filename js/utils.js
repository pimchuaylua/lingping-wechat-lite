// utils.js
window.Utils = {
    formatPrettyDate(dateStr) {
        const [year, month, day] = dateStr.split("-").map(Number);
        const d = new Date(year, month - 1, day);
        return d.toLocaleDateString("en-US", {
            weekday: "short",
            day: "numeric",
            month: "short"
        });
    }
};

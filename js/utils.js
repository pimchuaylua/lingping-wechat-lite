// utils.js
window.Utils = {
    formatDate(dateStr) {
        const [year, month, day] = dateStr.split("-").map(Number);
        const d = new Date(year, month - 1, day);

        return d.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric"
        });
    },

    getTimeZoneName() {
        const d = new Date();
        return new Intl.DateTimeFormat("en-US", {
            timeZoneName: "long"
        }).format(d).split(", ").pop();
    }
};

// utils.js
window.Utils = {
    formatPrettyDate(dateStr) {
        const [year, month, day] = dateStr.split("-").map(Number);

        // Create date in local timezone
        const d = new Date(year, month - 1, day);

        // Detect user's timezone
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // Try to get a readable timezone name
        const timeZoneName = new Intl.DateTimeFormat("en-US", {
            timeZoneName: "long"
        }).format(d).split(", ").pop();

        const formattedDate = d.toLocaleDateString("en-US", {
            weekday: "short",
            day: "numeric",
            month: "short"
        });

        return `${formattedDate} (${timeZoneName})`;
    }
};

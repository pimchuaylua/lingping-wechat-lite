/**
 * feed-detail.js
 * Post detail view. Reads the full post object from localStorage
 * ("selectedFeedPost"), set by feed.js on card tap — same convention
 * as "selectedSession" used elsewhere in this codebase, avoiding a
 * second network round-trip since GET /feed already returns full posts.
 * Replies are not built — no backend support exists for them yet.
 */

(function () {
    const post = JSON.parse(localStorage.getItem("selectedFeedPost") || "null");
    const body = document.getElementById("feedDetailBody");

    if (!post) {
        body.innerHTML = `
            <div class="feed-empty">
                <div class="feed-empty-text" data-i18n="feedPostNotFound">This post could not be found.</div>
            </div>
        `;
        if (typeof applyTranslations === "function") applyTranslations(body);
        return;
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function linkify(escapedText) {
        return escapedText.replace(
            /(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g,
            (url) => `<a href="${url}" target="_blank" rel="noopener">${url}</a>`
        );
    }

    function relativeTime(iso) {
        const diffSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
        if (diffSec < 60) return "now";
        const diffMin = Math.floor(diffSec / 60);
        if (diffMin < 60) return `${diffMin}m`;
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return `${diffHr}h`;
        const diffDay = Math.floor(diffHr / 24);
        if (diffDay < 7) return `${diffDay}d`;
        return `${Math.floor(diffDay / 7)}w`;
    }

    const AVATAR_TINTS = ["#FDE9C8", "#DCE9FF", "#E9D8FD", "#D8F5E3", "#FFE0E0"];

    function initialAvatar(name) {
        const letter = (name || "?").trim().charAt(0).toUpperCase() || "?";
        return { letter, bg: AVATAR_TINTS[letter.charCodeAt(0) % AVATAR_TINTS.length] };
    }

    const author = post.author || {};
    const avatar = initialAvatar(author.displayName);
    const city = post.session?.location || "";
    const rel = relativeTime(post.createdAt);
    const metaLine = city ? `${escapeHtml(city)} · ${rel}` : rel;
    const photoUrls = post.photoUrls || [];

    const photosHtml = photoUrls.length
        ? `<div class="feed-detail-photos">
            ${photoUrls.map((url, i) => `
                <div class="feed-detail-photo" data-index="${i}">
                    <img src="${escapeHtml(url)}" loading="lazy">
                </div>
            `).join("")}
        </div>`
        : "";

    const sessionRow = post.session
        ? `<a class="feed-session-row feed-detail-session-row" href="event-detail.html?sessionId=${encodeURIComponent(post.session._id)}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span class="feed-session-title">${escapeHtml(post.session.title || "")}</span>
            <svg class="feed-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M9 6l6 6-6 6"/></svg>
        </a>`
        : "";

    body.innerHTML = `
        <div class="feed-card feed-detail-card">
            <div class="feed-card-header">
                ${author.profilePic
                    ? `<img class="feed-avatar" src="${escapeHtml(author.profilePic)}" alt="${escapeHtml(author.displayName || "")}">`
                    : `<div class="feed-avatar feed-avatar-initial" style="background:${avatar.bg}">${avatar.letter}</div>`
                }
                <div class="feed-card-headertext">
                    <div class="feed-author">${escapeHtml(author.displayName || "Lingping member")}</div>
                    <div class="feed-meta">${metaLine}</div>
                </div>
            </div>
            <div class="feed-body feed-detail-text">${linkify(escapeHtml(post.thoughts || ""))}</div>
        </div>
        ${photosHtml}
        ${sessionRow}
    `;

    if (typeof applyTranslations === "function") applyTranslations(body);

    /* ---------------- Full-screen photo viewer (swipe) ---------------- */

    let currentPhotoIndex = 0;

    function renderViewer() {
        const track = document.getElementById("feedViewerTrack");
        track.innerHTML = photoUrls.map(url => `<img src="${escapeHtml(url)}">`).join("");
        track.style.transform = `translateX(-${currentPhotoIndex * 100}%)`;
    }

    window.openPhotoViewer = function (index) {
        currentPhotoIndex = index;
        renderViewer();
        document.getElementById("feedPhotoViewer").hidden = false;
    };

    window.closePhotoViewer = function () {
        document.getElementById("feedPhotoViewer").hidden = true;
    };

    body.querySelectorAll(".feed-detail-photo").forEach(el => {
        el.addEventListener("click", () => openPhotoViewer(Number(el.getAttribute("data-index"))));
    });

    let touchStartX = null;
    const viewer = document.getElementById("feedPhotoViewer");
    viewer.addEventListener("touchstart", (e) => { touchStartX = e.touches[0].clientX; });
    viewer.addEventListener("touchend", (e) => {
        if (touchStartX === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 40) {
            if (dx < 0 && currentPhotoIndex < photoUrls.length - 1) currentPhotoIndex++;
            else if (dx > 0 && currentPhotoIndex > 0) currentPhotoIndex--;
            renderViewer();
        }
        touchStartX = null;
    });
})();

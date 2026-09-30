/**
 * feed.js
 * Public Feed browsing (list view) logic for index.html's "Feed" tab.
 * GET /feed — read-only, most-recent-N across all users. No server-side
 * city filter yet, so city filtering happens client-side on the fetched page.
 */

(function () {
    let feedPosts = [];
    let feedLimit = 20;
    let feedSelectedCity = "";
    let feedLevels = null; // null = not fetched yet

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

    function buildPhotosHtml(photoUrls, postId) {
        if (!photoUrls || !photoUrls.length) return "";

        if (photoUrls.length === 1) {
            return `<div class="feed-photo-single">
                <img src="${escapeHtml(photoUrls[0])}" loading="lazy" onclick="openFeedPhotoViewer(event, '${escapeHtml(postId)}', 0)">
            </div>`;
        }

        const shown = photoUrls.slice(0, 3);
        const extra = photoUrls.length - shown.length;

        return `<div class="feed-photo-grid">
            ${shown.map((url, i) => `
                <div class="feed-photo-tile">
                    <img src="${escapeHtml(url)}" loading="lazy" onclick="openFeedPhotoViewer(event, '${escapeHtml(postId)}', ${i})">
                    ${(i === shown.length - 1 && extra > 0) ? `<div class="feed-photo-more">+${extra}</div>` : ""}
                </div>
            `).join("")}
        </div>`;
    }

    function placeFromLevel(level) {
        if (!level) return "";
        const parts = level.split(":");
        return parts.length > 1 ? parts[1].trim() : "";
    }

    const LOCATION_PILL_COLORS = [
        { bg: "#DCE9FF", text: "#1E4E8C" }, // blue (Phuket)
        { bg: "#CFF4F7", text: "#0E7490" }, // teal-blue (Online — distinct shade from Phuket's blue)
        { bg: "#DCF5E3", text: "#1F7A3F" }, // green (Chiang Mai)
        { bg: "#FFE4C4", text: "#C2540A" }, // orange (Bangkok)
        { bg: "#E9D8FD", text: "#6B21A8" }, // purple (Hong Kong)
        { bg: "#FDE2F3", text: "#BE185D" }  // pink (Chengdu — the "relax" color)
    ];

    // Fixed one-to-one assignment per city/platform, as requested — no
    // hashing/randomness. Anything outside this known set (a future city)
    // falls back to a hash of the name so it still gets a stable color.
    const KNOWN_PLACE_COLORS = {
        "Chiang Mai": LOCATION_PILL_COLORS[2],
        "Bangkok": LOCATION_PILL_COLORS[3],
        "Phuket": LOCATION_PILL_COLORS[0],
        "Hong Kong": LOCATION_PILL_COLORS[4],
        "Chengdu": LOCATION_PILL_COLORS[5],
        "Online": LOCATION_PILL_COLORS[1]
    };

    function pillColorFor(place) {
        if (KNOWN_PLACE_COLORS[place]) return KNOWN_PLACE_COLORS[place];
        let hash = 0;
        for (let i = 0; i < place.length; i++) hash = (hash * 31 + place.charCodeAt(i)) | 0;
        return LOCATION_PILL_COLORS[Math.abs(hash) % LOCATION_PILL_COLORS.length];
    }

    function buildPostCard(post) {
        const author = post.author || {};
        const avatar = initialAvatar(author.displayName);
        const place = placeFromLevel(post.session?.level);
        const pillColor = place ? pillColorFor(place) : null;
        const rel = relativeTime(post.createdAt);

        const sessionRow = post.session
            ? `<a class="feed-session-row" href="event-detail.html?sessionId=${encodeURIComponent(post.session._id)}" onclick="event.stopPropagation()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <span class="feed-session-title">${escapeHtml(post.session.title || "")}</span>
                <svg class="feed-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M9 6l6 6-6 6"/></svg>
            </a>`
            : "";

        return `
            <div class="feed-card" data-post-id="${escapeHtml(post._id)}">
                <div class="feed-card-header">
                    <a class="feed-avatar-link" href="community-profile.html" onclick="event.stopPropagation()">
                        ${author.profilePic
                            ? `<img class="feed-avatar" src="${escapeHtml(author.profilePic)}" alt="${escapeHtml(author.displayName || "")}">`
                            : `<div class="feed-avatar feed-avatar-initial" style="background:${avatar.bg}">${avatar.letter}</div>`
                        }
                    </a>
                    <div class="feed-card-headertext">
                        <div class="feed-author">${escapeHtml(author.displayName || "Lingping member")}</div>
                        <div class="feed-meta">${rel}</div>
                    </div>
                    ${place ? `<div class="feed-location-pill" style="background:${pillColor.bg};color:${pillColor.text}"><span class="feed-location-pin">📍</span>${escapeHtml(place)}</div>` : ""}
                </div>
                <div class="feed-body">${linkify(escapeHtml(post.thoughts || ""))}</div>
                ${buildPhotosHtml(post.photoUrls, post._id)}
                ${sessionRow}
            </div>
        `;
    }

    function getCities() {
        const set = new Set();

        if (feedLevels && feedLevels.length) {
            feedLevels.forEach(l => {
                const place = placeFromLevel(l.name);
                if (place) set.add(place);
            });
        } else {
            // Levels haven't loaded yet (or failed) — fall back to whatever
            // places show up in the posts already on screen.
            feedPosts.forEach(p => {
                const place = placeFromLevel(p.session?.level);
                if (place) set.add(place);
            });
        }

        return [...set].sort((a, b) => {
            if (a === "English Classes") return 1;
            if (b === "English Classes") return -1;
            return a.localeCompare(b);
        });
    }

    async function fetchLevels() {
        if (feedLevels !== null) return;
        try {
            const { BASE_URL, API_KEY } = window.CONFIG;
            const res = await fetch(`${BASE_URL}/levels`, {
                headers: { "X-API-KEY": API_KEY }
            });
            if (!res.ok) throw new Error("Failed to load levels");
            const json = await res.json();
            feedLevels = Array.isArray(json.data) ? json.data : [];
            renderFeedCityOptions();
        } catch (err) {
            console.error("Failed to load levels:", err);
        }
    }

    function renderFeedCityOptions() {
        const panel = document.getElementById("lpFeedCityListPanel");
        const sidebar = document.getElementById("lpFeedSidebarList");
        if (!panel && !sidebar) return;

        const cities = getCities();

        if (panel) {
            panel.innerHTML = `
                <div class="lp-feed-city-item ${feedSelectedCity === "" ? "lp-feed-city-item--active" : ""}" data-city="">
                    <span data-i18n="allCities">All cities</span>
                </div>
                ${cities.map(c => `
                    <div class="lp-feed-city-item ${feedSelectedCity === c ? "lp-feed-city-item--active" : ""}" data-city="${escapeHtml(c)}">
                        ${escapeHtml(c)}
                    </div>
                `).join("")}
            `;

            panel.querySelectorAll(".lp-feed-city-item").forEach(item => {
                item.addEventListener("click", () => selectFeedCity(item.getAttribute("data-city")));
            });

            if (typeof applyTranslations === "function") applyTranslations(panel);
        }

        if (sidebar) {
            sidebar.innerHTML = `
                <div class="lp-feed-sidebar-item ${feedSelectedCity === "" ? "lp-feed-sidebar-item--active" : ""}" data-city="">
                    <span class="lp-feed-sidebar-pin">📍</span>
                    <span data-i18n="allCities">All cities</span>
                </div>
                ${cities.map(c => `
                    <div class="lp-feed-sidebar-item ${feedSelectedCity === c ? "lp-feed-sidebar-item--active" : ""}" data-city="${escapeHtml(c)}">
                        <span class="lp-feed-sidebar-dot" style="background:${pillColorFor(c).text}"></span>
                        <span>${escapeHtml(c)}</span>
                    </div>
                `).join("")}
            `;

            sidebar.querySelectorAll(".lp-feed-sidebar-item").forEach(item => {
                item.addEventListener("click", () => selectFeedCity(item.getAttribute("data-city")));
            });

            if (typeof applyTranslations === "function") applyTranslations(sidebar);
        }
    }

    function selectFeedCity(city) {
        feedSelectedCity = city;
        const label = document.getElementById("lpFeedCityLabel");
        if (city) {
            label.removeAttribute("data-i18n");
            label.textContent = city;
        } else {
            label.setAttribute("data-i18n", "allCities");
            label.textContent = window.t ? t("allCities") : "All cities";
        }
        document.getElementById("lpFeedCityListPanel")?.classList.remove("lp-feed-citylist--open");
        renderFeedList();
    }

    window.toggleFeedCityDrop = function () {
        document.getElementById("lpFeedCityListPanel")?.classList.toggle("lp-feed-citylist--open");
    };

    document.addEventListener("click", (e) => {
        const wrap = document.getElementById("lpFeedCityWrap");
        if (wrap && !wrap.contains(e.target)) {
            document.getElementById("lpFeedCityListPanel")?.classList.remove("lp-feed-citylist--open");
        }
    });

    function renderFeedList() {
        const list = document.getElementById("feedList");
        if (!list) return;

        const filtered = feedSelectedCity
            ? feedPosts.filter(p => placeFromLevel(p.session?.level) === feedSelectedCity)
            : feedPosts;

        renderFeedCityOptions();

        if (!filtered.length) {
            const cityLabel = feedSelectedCity || (window.t ? t("allCities") : "All cities");
            const emptyText = window.t
                ? t("feedEmpty").replace("{city}", cityLabel)
                : `No posts yet in ${cityLabel}. Be the first to share!`;

            list.innerHTML = `
                <div class="feed-empty">
                    <div class="feed-empty-text">${escapeHtml(emptyText)}</div>
                    <a href="share-to-feed.html" class="feed-empty-share-btn" data-i18n="share">Share</a>
                </div>
            `;
            document.getElementById("feedLoadMoreWrap").hidden = true;
            if (typeof applyTranslations === "function") applyTranslations(list);
            return;
        }

        list.innerHTML = filtered.map(buildPostCard).join("");

        list.querySelectorAll(".feed-card").forEach(card => {
            card.addEventListener("click", (e) => {
                if (e.target.closest(".feed-session-row")) return;
                const id = card.getAttribute("data-post-id");
                const post = feedPosts.find(p => p._id === id);
                if (post) {
                    localStorage.setItem("selectedFeedPost", JSON.stringify(post));
                    window.location.href = "feed-detail.html";
                }
            });
        });

        document.getElementById("feedLoadMoreWrap").hidden = feedPosts.length < feedLimit;

        if (typeof applyTranslations === "function") applyTranslations(list);
    }

    function renderFeedSkeleton() {
        const list = document.getElementById("feedList");
        if (!list) return;
        list.innerHTML = Array.from({ length: 3 }).map(() => `
            <div class="feed-card feed-skeleton">
                <div class="feed-card-header">
                    <div class="feed-skel-avatar"></div>
                    <div class="feed-skel-lines">
                        <div class="feed-skel-line" style="width:40%"></div>
                        <div class="feed-skel-line" style="width:60%"></div>
                    </div>
                </div>
                <div class="feed-skel-line" style="width:90%; height:14px; margin-top:12px;"></div>
                <div class="feed-skel-line" style="width:70%; height:14px; margin-top:8px;"></div>
            </div>
        `).join("");
    }

    async function fetchFeed(limit) {
        const { BASE_URL, API_KEY } = window.CONFIG;
        const res = await fetch(`${BASE_URL}/feed?limit=${limit}`, {
            headers: { "X-API-KEY": API_KEY }
        });
        if (!res.ok) throw new Error("Failed to load feed");
        const json = await res.json();
        return Array.isArray(json.data) ? json.data : [];
    }

    async function loadFeedList() {
        try {
            feedPosts = await fetchFeed(feedLimit);
            renderFeedList();
        } catch (err) {
            console.error("Failed to load feed:", err);
            const list = document.getElementById("feedList");
            if (list) {
                list.innerHTML = `
                    <div class="feed-error">
                        <div class="feed-error-text" data-i18n="feedError">Couldn't load the feed.</div>
                        <button class="feed-retry-btn" onclick="retryFeed()" data-i18n="retry">Retry</button>
                    </div>
                `;
                if (typeof applyTranslations === "function") applyTranslations(list);
            }
        }
    }

    window.loadMoreFeed = function () {
        feedLimit += 20;
        loadFeedList();
    };

    window.retryFeed = function () {
        renderFeedSkeleton();
        loadFeedList();
    };

    /* ---------------- Desktop: compose bar avatar ---------------- */

    async function renderComposeAvatar() {
        const el = document.getElementById("lpFeedComposeAvatar");
        if (!el) return;

        const name = localStorage.getItem("username");
        const avatar = initialAvatar(name);
        el.textContent = avatar.letter;
        el.style.background = avatar.bg;

        const userId = localStorage.getItem("userId");
        if (!userId) return;

        try {
            const { BASE_URL, API_KEY } = window.CONFIG;
            const res = await fetch(`${BASE_URL}/users/${userId}/profile`, {
                headers: { "X-API-KEY": API_KEY }
            });
            if (!res.ok) return;
            const json = await res.json();
            const profilePic = json?.data?.profilePic;
            if (profilePic) {
                el.innerHTML = `<img src="${escapeHtml(profilePic)}" alt="">`;
                el.style.background = "";
            }
        } catch (err) {
            console.error("Failed to load profile photo for compose avatar:", err);
        }
    }

    /* ---------------- Desktop: "Coming up" events widget ---------------- */

    let comingUpEvents = null; // null = not fetched yet

    function fmtISODate(d) {
        return d.toISOString().slice(0, 10);
    }

    function renderComingUp() {
        const list = document.getElementById("lpFeedComingUpList");
        if (!list) return;

        if (!comingUpEvents || !comingUpEvents.length) {
            list.innerHTML = `<div class="lp-feed-comingup-empty" data-i18n="noSessions">No upcoming sessions</div>`;
            if (typeof applyTranslations === "function") applyTranslations(list);
            return;
        }

        list.innerHTML = comingUpEvents.map(s => {
            const start = new Date(s.startTime);
            const place = s.type === "online" ? (window.t ? t("tabOnline") : "Online") : (s.location || "");
            const meta = `${Utils.formatDate(start)} · ${Utils.formatTime(start)}${place ? " · " + escapeHtml(place) : ""}`;
            return `
                <a class="lp-feed-comingup-item" href="event-detail.html?sessionId=${encodeURIComponent(s._id)}">
                    ${s.photoUrl
                        ? `<img class="lp-feed-comingup-thumb" src="${escapeHtml(s.photoUrl)}" loading="lazy">`
                        : `<div class="lp-feed-comingup-thumb"></div>`
                    }
                    <div class="lp-feed-comingup-text">
                        <div class="lp-feed-comingup-title">${escapeHtml(s.title || "")}</div>
                        <div class="lp-feed-comingup-meta">${meta}</div>
                    </div>
                </a>
            `;
        }).join("");
    }

    async function fetchComingUp() {
        if (comingUpEvents !== null) return;
        try {
            const { BASE_URL, API_KEY } = window.CONFIG;
            const from = new Date();
            const to = new Date(from.getTime() + 14 * 24 * 60 * 60 * 1000);
            const params = new URLSearchParams({ fromDate: fmtISODate(from), toDate: fmtISODate(to) });

            const res = await fetch(`${BASE_URL}/reading-sessions?${params}`, {
                headers: { "X-API-KEY": API_KEY }
            });
            if (res.status === 404) {
                comingUpEvents = [];
            } else {
                if (!res.ok) throw new Error("Failed to load upcoming events");
                const json = await res.json();
                const raw = Array.isArray(json.data) ? json.data : [];
                const now = Date.now();
                comingUpEvents = raw
                    .filter(s => new Date(s.startTime).getTime() >= now)
                    .slice(0, 5);
            }
        } catch (err) {
            console.error("Failed to load upcoming events:", err);
            comingUpEvents = [];
        }
        renderComingUp();
    }

    window.initFeedTab = function () {
        renderFeedSkeleton();
        fetchLevels();
        loadFeedList();
        renderComposeAvatar();
        fetchComingUp();
    };

    /* ---------------- Full-screen photo viewer (tap to maximize) ---------------- */

    let viewerPhotoUrls = [];
    let viewerIndex = 0;

    function renderFeedPhotoViewer() {
        const track = document.getElementById("feedPhotoViewerTrack");
        track.innerHTML = viewerPhotoUrls.map(url => `
            <div class="feed-viewer-slide">
                <img src="${escapeHtml(url)}">
            </div>
        `).join("");
        track.style.transform = `translateX(-${viewerIndex * 100}%)`;
    }

    window.openFeedPhotoViewer = function (event, postId, index) {
        event.stopPropagation();
        const post = feedPosts.find(p => p._id === postId);
        if (!post || !post.photoUrls || !post.photoUrls.length) return;

        viewerPhotoUrls = post.photoUrls;
        viewerIndex = index;
        renderFeedPhotoViewer();
        document.getElementById("feedPhotoViewer").hidden = false;
    };

    window.closeFeedPhotoViewer = function () {
        document.getElementById("feedPhotoViewer").hidden = true;
    };

    (function initFeedPhotoViewerSwipe() {
        const viewer = document.getElementById("feedPhotoViewer");
        if (!viewer) return;

        let touchStartX = null;
        viewer.addEventListener("touchstart", (e) => { touchStartX = e.touches[0].clientX; });
        viewer.addEventListener("touchend", (e) => {
            if (touchStartX === null) return;
            const dx = e.changedTouches[0].clientX - touchStartX;
            if (Math.abs(dx) > 40) {
                if (dx < 0 && viewerIndex < viewerPhotoUrls.length - 1) viewerIndex++;
                else if (dx > 0 && viewerIndex > 0) viewerIndex--;
                renderFeedPhotoViewer();
            }
            touchStartX = null;
        });
    })();
})();

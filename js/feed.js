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

    function buildPhotosHtml(photoUrls) {
        if (!photoUrls || !photoUrls.length) return "";

        if (photoUrls.length === 1) {
            return `<div class="feed-photo-single"><img src="${escapeHtml(photoUrls[0])}" loading="lazy"></div>`;
        }

        const shown = photoUrls.slice(0, 3);
        const extra = photoUrls.length - shown.length;

        return `<div class="feed-photo-grid">
            ${shown.map((url, i) => `
                <div class="feed-photo-tile">
                    <img src="${escapeHtml(url)}" loading="lazy">
                    ${(i === shown.length - 1 && extra > 0) ? `<div class="feed-photo-more">+${extra}</div>` : ""}
                </div>
            `).join("")}
        </div>`;
    }

    function buildPostCard(post) {
        const author = post.author || {};
        const avatar = initialAvatar(author.displayName);
        const city = post.session?.location || "";
        const rel = relativeTime(post.createdAt);
        const metaLine = city ? `${escapeHtml(city)} · ${rel}` : rel;

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
                    ${author.profilePic
                        ? `<img class="feed-avatar" src="${escapeHtml(author.profilePic)}" alt="${escapeHtml(author.displayName || "")}">`
                        : `<div class="feed-avatar feed-avatar-initial" style="background:${avatar.bg}">${avatar.letter}</div>`
                    }
                    <div class="feed-card-headertext">
                        <div class="feed-author">${escapeHtml(author.displayName || "Lingping member")}</div>
                        <div class="feed-meta">${metaLine}</div>
                    </div>
                </div>
                <div class="feed-body">${linkify(escapeHtml(post.thoughts || ""))}</div>
                ${buildPhotosHtml(post.photoUrls)}
                ${sessionRow}
            </div>
        `;
    }

    function getCities() {
        const set = new Set();
        feedPosts.forEach(p => { if (p.session?.location) set.add(p.session.location); });
        return [...set].sort();
    }

    function renderFeedCityOptions() {
        const panel = document.getElementById("lpFeedCityListPanel");
        if (!panel) return;

        const cities = getCities();
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
            ? feedPosts.filter(p => p.session?.location === feedSelectedCity)
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

    window.initFeedTab = function () {
        renderFeedSkeleton();
        loadFeedList();
    };
})();

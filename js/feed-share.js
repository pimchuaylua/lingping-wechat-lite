/**
 * feed-share.js
 * Share sheet for feed posts — used by the Feed tab cards (feed.js) and
 * the post detail page (feed-detail.js). Offers "Copy link" and, where the
 * browser supports navigator.share, "Share to…" (native share sheet).
 * Reuses the .session-sheet bottom-sheet styles from feed_style.css.
 */

(function () {
    const tr = (key, fallback) => {
        const text = window.t ? t(key) : key;
        return text && text !== key ? text : fallback;
    };

    function getPostShareUrl(postId) {
        return new URL(`feed-detail.html?postId=${encodeURIComponent(postId)}`, window.location.href).href;
    }

    function showFeedToast(message) {
        const toast = document.createElement("div");
        toast.className = "feed-toast";
        toast.textContent = message;
        document.body.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add("show"));

        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 200);
        }, 1800);
    }

    function getShareSheet() {
        let overlay = document.getElementById("feedShareSheet");
        if (overlay) return overlay;

        overlay = document.createElement("div");
        overlay.id = "feedShareSheet";
        overlay.className = "session-sheet-overlay";
        overlay.hidden = true;
        overlay.innerHTML = `
            <div class="session-sheet" role="dialog" aria-modal="true" aria-labelledby="feedShareSheetTitle">
                <div class="session-sheet-handle"></div>
                <div class="session-sheet-header">
                    <div class="session-sheet-title" id="feedShareSheetTitle"></div>
                    <button type="button" class="session-sheet-close" aria-label="Close">×</button>
                </div>
                <div class="feed-share-options">
                    <button type="button" class="feed-share-option" id="feedShareCopyBtn">
                        <span class="feed-share-option-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                        </span>
                        <span class="feed-share-option-label" id="feedShareCopyLabel"></span>
                    </button>
                    <button type="button" class="feed-share-option" id="feedShareNativeBtn">
                        <span class="feed-share-option-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                        </span>
                        <span class="feed-share-option-label" id="feedShareNativeLabel"></span>
                    </button>
                </div>
            </div>
        `;

        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) closePostShare();
        });
        overlay.querySelector(".session-sheet-close").addEventListener("click", closePostShare);
        document.body.appendChild(overlay);
        return overlay;
    }

    function handleShareKeydown(e) {
        if (e.key === "Escape") closePostShare();
    }

    function closePostShare() {
        const overlay = document.getElementById("feedShareSheet");
        if (overlay) overlay.hidden = true;
        document.removeEventListener("keydown", handleShareKeydown);
    }

    function openPostShare(post) {
        if (!post || !post._id) return;

        const url = getPostShareUrl(post._id);
        const overlay = getShareSheet();

        overlay.querySelector("#feedShareSheetTitle").textContent = tr("share", "Share");
        overlay.querySelector("#feedShareCopyLabel").textContent = tr("copyLink", "Copy link");
        overlay.querySelector("#feedShareNativeLabel").textContent = tr("shareToApps", "Share to…");

        overlay.querySelector("#feedShareCopyBtn").onclick = async () => {
            closePostShare();
            try {
                await navigator.clipboard.writeText(url);
                showFeedToast(tr("linkCopied", "Link copied ✅"));
            } catch (err) {
                console.error(err);
                window.prompt(tr("copyLink", "Copy link"), url);
            }
        };

        const nativeBtn = overlay.querySelector("#feedShareNativeBtn");
        nativeBtn.hidden = !navigator.share;
        nativeBtn.onclick = async () => {
            closePostShare();
            const author = post.author?.displayName || "Lingping member";
            const excerpt = (post.thoughts || "").trim();
            const text = excerpt.length > 100 ? `${excerpt.slice(0, 100)}…` : excerpt;
            try {
                await navigator.share({ title: `${author} on Lingping Club`, text, url });
            } catch (err) {
                // user canceled the share sheet
            }
        };

        overlay.hidden = false;
        document.addEventListener("keydown", handleShareKeydown);
    }

    window.openPostShare = openPostShare;
    window.closePostShare = closePostShare;
})();

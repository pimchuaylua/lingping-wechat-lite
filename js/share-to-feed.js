/**
 * share-to-feed.js
 * Compose screen for a generic (no session) public Feed post.
 * POST /users/{userId}/learnings — sessionId omitted entirely (feed posts
 * aren't tied to a session), wordsLearned sent as [""] since the backend
 * still requires a non-empty array even though the field itself is meant
 * to be optional for this flow (see plan notes — verified via a live test).
 */

(function () {
    const { BASE_URL, API_KEY } = window.CONFIG;
    const MAX_PHOTOS = 10;

    const userId = localStorage.getItem("userId");
    if (!userId) {
        localStorage.setItem("redirectAfterLogin", window.location.href);
        window.location.href = "login.html";
        return;
    }

    let pendingPhotos = []; // { file, previewUrl }
    let hasUnsavedChanges = false;
    let isSubmitting = false;

    let pastSessions = null; // null = not fetched yet
    let selectedSession = null; // { _id, title, startTime }

    function resizeImage(file, maxDimension = 1600, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (e) => { img.src = e.target.result; };

            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxDimension) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    }
                } else {
                    if (height > maxDimension) {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                canvas.getContext("2d").drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => blob ? resolve(blob) : reject(new Error("Image compression failed")),
                    "image/jpeg",
                    quality
                );
            };

            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function updatePostButtonState() {
        const text = document.getElementById("thoughtsInput").value.trim();
        const hasPhoto = pendingPhotos.length > 0;
        document.getElementById("postBtn").disabled = !(text || hasPhoto);
    }

    window.onComposeChange = function () {
        hasUnsavedChanges = true;
        updatePostButtonState();
    };

    function renderPhotoGrid() {
        const grid = document.getElementById("photoGrid");
        const addTile = document.getElementById("photoAddTile");

        grid.querySelectorAll(".share-photo-thumb").forEach(el => el.remove());

        pendingPhotos.forEach((p, i) => {
            const tile = document.createElement("div");
            tile.className = "share-photo-thumb";
            tile.innerHTML = `
                <img src="${p.previewUrl}" alt="">
                <button type="button" class="share-photo-remove" aria-label="Remove photo" onclick="removePhoto(${i})">×</button>
            `;
            grid.insertBefore(tile, addTile);
        });

        addTile.style.display = pendingPhotos.length >= MAX_PHOTOS ? "none" : "flex";
        updatePostButtonState();
    }

    window.removePhoto = function (index) {
        URL.revokeObjectURL(pendingPhotos[index].previewUrl);
        pendingPhotos.splice(index, 1);
        hasUnsavedChanges = true;
        renderPhotoGrid();
    };

    window.onPhotosSelected = function (event) {
        const files = Array.from(event.target.files || []);
        event.target.value = "";

        const room = MAX_PHOTOS - pendingPhotos.length;
        files.slice(0, room).forEach(file => {
            pendingPhotos.push({ file, previewUrl: URL.createObjectURL(file) });
        });

        hasUnsavedChanges = true;
        renderPhotoGrid();
    };

    function showError(msg) {
        const el = document.getElementById("composeError");
        el.textContent = msg;
        el.hidden = false;
    }

    function clearError() {
        document.getElementById("composeError").hidden = true;
    }

    /* ---------------- Attach a past session (optional) ---------------- */

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function placeFromLevel(level) {
        if (!level) return "";
        const parts = level.split(":");
        return parts.length > 1 ? parts[1].trim() : "";
    }

    function sessionSubtitle(session) {
        const place = placeFromLevel(session.level);
        const date = Utils.formatDate(session.startTime);
        return place ? `${date} · ${place}` : date;
    }

    function renderSessionList(state) {
        const list = document.getElementById("sessionList");

        if (state === "loading") {
            list.innerHTML = `<div class="share-session-status" data-i18n="loadingSessions">Loading your sessions…</div>`;
        } else if (state === "error") {
            list.innerHTML = `<div class="share-session-status" data-i18n="sessionsLoadError">Couldn't load your sessions.</div>`;
        } else if (!pastSessions || !pastSessions.length) {
            list.innerHTML = `<div class="share-session-status" data-i18n="noPastSessions">No past sessions yet</div>`;
        } else {
            list.innerHTML = pastSessions.map(session => `
                <div class="session-row ${selectedSession?._id === session._id ? "session-row--selected" : ""}" data-id="${escapeHtml(session._id)}">
                    <div class="session-row-thumb">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    </div>
                    <div class="session-row-text">
                        <div class="session-row-title">${escapeHtml(session.title || "")}</div>
                        <div class="session-row-subtitle">${escapeHtml(sessionSubtitle(session))}</div>
                    </div>
                    <div class="session-row-radio ${selectedSession?._id === session._id ? "session-row-radio--checked" : ""}"></div>
                </div>
            `).join("");

            list.querySelectorAll(".session-row").forEach(el => {
                el.addEventListener("click", () => {
                    const session = pastSessions.find(s => s._id === el.getAttribute("data-id"));
                    if (session) selectSession(session);
                });
            });
        }

        if (typeof applyTranslations === "function") applyTranslations(list);
    }

    async function fetchPastSessions() {
        renderSessionList("loading");
        try {
            // GET /users/{userId}/session-history?pastOnly=true — merged
            // host + attendee history, already filtered to past-only and
            // sorted by session date descending server-side.
            const res = await fetch(`${BASE_URL}/users/${userId}/session-history?limit=20&offset=0&pastOnly=true`, {
                headers: { "X-API-KEY": API_KEY }
            });
            if (!res.ok) throw new Error("Failed to load past sessions");
            const json = await res.json();
            const items = Array.isArray(json?.data?.sessions) ? json.data.sessions : [];

            pastSessions = items
                .map(item => item.session)
                .filter(Boolean)
                .map(s => ({
                    _id: s._id,
                    title: s.title || "",
                    startTime: s.startTime,
                    level: s.level || ""
                }));
        } catch (err) {
            console.error("Failed to load past sessions:", err);
            pastSessions = null;
            renderSessionList("error");
            return;
        }
        renderSessionList();
    }

    window.openSessionPicker = function () {
        document.getElementById("sessionSheetOverlay").hidden = false;
        document.body.style.overflow = "hidden";

        if (pastSessions === null) {
            fetchPastSessions();
        } else {
            renderSessionList();
        }
    };

    window.closeSessionPicker = function () {
        document.getElementById("sessionSheetOverlay").hidden = true;
        document.body.style.overflow = "";
    };

    function selectSession(session) {
        selectedSession = session;
        hasUnsavedChanges = true;
        closeSessionPicker();

        document.getElementById("sessionTrigger").hidden = true;

        const chip = document.getElementById("sessionChip");
        chip.hidden = false;
        document.getElementById("sessionChipTitle").textContent = session.title || "";
        document.getElementById("sessionChipDate").textContent = sessionSubtitle(session);
    }

    window.clearSelectedSession = function () {
        selectedSession = null;
        hasUnsavedChanges = true;

        document.getElementById("sessionChip").hidden = true;
        document.getElementById("sessionTrigger").hidden = false;
    };

    async function uploadPhoto(file) {
        const resized = await resizeImage(file);
        const formData = new FormData();
        formData.append("photo", resized, "photo.jpg");

        const res = await fetch(`${BASE_URL}/users/${userId}/learnings/photo`, {
            method: "POST",
            headers: { "X-API-KEY": API_KEY },
            body: formData
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err?.result?.message?.join?.(", ") || err?.message || "Photo upload failed");
        }

        const json = await res.json();
        return json?.data?.photoUrl;
    }

    window.submitPost = async function () {
        if (isSubmitting) return;
        clearError();

        const thoughts = document.getElementById("thoughtsInput").value.trim();
        if (!thoughts && pendingPhotos.length === 0) return;

        isSubmitting = true;
        const postBtn = document.getElementById("postBtn");
        postBtn.disabled = true;
        postBtn.textContent = window.t ? t("posting") : "Posting…";

        try {
            const photoUrls = [];
            for (const p of pendingPhotos) {
                photoUrls.push(await uploadPhoto(p.file));
            }

            const body = {
                thoughts,
                wordsLearned: [""],
                photoUrls
            };
            if (selectedSession) {
                body.sessionId = selectedSession._id;
            }

            const res = await fetch(`${BASE_URL}/users/${userId}/learnings`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-KEY": API_KEY
                },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.result?.message?.join?.(", ") || err?.message || "Failed to post");
            }

            hasUnsavedChanges = false;
            window.location.href = "index.html?tab=feed";

        } catch (err) {
            console.error("Failed to post to feed:", err);
            showError(err.message || (window.t ? t("postFailed") : "Failed to post. Please try again."));
            isSubmitting = false;
            postBtn.textContent = window.t ? t("post") : "Post";
            updatePostButtonState();
        }
    };

    window.handleCancel = function () {
        if (hasUnsavedChanges) {
            const confirmLeave = confirm(window.t ? t("unsavedChangesConfirm") : "Discard this post?");
            if (!confirmLeave) return;
        }
        window.location.href = "index.html?tab=feed";
    };

    window.addEventListener("beforeunload", (e) => {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = "";
        }
    });

    updatePostButtonState();
})();

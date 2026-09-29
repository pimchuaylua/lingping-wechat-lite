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

            const res = await fetch(`${BASE_URL}/users/${userId}/learnings`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-KEY": API_KEY
                },
                body: JSON.stringify({
                    thoughts,
                    wordsLearned: [""],
                    photoUrls
                })
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

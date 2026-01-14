/* ============================
   Auth / Config
============================ */

const USER_ID = localStorage.getItem("userId");

if (!USER_ID) {
    alert("Please log in first.");
    window.location.href = "login.html";
    throw new Error("USER_ID missing");
}

const API_BASE = window.CONFIG.BASE_URL;

const headers = {
    "Content-Type": "application/json",
    "X-API-KEY": window.CONFIG.API_KEY,
};

/* ============================
   DOM
============================ */

const form = document.getElementById("profileForm");
const promptContainer = document.getElementById("funPrompts");

const profileAvatar = document.getElementById("avatar");
const profileAvatarPlaceholder = document.getElementById("avatarPlaceholder");
const profileAvatarInput = document.getElementById("avatarInput");

/* ============================
   Image resize helper
============================ */

function resizeImage(file, maxDimension = 1024, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target.result;
        };

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
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error("Image compression failed"));
                    }
                },
                "image/jpeg",
                quality
            );
        };

        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/* ============================
   Avatar helpers
============================ */

function renderAvatar(profilePic) {
    if (profilePic) {
        profileAvatar.style.backgroundImage = `url("${profilePic}")`;
        profileAvatar.classList.add("has-photo");
        profileAvatarPlaceholder.style.display = "none";
    } else {
        profileAvatar.style.backgroundImage = "";
        profileAvatar.classList.remove("has-photo");
        profileAvatarPlaceholder.style.display = "block";
    }
}

profileAvatarInput.addEventListener("click", () => {
    profileAvatarInput.value = ""; // reset so same image works
});



profileAvatarInput.addEventListener("change", async () => {
    const file = profileAvatarInput.files[0];
    if (!file) return;

    // Optimistic preview
    const previewUrl = URL.createObjectURL(file);
    renderAvatar(previewUrl);

    try {
        // Resize and compress the image
        const resizedBlob = await resizeImage(file);

        const formData = new FormData();
        formData.append("file", resizedBlob, "avatar.jpg");

        const res = await fetch(
            `${API_BASE}/users/${USER_ID}/profile/photo`,
            {
                method: "POST",
                headers: {
                    "X-API-KEY": window.CONFIG.API_KEY,
                },
                body: formData,
            }
        );

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || "Upload failed");
        }

        // Reload profile to get final S3 URL
        await loadProfile();

    } catch (err) {
        console.error("Photo upload failed:", err);
        alert(err.message || "Failed to upload photo");
        loadProfile(); // revert to previous avatar if needed
    }
});

/* ============================
   Render prompt fields
============================ */

PROFILE_QUESTIONS.forEach((q, i) => {
    promptContainer.insertAdjacentHTML(
        "beforeend",
        `
        <label class="form-label">
            ${q}
            <textarea rows="2" data-index="${i}"></textarea>
        </label>
        `
    );
});

/* ============================
   Load existing profile
============================ */

async function loadProfile() {
    try {
        const res = await fetch(
            `${API_BASE}/users/${USER_ID}/profile`,
            { headers }
        );

        const json = await res.json();
        const data = json?.data;
        if (!data) return;

        document.getElementById("displayName").value = data.displayName ?? "";
        document.getElementById("bio").value = data.bio ?? "";
        document.getElementById("description").value = data.description ?? "";

        renderAvatar(data.profilePic);

        document.getElementById("topics").value =
            (data.topicsOfInterests || [])
                .map((t) => t.id ?? t)
                .join(",");

        (data.funPrompts || []).forEach((fp, i) => {
            const field = document.querySelector(
                `textarea[data-index="${i}"]`
            );
            if (field) field.value = fp.answer ?? "";
        });

    } catch (err) {
        console.error("Failed to load profile:", err);
    }
}

/* ============================
   Save profile
============================ */

async function saveProfile(e) {
    e.preventDefault();

    const funPrompts = PROFILE_QUESTIONS.map((q, i) => {
        const value = document
            .querySelector(`textarea[data-index="${i}"]`)
            ?.value.trim();

        return {
            question: q,
            answer: value && value.length ? value : " ",
        };
    });

    const payload = {
        displayName:
            document.getElementById("displayName").value.trim() || " ",
        bio:
            document.getElementById("bio").value.trim() || " ",
        description:
            document.getElementById("description").value.trim() || " ",
        topicsOfInterests:
            document.getElementById("topics")
                .value
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
        funPrompts,
    };

    try {
        const check = await fetch(
            `${API_BASE}/users/${USER_ID}/profile`,
            { headers }
        );

        const exists = (await check.json())?.data;

        await fetch(
            `${API_BASE}/users/${USER_ID}/profile`,
            {
                method: exists ? "PATCH" : "POST",
                headers,
                body: JSON.stringify(payload),
            }
        );

        alert("Profile saved successfully!");

    } catch (err) {
        console.error("Failed to save profile:", err);
        alert("Failed to save profile. Please try again.");
    }
}

/* ============================
   Init
============================ */

form.addEventListener("submit", saveProfile);
loadProfile();

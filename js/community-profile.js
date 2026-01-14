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
        document.getElementById("profilePic").value = data.profilePic ?? "";
        document.getElementById("bio").value = data.bio ?? "";
        document.getElementById("description").value = data.description ?? "";

        document.getElementById("topics").value =
            (data.topicsOfInterests || [])
                .map(t => t.id ?? t)
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
        profilePic:
            document.getElementById("profilePic").value.trim() || " ",
        bio:
            document.getElementById("bio").value.trim() || " ",
        description:
            document.getElementById("description").value.trim() || " ",
        topicsOfInterests:
            document.getElementById("topics")
                .value
                .split(",")
                .map(t => t.trim())
                .filter(Boolean),
        funPrompts,
    };

    try {
        // detect create vs update
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

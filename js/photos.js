function createSlider(containerId, folder, photos) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let index = 0;

    const row = document.createElement("div");
    row.className = "photo-row";

    const frame = document.createElement("div");
    frame.className = "photo-frame";

    const img = document.createElement("img");
    const caption = document.createElement("div");
    caption.className = "photo-caption";

    const leftArrow = document.createElement("button");
    leftArrow.className = "photo-arrow left";
    leftArrow.innerHTML = "&lt;";

    const rightArrow = document.createElement("button");
    rightArrow.className = "photo-arrow right";
    rightArrow.innerHTML = "&gt;";

    frame.appendChild(img);

    row.appendChild(leftArrow);
    row.appendChild(frame);
    row.appendChild(rightArrow);

    container.appendChild(row);
    container.appendChild(caption);

    function render() {
        img.src = `photos/${folder}/${photos[index].file}`;
        caption.innerText = photos[index].caption;
    }

    leftArrow.onclick = () => {
        index = (index - 1 + photos.length) % photos.length;
        render();
    };

    rightArrow.onclick = () => {
        index = (index + 1) % photos.length;
        render();
    };

    render();
}

// ✅ Run AFTER DOM exists
createSlider("onlinePhotos", "online", [
    { file: "1.jpg", caption: "Online English Corner\nEvery day 11AM-12PM & 9-10PM (China Time)" }
]);

createSlider("chinaPhotos", "china", [
    { file: "4.jpg", caption: "Meetup in Chengdu" },
    { file: "1.jpg", caption: "Meetup in Changsha" },
    { file: "2.jpg", caption: "Meetup in Wuhan" },
    { file: "3.jpg", caption: "Meetup in Shenzhen" },
]);

createSlider("bangkokPhotos", "bangkok", [
    { file: "asoke.jpg", caption: "Every Sat in Asoke-Thonglor" },
    { file: "ari.jpg", caption: "Every Sun in Ari" },
    { file: "openhouse.jpg", caption: "Every Thu at Central Embassy" },
    { file: "nichada.jpg", caption: "We also meet every Sun in Nonthaburi!" },
]);

createSlider("phuketPhotos", "phuket", [
    { file: "beans.jpg", caption: "Connecting Southern Thai locals & Expats" },
    { file: "bartels.jpg", caption: "Good conversations in Thai & English over coffee" },
    { file: "cannelle.jpg", caption: "Late-night café chats in Cherngtalay" }
]);

createSlider("chiangmaiPhotos", "chiangmai", [
    { file: "citywalk.jpg", caption: "Exploring Chiang Mai Old Town with our local members" },
    { file: "english.jpg", caption: "Weekly Thai-English exchanges at cozy cafés" },
    { file: "outdoor.jpg", caption: "Kayaking together on the Ping River" },
]);

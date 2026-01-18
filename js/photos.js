function createSlider(containerId, folder, photos) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let index = 0;

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
    frame.appendChild(leftArrow);
    frame.appendChild(rightArrow);

    container.appendChild(frame);
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

createSlider("chiangmaiPhotos", "chiangmai", [
    { file: "1.jpg", caption: "Weekly Explore the World Night" },
    { file: "4.jpg", caption: "Explore Australia with Kieren!" },
    { file: "2.jpg", caption: "Explore the Outdoors" },
    { file: "5.jpg", caption: "Italian Cooking Night with Julz" },
    { file: "3.jpg", caption: "Book Club" }
]);

/**
 * cities.js
 * In-person cities for the "Where" picker (index.html) and the create-session
 * form (add-event.html), loaded from GET /levels?mode=in_person.
 *
 *   Cities.load()  → Promise<[{ levelId, name, country, count }]>
 *       country: "TH" | "HK" | "CN"; count: upcoming in-person events, or null
 *       Sorted by country (Thailand, Hong Kong, China), then count (most
 *       first), then name A–Z. New cities appear without a frontend change.
 *   Cities.loadOnlineLevelId() → Promise<string>  the level named "Online"
 *   Cities.COUNTRY_ORDER
 */
(function () {
    const COUNTRY_ORDER = ["TH", "HK", "CN"];

    // Used only if GET /levels fails: shown without counts, A–Z per country.
    const FALLBACK = [
        { levelId: "69870890d9adda8b3d791661", name: "Bangkok", country: "TH" },
        { levelId: "67eab5b337cd4b56a080743f", name: "Chiang Mai", country: "TH" },
        { levelId: "6a02e9e90c8f769c0cd9d2c8", name: "Phuket", country: "TH" },
        { levelId: "6a841f58cca7afd6cad9dd14", name: "Hong Kong", country: "HK" },
        { levelId: "6a7164950117c11720df32be", name: "Chengdu", country: "CN" },
        { levelId: "6af347a1e4f3236fa0127cc5", name: "Guangzhou", country: "CN" }
    ];
    const FALLBACK_ONLINE_LEVEL_ID = "695c763e2d652e065db71030";

    function countryRank(code) {
        const i = COUNTRY_ORDER.indexOf(code);
        return i === -1 ? COUNTRY_ORDER.length : i; // unknown countries go last
    }

    function sortCities(cities) {
        return cities.slice().sort((a, b) =>
            countryRank(a.country) - countryRank(b.country)
            || (b.count ?? -1) - (a.count ?? -1)
            || a.name.localeCompare(b.name));
    }

    function fetchLevels(mode) {
        const { BASE_URL, API_KEY } = window.CONFIG;
        return fetch(`${BASE_URL}/levels?mode=${mode}&locale=en_US`, { headers: { "X-API-KEY": API_KEY } })
            .then(res => {
                if (!res.ok) throw new Error(`GET /levels?mode=${mode} failed: ${res.status}`);
                return res.json();
            })
            .then(json => (Array.isArray(json.data) ? json.data : []));
    }

    let citiesPromise = null;

    function load() {
        if (!citiesPromise) {
            citiesPromise = fetchLevels("in_person")
                .then(levels => {
                    const cities = levels
                        .filter(l => l && l._id && l.name)
                        .map(l => ({
                            levelId: l._id,
                            name: l.name,
                            country: l.country || "",
                            count: typeof l.upcomingInPersonEventCount === "number" ? l.upcomingInPersonEventCount : null
                        }));
                    if (!cities.length) throw new Error("GET /levels returned no cities");
                    return sortCities(cities);
                })
                .catch(err => {
                    console.error("Failed to load cities, using the built-in list:", err);
                    return sortCities(FALLBACK.map(c => ({ ...c, count: null })));
                });
        }
        return citiesPromise;
    }

    function loadOnlineLevelId() {
        return fetchLevels("online")
            .then(levels => (levels.find(l => l.name === "Online") || {})._id || FALLBACK_ONLINE_LEVEL_ID)
            .catch(err => {
                console.error("Failed to load online level:", err);
                return FALLBACK_ONLINE_LEVEL_ID;
            });
    }

    window.Cities = { load, loadOnlineLevelId, COUNTRY_ORDER };
})();

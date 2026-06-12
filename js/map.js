const members = [
    { city: "Bangkok", lat: 13.7563, lng: 100.5018 },
    { city: "Nonthaburi", lat: 13.8591, lng: 100.5217 },
    { city: "Chiang Mai", lat: 18.7883, lng: 98.9853 },
    { city: "Vientiane", lat: 17.9757, lng: 102.6331 }, // Laos
    { city: "Lampang", lat: 18.2888, lng: 99.4908 },
    { city: "Phuket", lat: 7.8804, lng: 98.3923 },
    { city: "Nakhon Si Thammarat", lat: 8.4304, lng: 99.9631 },
    { city: "Maha Sarakham", lat: 16.1848, lng: 103.3007 },

    { city: "Beijing", lat: 39.9042, lng: 116.4074 },
    { city: "Shanghai", lat: 31.2304, lng: 121.4737 },
    { city: "Kunming", lat: 25.0389, lng: 102.7183 },
    { city: "Chengdu", lat: 30.5728, lng: 104.0668 },
    { city: "Wuhan", lat: 30.5928, lng: 114.3055 },
    { city: "Changsha", lat: 28.2282, lng: 112.9388 },
    { city: "Xi'an", lat: 34.3416, lng: 108.9398 },
    { city: "Suzhou", lat: 31.2989, lng: 120.5853 },
    { city: "Tianjin", lat: 39.3434, lng: 117.3616 },
    { city: "Guangzhou", lat: 23.1291, lng: 113.2644 },
    { city: "Chongqing", lat: 29.5630, lng: 106.5516 },
    { city: "Guangxi (Nanning)", lat: 22.8170, lng: 108.3669 },
    { city: "Hainan (Haikou)", lat: 20.0440, lng: 110.1999 },
    { city: "Fujian (Fuzhou)", lat: 26.0745, lng: 119.2965 },
    { city: "Taipei", lat: 25.0330, lng: 121.5654 }, // Taiwan
    { city: "Hangzhou", lat: 30.2741, lng: 120.1551 }, // China
    { city: "Shandong (Jinan)", lat: 36.6512, lng: 117.1201 },
    { city: "Heilongjiang (Harbin)", lat: 45.8038, lng: 126.5350 },

    { city: "Kuala Lumpur", lat: 3.1390, lng: 101.6869 }, // Malaysia
    { city: "Singapore", lat: 1.3521, lng: 103.8198 },
    { city: "Tokyo", lat: 35.6762, lng: 139.6503 }, // Japan
    { city: "Manila", lat: 14.5995, lng: 120.9842 }, // Philippines

    { city: "London", lat: 51.5072, lng: -0.1276 },
    { city: "Nottingham", lat: 52.9548, lng: -1.1581 },

    { city: "Washington DC", lat: 38.9072, lng: -77.0369 },
    { city: "New York City", lat: 40.7128, lng: -74.0060 },
    { city: "Oregon (Portland)", lat: 45.5152, lng: -122.6784 },
    { city: "Caribbean", lat: 18.2208, lng: -66.5901 },
    { city: "Florida (Miami)", lat: 25.7617, lng: -80.1918 }, // USA

    { city: "Amsterdam", lat: 52.3676, lng: 4.9041 }, // Netherlands
    { city: "Paris", lat: 48.8566, lng: 2.3522 }, // France
    { city: "Buenos Aires", lat: -34.6037, lng: -58.3816 }, // Argentina
    { city: "Sydney", lat: -33.8688, lng: 151.2093 }, // Australia,
    { city: "Melbourne", lat: -37.8136, lng: 144.9631 },
    { city: "Malé", lat: 4.1755, lng: 73.5093 }, // Maldives
    { city: "Toronto", lat: 43.6532, lng: -79.3832 },
    { city: "Saint Petersburg", lat: 59.9311, lng: 30.3609 },
    { city: "Auckland", lat: -36.8509, lng: 174.7645 },
    { city: "Tokyo", lat: 35.6762, lng: 139.6503 },
    { city: "Hokkaido (Sapporo)", lat: 43.0618, lng: 141.3545 },
    { city: "Shenzhen", lat: 22.5431, lng: 114.0579 },
    { city: "Montreal", lat: 45.5019, lng: -73.5674 },
    { city: "Frankfurt", lat: 50.1109, lng: 8.6821 },
    { city: "Yerevan", lat: 40.1792, lng: 44.4991 }, // Armenia
    { city: "Oslo", lat: 59.9139, lng: 10.7522 }, // Norway
    { city: "Henan (Zhengzhou)", lat: 34.7466, lng: 113.6254 },
    { city: "Anhui (Hefei)", lat: 31.8206, lng: 117.2272 },
    { city: "Hong Kong", lat: 22.3193, lng: 114.1694 },
    { city: "Tehran", lat: 35.6892, lng: 51.3890 }, // Iran
    { city: "Hamburg", lat: 53.5507, lng: 9.9930 }, // Germany
    { city: "Mandalay", lat: 21.9747, lng: 96.0836 }, // Myanmar
    { city: "Yangon", lat: 16.8053, lng: 96.1561 }, // Myanmar
    { city: "Xinjiang (Urumqi)", lat: 43.8256, lng: 87.6168 },
    { city: "Istanbul", lat: 41.0082, lng: 28.9784 }, // Turkey,
    { city: "Los Angeles", lat: 34.0522, lng: -118.2437 }, // USA
    { city: "San Jose", lat: 37.3382, lng: -121.8863 }, // USA
    { city: "Delhi", lat: 28.6139, lng: 77.2090 }, // India
    { city: "Jaipur", lat: 26.9124, lng: 75.7873 }, // India
];

// Create map
const map = L.map('map').setView([-30, 40], 1);

// OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Add markers
members.forEach(member => {
    L.marker([member.lat, member.lng])
        .addTo(map)
        .bindPopup(`📍 ${member.city}`);
});

function goBack() {
    window.history.back();
}
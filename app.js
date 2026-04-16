
const endpoints = [
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter'
];

function fetchWithTimeout(url, options, timeout = 12000) {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), timeout)
        )
    ]);
}

async function fetchOverpass(query) {
    for (const url of endpoints) {
        try {
            console.log('Trying:', url);

            const res = await fetchWithTimeout(url, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: query
            });

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            const data = await res.json();
            console.log('Success with:', url);
            return data;

        } catch (err) {
            console.warn('Failed:', url, err);
            await new Promise(r => setTimeout(r, 300));
        }
    }

    throw new Error('All Overpass endpoints failed');
}

const map = L.map('map').setView([52.52, 13.405], 14);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);

// Standort holen
navigator.geolocation.getCurrentPosition(pos => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    map.setView([lat, lon], 10);

    L.marker([lat, lon]).addTo(map)
        .bindPopup('Du bist hier')
        .openPopup();

    const query = `
[out:json];
(
  node(around:10000,${lat},${lon})["amenity"="parking_space"]["parking_space"="disabled"];
  way(around:10000,${lat},${lon})["amenity"="parking_space"]["parking_space"="disabled"];
  relation(around:10000,${lat},${lon})["amenity"="parking_space"]["parking_space"="disabled"];
  node(around:10000,${lat},${lon})["amenity"="parking"]["capacity:disabled"];
  way(around:10000,${lat},${lon})["amenity"="parking"]["capacity:disabled"];
  relation(around:10000,${lat},${lon})["amenity"="parking"]["capacity:disabled"];
);
out center;
`;

    fetchOverpass(query)
        .then(data => {
            data.elements.forEach(el => {
                let lat, lon;
                if (el.type === 'node') {
                    lat = el.lat;
                    lon = el.lon;
                } else if (el.center) {
                    lat = el.center.lat;
                    lon = el.center.lon;
                }

                if (lat && lon) {
                    const isDisabledSpace = el.tags?.parking_space === 'disabled';
                    let parkingDescription = 'Access: ' + el.tags.access;
                    if (!isDisabledSpace) {
                        parkingDescription += '<br/>Capacity: ' + el.tags['capacity:disabled'];
                    }
                    const icon = L.divIcon({
                        html: isDisabledSpace ? "♿" : "🅿️",
                        className: "",
                        iconSize: [20, 20]
                    });
                    L.marker([lat, lon], { icon } ).addTo(map)
                        .bindPopup(parkingDescription);
                }
            });
            document.getElementById('loading').style.display = 'none';
        });
});

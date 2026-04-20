async function loadConfig(pathToConfigFile) {
    try {
        const res = await fetch(pathToConfigFile);

        if (!res.ok) {
            throw new Error(`Loading the config file failed: HTTP ${res.status}`);
        }

        config = await res.json();
        return config;

    } catch (err) {
        console.error('Loading data from the config file failed:', err);
        throw err;
    }
}

function showLoading() {
    document.getElementById('loading').classList.add('active');
}

function hideLoading() {
    document.getElementById('loading').classList.remove('active');
}

async function searchAddress(query) {
    showLoading();
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;

    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });

    if (!res.ok) {
        throw new Error(`Geocoding failed: HTTP ${res.status}`);
    }

    const data = await res.json();

    if (!data.length) {
        throw new Error('Adresse nicht gefunden');
    }

    hideLoading();
    return data[0];
}

function fetchWithTimeout(url, options, timeout = 12000) {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), timeout)
        )
    ]);
}

async function fetchOverpass(query, config) {

    for (const url of config.ENDPOINTS) {
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

function getCacheKey(lat, lon, radius) {
    return `parking_${lat.toFixed(3)}_${lon.toFixed(3)}_${radius}`;
}

async function fetchWithCache(lat, lon, radius, query, config) {
    if (config.USE_LOCAL_DATA) {
        const res = await fetch(config.LOCAL_DATA_SOURCE);

        return await res.json();
    }

    const key = getCacheKey(lat, lon, radius);

    const cached = localStorage.getItem(key);

    if (cached) {
        const parsed = JSON.parse(cached);

        // check expiry
        if (Date.now() - parsed.timestamp < config.CACHE_TIME_IN_MINUTES * 60 * 1000) {
            console.log('⚡ using cache');
            return parsed.data;
        }
    }

    console.log('🌐 fetching from API');

    const data = await fetchOverpass(query, config);

    localStorage.setItem(key, JSON.stringify({
        timestamp: Date.now(),
        data
    }));

    return data;
}



function capacityString(parkingObject) {
    if (parkingObject.tags?.parking_space === 'disabled') {
        return '▢';
    }

    const capacityDisabled = parseInt(parkingObject.tags?.['capacity:disabled']);
    if (!isNaN(capacityDisabled)) {
        return String(capacityDisabled);
    }

    return '?';
}

function iconCssClass(parkingObject) {
    const pre = 'marker-icon-';
    if (!parkingObject.tags.access) {
        return pre+'default';
    }
    if (['no', 'private'].includes(parkingObject.tags.access)) {
        return pre+'warning';
    }
    if (['yes'].includes(parkingObject.tags.access)) {
        return pre+'success';
    }

    return pre+'customers';
}

function parkingIcon(parkingObject) {

    const capacity = capacityString(parkingObject);
    const cssClass = iconCssClass(parkingObject);
    const icon = L.divIcon({
        className: cssClass,
        html: `
<svg width="36" height="48" viewBox="0 0 36 48">
  <!-- Pin shape -->
  <path d="M18 0C10 0 4 6 4 14c0 10 14 34 14 34s14-24 14-34C32 6 26 0 18 0z" fill="currentColor"/>

  <!-- Inner circle -->
  <circle cx="18" cy="14" r="10" fill="white"/>

  <!-- Text -->
  <text x="18" y="18" text-anchor="middle" font-size="10" fill="currentColor" font-weight="bold">
    ${capacity}
  </text>
</svg>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });

    return icon;
}

async function loadParkingData(lat, lon, radius, map, markerLayer, config) {
    showLoading();
    const query = `
[out:json];
(
  node(around:${radius},${lat},${lon})["amenity"="parking_space"]["parking_space"="disabled"];
  way(around:${radius},${lat},${lon})["amenity"="parking_space"]["parking_space"="disabled"];
  relation(around:${radius},${lat},${lon})["amenity"="parking_space"]["parking_space"="disabled"];
  node(around:${radius},${lat},${lon})["amenity"="parking"]["capacity:disabled"];
  way(around:${radius},${lat},${lon})["amenity"="parking"]["capacity:disabled"];
  relation(around:${radius},${lat},${lon})["amenity"="parking"]["capacity:disabled"];
);
out center;
`;

    const data = await fetchWithCache(lat, lon, radius, query, config);

    data.elements.forEach(parkingObject => {
        let pLat, pLon;

        if (parkingObject.type === 'node') {
            pLat = parkingObject.lat;
            pLon = parkingObject.lon;
        } else if (parkingObject.center) {
            pLat = parkingObject.center.lat;
            pLon = parkingObject.center.lon;
        }

        if (pLat && pLon) {
            const isDisabledSpace = parkingObject.tags?.parking_space === 'disabled';

            let parkingDescription = 'Access: ' + parkingObject.tags?.access;

            if (!isDisabledSpace) {
                parkingDescription += '<br/>Capacity: ' + parkingObject.tags?.['capacity:disabled'];
            }

            const icon = parkingIcon(parkingObject);

            L.marker([pLat, pLon], { icon })
                .addTo(markerLayer)
                .bindPopup(parkingDescription);
        }
    });

    hideLoading();
}

function addParkingMarkers(lat, lon, label, radius, map, markerLayer, config) {
    map.setView([lat, lon], 14);

    markerLayer.clearLayers();

    L.marker([lat, lon]).addTo(markerLayer)
        .bindPopup(label)
        .openPopup();

    loadParkingData(lat, lon, radius, map, markerLayer, config);
}



async function init() {
    const config = await loadConfig('app-config.json');
    const radius = config.DEFAULT_SEARCH_RADIUS;

    const map = L.map('map').setView([52.52, 13.405], 14);
    const markerLayer = L.layerGroup().addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);

    document.getElementById('locBtn').addEventListener('click', () => {
        navigator.geolocation.getCurrentPosition(
            pos => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                addParkingMarkers(lat, lon, 'Du bist hier', radius, map, markerLayer, config);
            },
            err => {
                alert('Standort konnte nicht abgerufen werden');
                console.error(err);
            }
        );
    });

    document.getElementById('searchBtn').addEventListener('click', async () => {
        const value = document.getElementById('search').value;
        const location = await searchAddress(value);
        const lat = parseFloat(location.lat);
        const lon = parseFloat(location.lon);
        addParkingMarkers(lat, lon, location.display_name, radius, map, markerLayer, config);
    });
}

init();

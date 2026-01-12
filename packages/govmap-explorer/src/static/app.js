// Initialize map
const map = L.map('map').setView([32.0853, 34.7818], 13); // Default to Tel Aviv

// Add Light tiles (CartoDB Positron)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

let currentMarker = null;

// --- Autocomplete Logic ---
let currentFocus = -1;
let searchTimeout = null;

function parseWKT(wkt) {
    if (!wkt) return null;
    const match = wkt.match(/POINT\s*\(([\d.]+)\s+([\d.]+)\)/);
    if (match) {
        const x = parseFloat(match[1]);
        const y = parseFloat(match[2]);
        const rMajor = 6378137;
        const shift = Math.PI * rMajor;
        const lon = x / shift * 180.0;
        let lat = y / shift * 180.0;
        lat = 180.0 / Math.PI * (2.0 * Math.atan(Math.exp(lat * Math.PI / 180.0)) - Math.PI / 2.0);
        return { x, y, lat, lon, system: 'WGS84' };
    }
    return null;
}

function handleDirectSelection(item) {
    let coords = parseWKT(item.shape);

    // Fallback if coordinates are raw X/Y
    if (!coords && item.x && item.y) {
        // Assume ITM if small numbers (not implemented here fully) or Web Mercator
        // But autocomplete usually returns shape WKT
        coords = { x: item.x, y: item.y };
    }

    // Update Result Card directly
    updateResultCard({
        query: item.text || item.name,
        address: item.text || item.name,
        coordinates: coords,
        type: item.type,
        municipality: item.municipality,
        district: item.district
    });

    // Update Map
    updateMap(coords);
}

async function fetchSuggestions(query) {
    if (!query || query.length < 2) return [];
    try {
        const response = await fetch('/api/suggestions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });
        return await response.json();
    } catch (e) {
        return [];
    }
}

function handleInput(inp) {
    const listId = inp.id + "-list";
    let list = document.getElementById(listId);

    // Clear previous timeout
    if (searchTimeout) clearTimeout(searchTimeout);

    // Debounce search
    searchTimeout = setTimeout(async () => {
        const val = inp.value;
        closeAllLists();
        if (!val) return false;

        currentFocus = -1;

        // Show temp list or loader?

        const suggestions = await fetchSuggestions(val);

        if (suggestions.length === 0) return;

        list.innerHTML = '';

        suggestions.forEach(item => {
            const div = document.createElement("div");
            div.className = "autocomplete-item";
            const text = item.address || item.name || item.text;

            // Highlight matching part
            const regex = new RegExp(`(${val})`, 'gi');
            div.innerHTML = text.replace(regex, '<strong>$1</strong>');
            div.innerHTML += `<input type='hidden' value='${text.replace(/'/g, "&apos;")}'>`;

            div.addEventListener("click", function (e) {
                inp.value = text;
                closeAllLists();
                handleDirectSelection(item);
            });
            list.appendChild(div);
        });
    }, 300); // 300ms debounce
}

function handleKey(e) {
    let list = document.getElementById(e.target.id + "-list");
    if (list) list = list.getElementsByTagName("div");
    if (e.keyCode == 40) { // DOWN
        currentFocus++;
        addActive(list);
    } else if (e.keyCode == 38) { // UP
        currentFocus--;
        addActive(list);
    } else if (e.keyCode == 13) { // ENTER
        e.preventDefault();
        if (currentFocus > -1) {
            if (list) list[currentFocus].click();
        } else {
            // Normal enter search
            if (e.target.id.includes('gush') || e.target.id.includes('helka')) {
                searchCadastral();
            } else {
                searchAddress();
            }
        }
    }
}

function addActive(x) {
    if (!x) return false;
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = (x.length - 1);
    x[currentFocus].classList.add("autocomplete-active");
}

function removeActive(x) {
    for (let i = 0; i < x.length; i++) {
        x[i].classList.remove("autocomplete-active");
    }
}

function closeAllLists(elmnt) {
    const lists = document.getElementsByClassName("autocomplete-items");
    for (let i = 0; i < lists.length; i++) {
        if (elmnt != lists[i] && elmnt != document.getElementById("address-input")) {
            lists[i].innerHTML = "";
        }
    }
}

document.addEventListener("click", function (e) {
    closeAllLists(e.target);
});


// --- Existing Logic ---

function handleEnter(event, callback) {
    if (event.key === 'Enter') {
        callback();
    }
}

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.input-group').forEach(group => group.classList.add('hidden'));

    const buttons = Array.from(document.querySelectorAll('.tab-btn'));
    const targetBtn = buttons.find(b => b.getAttribute('onclick').includes(tab));
    if (targetBtn) targetBtn.classList.add('active');

    document.getElementById(`tab-${tab}`).classList.remove('hidden');
}

function showLoader(show) {
    document.getElementById('loader').style.display = show ? 'block' : 'none';
    const card = document.getElementById('result-card');
    if (show) card.classList.remove('visible');
}

function updateResultCard(data) {
    const card = document.getElementById('result-card');

    document.getElementById('res-query').textContent = data.query || '-';
    document.getElementById('res-address').textContent = data.address || data.name || '-';

    // WGS84
    document.getElementById('res-lat').textContent = data.coordinates?.lat ? `LAT: ${data.coordinates.lat.toFixed(5)}` : 'LAT: -';
    document.getElementById('res-lon').textContent = data.coordinates?.lon ? `LON: ${data.coordinates.lon.toFixed(5)}` : 'LON: -';

    // ITM
    document.getElementById('res-x').textContent = data.coordinates?.x ? `X: ${data.coordinates.x.toFixed(2)}` : 'X: -';
    document.getElementById('res-y').textContent = data.coordinates?.y ? `Y: ${data.coordinates.y.toFixed(2)}` : 'Y: -';

    // Extra data
    const extraContainer = document.getElementById('extra-data');
    extraContainer.innerHTML = '';

    if (data.type === 'parcel' || (data.municipality || data.district)) {
        if (data.municipality) {
            extraContainer.innerHTML += `
                <div class="result-item">
                    <span class="result-label">MUNICIPALITY</span>
                    <div class="result-value">${data.municipality}</div>
                </div>`;
        }
        if (data.district) {
            extraContainer.innerHTML += `
                <div class="result-item">
                    <span class="result-label">DISTRICT</span>
                    <div class="result-value">${data.district}</div>
                </div>`;
        }
    }

    card.classList.add('visible');
}

function updateMap(coordinates) {
    if (currentMarker) map.removeLayer(currentMarker);

    if (coordinates && coordinates.lat && coordinates.lon) {
        const lat = parseFloat(coordinates.lat);
        const lon = parseFloat(coordinates.lon);

        currentMarker = L.marker([lat, lon]).addTo(map);
        map.flyTo([lat, lon], 17, {
            duration: 1.5
        });

        currentMarker.bindPopup("<b>Found Location</b><br>" + (coordinates.system || '')).openPopup();
    }
}

async function searchAddress() {
    const address = document.getElementById('address-input').value;
    if (!address) return;

    showLoader(true);

    try {
        const response = await fetch('/api/geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address })
        });

        const result = await response.json();

        // Parse tool output (Markdown)
        console.log("Raw result:", result);
        const text = result.content[0].text;

        if (text.includes("Error") || text.includes("No Results")) {
            alert('Address not found');
            return;
        }

        const latMatch = text.match(/Latitude:\*\* ([\d.]+)/);
        const lonMatch = text.match(/Longitude:\*\* ([\d.]+)/);
        const xMatch = text.match(/X \(ITM\):\*\* ([\d.]+)/);
        const yMatch = text.match(/Y \(ITM\):\*\* ([\d.]+)/);

        const coordinates = {
            lat: latMatch ? parseFloat(latMatch[1]) : null,
            lon: lonMatch ? parseFloat(lonMatch[1]) : null,
            x: xMatch ? parseFloat(xMatch[1]) : null,
            y: yMatch ? parseFloat(yMatch[1]) : null
        };

        updateResultCard({
            query: address,
            address: address, // In a real app we'd parse the found address from markdown too
            coordinates: coordinates
        });

        updateMap(coordinates);

    } catch (error) {
        console.error(error);
        alert('Search failed');
    } finally {
        showLoader(false);
    }
}

async function searchCadastral() {
    const gush = document.getElementById('gush-input').value;
    const helka = document.getElementById('helka-input').value;

    if (!gush) return;

    showLoader(true);

    try {
        const response = await fetch('/api/cadastral', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gush, helka })
        });

        const result = await response.json();
        const text = result.content[0].text;

        if (text.includes("Error") || text.includes("Not Found")) {
            // Extract error message if possible
            const match = text.match(/Error:\*\*\s*(.+)/) || text.match(/Not Found:\*\*\s*(.+)/);
            const msg = match ? match[1] : text;
            alert('Parcel Search Error:\n' + msg);
            return;
        }

        const latMatch = text.match(/Latitude:\*\* ([\d.]+)/);
        const lonMatch = text.match(/Longitude:\*\* ([\d.]+)/);
        const municipalMatch = text.match(/Municipality:\*\* ([^\n]+)/);
        const districtMatch = text.match(/District:\*\* ([^\n]+)/);

        const coordinates = {
            lat: latMatch ? parseFloat(latMatch[1]) : null,
            lon: lonMatch ? parseFloat(lonMatch[1]) : null
        };

        updateResultCard({
            query: `Gush ${gush} Helka ${helka}`,
            name: `Parcel ${gush}/${helka || '-'}`,
            coordinates: coordinates,
            municipality: municipalMatch ? municipalMatch[1] : null,
            district: districtMatch ? districtMatch[1] : null
        });

        updateMap(coordinates);

    } catch (error) {
        console.error(error);
        alert('Search failed');
    } finally {
        showLoader(false);
    }
}


// Map Click Handler
map.on('click', function (e) {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;
    L.popup()
        .setLatLng(e.latlng)
        .setContent(`<div style="text-align:center;"><strong>Selected Location</strong><br>Lat: ${lat.toFixed(5)}<br>Lon: ${lon.toFixed(5)}<br><hr style="margin: 5px 0; opacity: 0.2"><small>Address lookup requires<br>API authentication.</small></div>`)
        .openOn(map);
});

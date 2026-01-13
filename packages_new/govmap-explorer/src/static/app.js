// Initialize map
const map = L.map('map').setView([32.0853, 34.7818], 13); // Default to Tel Aviv

// --- Base Maps ---
const cartoLight = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap, © CARTO',
    subdomains: 'abcd',
    maxZoom: 20
});

const cartoDark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap, © CARTO',
    subdomains: 'abcd',
    maxZoom: 20
});

// Official GovMap Tiles (XYZ)
const govMapHeb = L.tileLayer('https://cdnil.govmap.gov.il/xyz/heb/{z}/{x}/{y}.png', {
    attribution: '© GovMap (Survey of Israel)',
    maxZoom: 20
});

const govMapEng = L.tileLayer('https://cdnil.govmap.gov.il/xyz/eng/{z}/{x}/{y}.png', {
    attribution: '© GovMap (Survey of Israel)',
    maxZoom: 20
});

// --- Overlays (WMS) ---
const parcelsWms = L.tileLayer.wms('https://open.govmap.gov.il/geoserver/opendata/wms', {
    layers: 'PARCEL_ALL',
    format: 'image/png',
    transparent: true,
    attribution: '© Survey of Israel'
});

const tabaWms = L.tileLayer.wms('https://open.govmap.gov.il/geoserver/opendata/wms', {
    layers: 'taba_tso_zones',
    format: 'image/png',
    transparent: true,
    opacity: 0.6,
    attribution: '© Planning Admin'
});

const schoolsWms = L.tileLayer.wms('https://open.govmap.gov.il/geoserver/opendata/wms', {
    layers: 'layer_217362', // Schools
    format: 'image/png',
    transparent: true,
    attribution: '© Ministry of Education'
});

const hospitalsWms = L.tileLayer.wms('https://open.govmap.gov.il/geoserver/opendata/wms', {
    layers: 'emergancy_hospitals', // Hospitals
    format: 'image/png',
    transparent: true,
    attribution: '© Ministry of Health'
});

// Add Default Layers
cartoLight.addTo(map);

// Move Zoom Control to Bottom-Right
map.zoomControl.remove();
L.control.zoom({ position: 'bottomright' }).addTo(map);

// Layer Control
const baseMaps = {
    "Map (Light)": cartoLight,
    "Map (Dark)": cartoDark,
    "GovMap (Hebrew)": govMapHeb,
    "GovMap (English)": govMapEng
};

const overlayMaps = {
    "Gush/Helka (Parcels)": parcelsWms,
    "Planning (Taba)": tabaWms,
    "Schools (בתי ספר)": schoolsWms,
    "Hospitals (בתי חולים)": hospitalsWms
};

L.control.layers(baseMaps, overlayMaps, { position: 'bottomright' }).addTo(map);

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

// --- I18n Logic ---

let currentLang = 'he';

function changeLanguage(lang) {
    currentLang = lang;
    const t = translations[lang];
    if (!t) return;

    // Update Text Elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.textContent = t[key];
    });

    // Update Placeholders
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
        const key = el.getAttribute('data-i18n-ph');
        if (t[key]) el.placeholder = t[key];
    });

    // Update Direction
    const isRtl = ['he', 'ar'].includes(lang);
    document.body.dir = isRtl ? 'rtl' : 'ltr';
    document.querySelector('.sidebar').style.right = isRtl ? '20px' : 'auto';
    document.querySelector('.sidebar').style.left = isRtl ? 'auto' : '20px';

    // Update Map Attribution (optional)

    // Close lists
    closeAllLists();
}

// Override Init
document.addEventListener('DOMContentLoaded', () => {
    changeLanguage('he'); // Default
});

// --- UI Logic ---

// Switch Main Category
function switchCategory(cat) {
    // Update Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        // Simple check if onclick contains the cat
        if (btn.getAttribute('onclick')?.includes(`'${cat}'`)) btn.classList.add('active');
    });

    // Hide all categories
    document.querySelectorAll('.category-group').forEach(el => el.classList.add('hidden'));

    // Show selected category
    const targetCat = document.getElementById(`cat-${cat}`);
    if (targetCat) targetCat.classList.remove('hidden');

    // Clear Results
    document.getElementById('result-card').classList.remove('visible');
    document.getElementById('markdown-result').classList.add('hidden');
    document.getElementById('markdown-result').innerHTML = '';
}

// Switch Sub-Tab (Geospatial specific)
function switchSubTab(tab) {
    document.querySelectorAll('.tab-link').forEach(btn => btn.classList.remove('active'));
    // Find button
    const buttons = Array.from(document.querySelectorAll('.tab-link'));
    const targetBtn = buttons.find(b => b.getAttribute('onclick')?.includes(`'${tab}'`));
    if (targetBtn) targetBtn.classList.add('active');

    // Hide inputs
    document.getElementById('tab-address').classList.add('hidden');
    document.getElementById('tab-cadastral').classList.add('hidden');

    // Show target
    document.getElementById(`tab-${tab}`).classList.remove('hidden');
}

// Render Simple Markdown (Headers, Tables, Bold)
function renderMarkdown(text) {
    if (!text) return '';
    let html = text
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/\*\*(.*)\*\*/gim, '<b>$1</b>')
        .replace(/\n/gim, '<br>');

    // Simple Table Parsing
    if (text.includes('|')) {
        const lines = text.split('\n').filter(l => l.trim().startsWith('|'));
        if (lines.length > 0) {
            let table = '<table>';
            lines.forEach((line, index) => {
                const cols = line.split('|').filter(c => c.trim() !== '').map(c => c.trim());
                if (line.includes('---')) return; // Skip separator line

                table += '<tr>';
                cols.forEach(col => {
                    const tag = (index === 0) ? 'th' : 'td';
                    // Clean Bold inside cells if not handled
                    const content = col.replace(/\*\*(.*)\*\*/gim, '<b>$1</b>');
                    table += `<${tag}>${content}</${tag}>`;
                });
                table += '</tr>';
            });
            table += '</table>';
            // Replace the block of table lines with the HTML table
            // This is a naive replacement, basically replacing the whole text if it's mostly a table
            // For now, let's just append the table if found? 
            // Better: If we built a table, let's blindly return it if the text was "table heavy".
            // But let's mix it. 
            // Re-render strategy: Just use the HTML we built for lines that were tables.
            // (Simplified for demo)
            return html.includes('|') ? html.replace(/\|.*\|/s, table) : html; // Regex fail likely on multi-line.
            // Fallback: Just return the table HTML if we found a valid one, otherwise raw.
            return table + (html.replace(/\|.*\|/g, ''));
        }
    }
    return html;
}

// Improved Renderer
function displayMarkdownResult(text) {
    const container = document.getElementById('markdown-result');
    container.innerHTML = '';

    if (!text) return; // Guard clause

    // Naive Markdown to HTML
    let html = text
        .replace(/\n/g, '<br>')

        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

    // Handle Tables
    if (text.includes('|')) {
        const rows = text.split('\n').filter(row => row.trim().startsWith('|'));
        if (rows.length > 2) {
            let tableHtml = '<table>';
            rows.forEach((row, i) => {
                if (row.includes('---')) return;
                const cells = row.split('|').filter(c => c.trim());
                tableHtml += '<tr>';
                cells.forEach(cell => {
                    tableHtml += `<td>${cell.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')}</td>`;
                });
                tableHtml += '</tr>';
            });
            tableHtml += '</table>';
            html = html.replace(/\|.*\|/g, ''); // Remove raw lines
            html += tableHtml; // Append rendered table
        }
    }

    // Link Parsing: [text](url) -> <a href="..." target="_blank">
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" style="color:#60a5fa; text-decoration:underline;">$1</a>');

    // Enhance Resource Links with Preview Buttons
    // Pattern: - [CSV] Name (ID: 1234)
    const resourceRegex = /-\s+\[(.*?)\]\s+(.*?)\s+\(ID:\s+([a-zA-Z0-9-]+)\)/gi;
    html = html.replace(resourceRegex, (match, format, name, id) => {
        // Escape name for quotes
        const safeName = name.replace(/'/g, "\\'");
        // Use Direct Link (Proxy blocked by WAF)
        const downloadUrl = `https://data.gov.il/resource/${id}/download`;

        return `
        <div class="resource-row" style="margin-left: 20px; margin-bottom: 4px; display: flex; align-items: center; gap: 10px;">
            <a href="${downloadUrl}" target="_blank" class="badge" 
               style="background:#0f172a; border: 1px solid #334155; cursor:pointer; text-decoration:none; display:flex; align-items:center; gap:4px;"
               title="Download File">
               <span style="opacity:0.7">⬇</span> ${format}
            </a>
            <span style="flex:1">${name}</span>
            <button class="btn-secondary" style="padding: 2px 8px; font-size: 11px; margin:0;" onclick="previewResource('${id}', '${safeName}')">Preview 👁️</button>
        </div>`;
    });

    container.innerHTML = html;
    container.classList.remove('hidden');
    document.getElementById('result-card').classList.remove('visible'); // Hide map card
}

// Store active category for "Back" functionality
let activeTransportCategory = 'all';

// Add CSS for Modal
const modalStyle = document.createElement('style');
modalStyle.textContent = `
.preview-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    height: 90%;
    background: var(--bg-card);
    z-index: 2000;
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
    display: flex;
    flex-direction: column;
    padding: 0;
    overflow: hidden;
}
.preview-header {
    padding: 15px;
    background: rgba(0,0,0,0.2);
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.preview-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    color: var(--text-primary);
}
.preview-overlay {
    position: fixed;
    top: 0; 
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.7);
    z-index: 1999;
}
`;
document.head.appendChild(modalStyle);

function closePreviewModal() {
    const modal = document.getElementById('preview-modal');
    const overlay = document.getElementById('preview-overlay');
    if (modal) modal.remove();
    if (overlay) overlay.remove();
}

// Client-side table filter
function filterPreviewTable(query) {
    const container = document.querySelector('.preview-content');
    if (!container) return;

    // Filter rows in table
    const rows = container.querySelectorAll('tr');
    if (rows.length > 0) {
        rows.forEach((row, index) => {
            if (index === 0) return; // Skip header
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
        });
    }

    // Filter generic text blocks (paragraphs)
    // const paras = container.querySelectorAll('p, div, li');
    // paras.forEach(p => {
    //     if (p.textContent.toLowerCase().includes(query.toLowerCase())) {
    //        p.style.display = ''; 
    //     } else {
    //        // p.style.display = 'none'; // Dangerous for layout
    //     }
    // });
}

async function previewResource(resourceId, name = '', limit = 100, offset = 0) {
    console.log('Preview requested for:', resourceId, name);
    showLoader(true);

    try {
        const url = `/api/gov/transport?resource_id=${resourceId}&limit=${limit}&offset=${offset}`;
        const response = await fetch(url);
        const result = await response.json();

        if (result.content && result.content[0].text) {
            let htmlContent = result.content[0].text;
            const meta = result._meta;

            // Check if Modal exists, otherwise create
            let modal = document.getElementById('preview-modal');
            let overlay = document.getElementById('preview-overlay');

            if (!modal) {
                overlay = document.createElement('div');
                overlay.id = 'preview-overlay';
                overlay.className = 'preview-overlay';
                overlay.onclick = closePreviewModal;

                modal = document.createElement('div');
                modal.id = 'preview-modal';
                modal.className = 'preview-modal';

                document.body.appendChild(overlay);
                document.body.appendChild(modal);
            }

            // Header with Search & Info
            const safeName = name || 'Dataset Preview';

            let paginationHtml = '';
            let countInfo = '';

            if (meta) {
                const total = meta.total;
                const currentCount = meta.count;
                const nextOffset = offset + limit;
                const prevOffset = Math.max(0, offset - limit);
                countInfo = `<span style="font-size:12px; opacity:0.7; margin-left:10px;">(${offset}-${offset + currentCount} of ${total})</span>`;

                paginationHtml = `
                    <div style="display: flex; gap: 5px; margin-left: auto; align-items: center;">
                         <input type="text" placeholder="🔍 Find in file..." 
                            onkeyup="filterPreviewTable(this.value)"
                            style="padding: 4px 8px; border-radius: 4px; border: 1px solid #555; background: #222; color: white;">
                            
                        <button class="btn-secondary" style="margin:0" ${offset === 0 ? 'disabled' : ''} 
                            onclick="previewResource('${resourceId}', '${name}', ${limit}, ${prevOffset})">⬅ Prev</button>
                        <button class="btn-secondary" style="margin:0" ${nextOffset >= total ? 'disabled' : ''} 
                            onclick="previewResource('${resourceId}', '${name}', ${limit}, ${nextOffset})">Next ➡</button>
                    </div>
                 `;
            } else {
                // Non-tabular or no pagination meta
                paginationHtml = `
                    <div style="margin-left: auto;">
                        <input type="text" placeholder="🔍 Find in text..." 
                            onkeyup="filterPreviewTable(this.value)"
                            style="padding: 4px 8px; border-radius: 4px; border: 1px solid #555; background: #222; color: white;">
                    </div>`;
            }

            modal.innerHTML = `
                <div class="preview-header">
                    <div style="display:flex; flex-direction:column;">
                        <span style="font-weight:bold; font-size:16px;">${safeName}</span>
                        <span style="font-size:11px; opacity:0.6;">ID: ${resourceId} ${countInfo}</span>
                    </div>
                    ${paginationHtml}
                    <button class="btn-secondary" style="margin-left: 10px; background: #ef4444; border-color: #ef4444;" onclick="closePreviewModal()">✖ Close</button>
                </div>
                <div class="preview-content" id="modal-content"></div>
             `;

            // Render Markdown Content into Modal
            const contentContainer = modal.querySelector('#modal-content');
            const mdHtml = renderMarkdown(htmlContent);

            // Handle Table Rendering Logic Reuse
            let finalHtml = mdHtml;
            if (mdHtml.includes('<table>')) {
                // Naive table styling
                finalHtml = finalHtml.replace('<table>', '<table style="width:100%; border-collapse: collapse; font-size:13px;">');
                finalHtml = finalHtml.replace(/<th/g, '<th style="text-align:left; padding:8px; border-bottom:1px solid #555; background:rgba(255,255,255,0.05);"');
                finalHtml = finalHtml.replace(/<td/g, '<td style="padding:8px; border-bottom:1px solid #333;"');
            }

            contentContainer.innerHTML = finalHtml;

        } else {
            alert('Preview failed: No content');
        }
    } catch (e) {
        console.error('Fetch error:', e);
        alert('Error: ' + e.message);
    } finally {
        showLoader(false);
    }
}


// --- API Calls ---

async function callApi(url, method, body) {
    showLoader(true);
    try {
        const options = {
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (body) options.body = JSON.stringify(body);

        const response = await fetch(url, options);
        const result = await response.json();

        if (result.content && result.content[0].text) {
            displayMarkdownResult(result.content[0].text);
        } else {
            displayMarkdownResult(JSON.stringify(result, null, 2));
        }
    } catch (error) {
        displayMarkdownResult(`❌ Error: ${error.message}`);
    } finally {
        showLoader(false);
    }
}

function searchFinance() {
    const symbol = document.getElementById('finance-symbol').value;
    if (!symbol) return;
    callApi('/api/finance/tase', 'POST', { symbol });
}

function getRates() {
    callApi('/api/finance/rates', 'GET');
}

function getEmergencyAlerts() {
    callApi('/api/gov/alerts', 'GET');
}

function searchCourt() {
    const courtType = document.getElementById('court-select').value;
    callApi('/api/judicial/court', 'POST', { courtType });
    // Note: The backend now expects courtType to be mapped to court_type
}

// Transport Logic
function loadTransport(category) {
    // Highlight sub-tab
    document.querySelectorAll('#cat-transport .tab-link').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick')?.includes(`'${category}'`)) btn.classList.add('active');
    });

    callApi(`/api/gov/transport?category=${category}`, 'GET');
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

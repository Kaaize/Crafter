const container = document.getElementById('map-container');
const content = document.getElementById('map-content');
const canvas = document.getElementById('map-canvas');
const ctx = canvas.getContext('2d');
const loading = document.getElementById('map-loading');
const cursorDisplay = document.getElementById('cursor-coords');
const vectorListEl = document.getElementById('vector-list');

// Map Config
const GLOBAL_OFFSET_X = 2816;
const GLOBAL_OFFSET_Y = 3136;

let scale = 1;
let pannedX = 0;
let pannedY = 0;
let isDragging = false;
let startX, startY;

const mapImage = new Image();
mapImage.src = "./minimap_final.png";

// List of vectors
let vectors = [];

// Fallback: Generate from OTMM if PNG fails
// Fallback: Generate from OTMM if PNG fails
// Fallback: Generate from OTMM if PNG fails
mapImage.onerror = async () => {
    loading.textContent = "Image missing. Generating from 'minimap.otmm'...";
    loading.style.color = "#FFC107"; // Warning Yellow
    const status = document.getElementById('status');
    status.textContent = "Generating map from OTMM...";

    try {
        const loader = new OTMMLoader();
        let result;

        // Define Valid Bounds to prevent Out of Memory
        const bounds = {
            minX: 2792,
            minY: 3124,
            maxX: 4821,
            maxY: 6465
        };

        if (typeof MINIMAP_OTMM_BASE64 !== 'undefined') {
            status.textContent = "Using embedded OTMM data...";
            // Wait a tick to let the UI update
            await new Promise(r => setTimeout(r, 10));
            const buffer = loader.base64ToArrayBuffer(MINIMAP_OTMM_BASE64);
            result = await loader.parseAndRender(buffer, canvas, (msg) => {
                loading.textContent = msg;
            }, bounds);
        } else {
            // Try fetching (will likely fail on local file:// but safe to keep)
            result = await loader.loadAndRender('./minimap.otmm', canvas, (msg) => {
                loading.textContent = msg;
            }, bounds);
        }

        content.style.width = canvas.width + 'px';
        content.style.height = canvas.height + 'px';

        // Recenter view
        const viewportW = container.clientWidth;
        const viewportH = container.clientHeight;
        pannedX = (viewportW - canvas.width) / 2;
        pannedY = (viewportH - canvas.height) / 2;
        scale = 0.8;

        updateTransform();

        // Hide loading
        loading.style.display = 'none';
        status.textContent = "Map generated from OTMM.";
        status.style.color = "#4CAF50";

        // Set src to dataURL
        const dataURL = canvas.toDataURL();
        mapImage.src = dataURL;
        mapImage.onload = () => {
            // We need to support global offset adjustments if the user wants accurate coords.
            // But for now, we just display the cropped map.
            initMap();
        };

    } catch (err) {
        console.error(err);
        loading.textContent = "Failed to generate map from OTMM.";
        loading.style.color = "#ff5555";
        status.textContent = "Error: " + err.message;
    }
};

mapImage.onload = () => {
    initMap();
};

function initMap() {
    loading.style.display = 'none';
    canvas.width = mapImage.naturalWidth;
    canvas.height = mapImage.naturalHeight;
    content.style.width = canvas.width + 'px';
    content.style.height = canvas.height + 'px';

    const viewportW = container.clientWidth;
    const viewportH = container.clientHeight;
    pannedX = (viewportW - canvas.width) / 2;
    pannedY = (viewportH - canvas.height) / 2;
    scale = 0.8;

    updateTransform();
    renderCanvas();
}

function renderCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(mapImage, 0, 0);

    // Draw ALL vectors
    vectors.forEach(v => {
        drawVectorOnCanvas(v);
    });
}

function drawVectorOnCanvas(data) {
    const { localX, localY, angle1, angle2 } = data;

    ctx.save();

    // --- 1. Vector Boundaries (The "V" Shape) ---
    const maxLen = Math.max(canvas.width, canvas.height) * 2;
    const x1 = localX + Math.cos(angle1) * maxLen;
    const y1 = localY + Math.sin(angle1) * maxLen;
    const x2 = localX + Math.cos(angle2) * maxLen;
    const y2 = localY + Math.sin(angle2) * maxLen;

    ctx.beginPath();
    ctx.moveTo(localX, localY);
    ctx.lineTo(x1, y1);
    ctx.moveTo(localX, localY);
    ctx.lineTo(x2, y2);

    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.setLineDash([]);
    ctx.stroke();

    // --- 2. Distance Markers (Clipped Squares) ---
    // Distances: 30 and 500
    const distances = [
        { r: 30, color: "black" },
        { r: 500, color: "black" }
    ];

    // Setup Clip Region (The Cone)
    ctx.beginPath();
    ctx.moveTo(localX, localY);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.closePath();
    ctx.clip(); // <--- Only draw things inside the V

    // Draw Squares
    distances.forEach(d => {
        const r = d.r;
        ctx.beginPath();
        // Draw full square centered at origin
        ctx.rect(localX - r, localY - r, r * 2, r * 2);

        ctx.lineWidth = 1;
        ctx.strokeStyle = d.color;
        ctx.setLineDash([2, 2]); // Fine dots
        ctx.stroke();
    });

    ctx.restore(); // Restore clip (and context stack)

    // --- 3. Center Marker (X) ---
    // Drawn AFTER restore so it's not clipped/affected
    ctx.save();
    const markSize = 4;
    ctx.beginPath();
    ctx.moveTo(localX - markSize, localY - markSize);
    ctx.lineTo(localX + markSize, localY + markSize);
    ctx.moveTo(localX + markSize, localY - markSize);
    ctx.lineTo(localX - markSize, localY + markSize);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "black";
    ctx.setLineDash([]);
    ctx.stroke();
    ctx.restore();
}

// ... (Transform/Clamp/Interaction functions remain same) ...

function updateTransform() {
    clampPosition();
    content.style.transform = `translate(${pannedX}px, ${pannedY}px) scale(${scale})`;
}

function clampPosition() {
    const viewportW = container.clientWidth;
    const viewportH = container.clientHeight;
    const w = canvas.width * scale;
    const h = canvas.height * scale;
    if (w <= viewportW) { pannedX = (viewportW - w) / 2; }
    else { const minX = viewportW - w; if (pannedX < minX) pannedX = minX; if (pannedX > 0) pannedX = 0; }
    if (h <= viewportH) { pannedY = (viewportH - h) / 2; }
    else { const minY = viewportH - h; if (pannedY < minY) pannedY = minY; if (pannedY > 0) pannedY = 0; }
}

// ... (Mouse events remain same) ...
container.addEventListener('mousedown', (e) => { e.preventDefault(); isDragging = true; startX = e.clientX - pannedX; startY = e.clientY - pannedY; });
window.addEventListener('mousemove', (e) => {
    updateCursorCoords(e);
    if (!isDragging) return; e.preventDefault(); pannedX = e.clientX - startX; pannedY = e.clientY - startY; updateTransform();
});
window.addEventListener('mouseup', () => { isDragging = false; });
container.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const contentX = (mouseX - pannedX) / scale;
    const contentY = (mouseY - pannedY) / scale;
    const delta = -Math.sign(e.deltaY);
    let newScale = scale * (delta > 0 ? 1.1 : 0.9);
    if (newScale < 0.1) newScale = 0.1; if (newScale > 10) newScale = 10;
    pannedX = mouseX - contentX * newScale;
    pannedY = mouseY - contentY * newScale;
    scale = newScale;
    updateTransform();
    updateCursorCoords(e);
});

// ... (Cursor Coords / Paste remain same) ...
function updateCursorCoords(e) {
    if (!canvas.width) return;
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const localX = Math.floor((mouseX - pannedX) / scale);
    const localY = Math.floor((mouseY - pannedY) / scale);
    const globalX = localX + GLOBAL_OFFSET_X;
    const globalY = localY + GLOBAL_OFFSET_Y;
    if (localX >= 0 && localX < canvas.width && localY >= 0 && localY < canvas.height) {
        cursorDisplay.textContent = `X: ${globalX}\nY: ${globalY}\nZ: 7`;
        cursorDisplay.style.color = "#4CAF50";
    } else {
        cursorDisplay.textContent = `Out of bounds`;
        cursorDisplay.style.color = "#888";
    }
}

async function pasteCoords() {
    const status = document.getElementById('status');
    try {
        const text = await navigator.clipboard.readText();
        const regex = /(?:X[:\s]*)?(\d+)[^0-9]+(?:Y[:\s]*)?(\d+)[^0-9]+(?:Z[:\s]*)?(\d+)/i;
        const match = text.match(regex);
        if (match) {
            document.getElementById('input-x').value = match[1];
            document.getElementById('input-y').value = match[2];
            document.getElementById('input-z').value = match[3];
            status.textContent = "Pasted: " + match[0];
            status.style.color = "#4CAF50";
        } else {
            const regex2 = /(\d+)[^0-9]+(\d+)/;
            const match2 = text.match(regex2);
            if (match2) {
                document.getElementById('input-x').value = match2[1];
                document.getElementById('input-y').value = match2[2];
                status.textContent = "Pasted X, Y";
                status.style.color = "#ccc";
            } else {
                status.textContent = "No coords found.";
                status.style.color = "#ff5555";
            }
        }
    } catch (err) { status.textContent = "Paste error"; }
}

// --- NEW Multi-Vector Logic ---
function addVector() {
    const status = document.getElementById('status');
    const inputX = parseInt(document.getElementById('input-x').value);
    const inputY = parseInt(document.getElementById('input-y').value);
    const dir = document.getElementById('input-dir').value;
    status.style.color = "#ccc";

    if (isNaN(inputX) || isNaN(inputY)) {
        status.textContent = "Invalid coordinates!";
        return;
    }

    const localX = inputX - GLOBAL_OFFSET_X;
    const localY = inputY - GLOBAL_OFFSET_Y;

    if (localX < 0 || localX > canvas.width || localY < 0 || localY > canvas.height) {
        status.textContent = `Error: Coords out of bounds!`;
        status.style.color = "#ff5555";
        return;
    }

    status.textContent = `Added: ${inputX}, ${inputY} (${dir})`;
    status.style.color = "#4CAF50";

    const dirAngles = {
        'E': 0, 'SE': 45, 'S': 90, 'SW': 135,
        'W': 180, 'NW': 225, 'N': 270, 'NE': 315
    };

    const baseAngle = dirAngles[dir];
    const coneHalfAngle = 22.5;

    const rad1 = (baseAngle - coneHalfAngle) * (Math.PI / 180);
    const rad2 = (baseAngle + coneHalfAngle) * (Math.PI / 180);

    const length = Math.max(canvas.width, canvas.height) * 2;

    const x1 = localX + Math.cos(rad1) * length;
    const y1 = localY + Math.sin(rad1) * length;

    const x2 = localX + Math.cos(rad2) * length;
    const y2 = localY + Math.sin(rad2) * length;

    const newVector = {
        id: Date.now(),
        label: `(${inputX}, ${inputY}) ${dir}`,
        localX, localY, angle1: rad1, angle2: rad2, x1, y1, x2, y2
    };

    vectors.push(newVector);
    updateVectorList();
    renderCanvas();
}

function deleteVector(id) {
    vectors = vectors.filter(v => v.id !== id);
    updateVectorList();
    renderCanvas();
}

function updateVectorList() {
    vectorListEl.innerHTML = '';
    vectors.forEach(v => {
        const item = document.createElement('div');
        item.className = 'vector-item';

        const info = document.createElement('span');
        info.className = 'vector-info';
        info.textContent = v.label;

        const btn = document.createElement('button');
        btn.className = 'delete-btn';
        btn.textContent = 'X';
        btn.onclick = () => deleteVector(v.id);

        item.appendChild(info);
        item.appendChild(btn);
        vectorListEl.appendChild(item);
    });
}

function zoomIn() { scale *= 1.2; updateTransform(); }
function zoomOut() { scale /= 1.2; updateTransform(); }
function resetView() { initMap(); }

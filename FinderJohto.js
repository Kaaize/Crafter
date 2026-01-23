const container = document.getElementById('map-container');
const content = document.getElementById('map-content');
const canvas = document.getElementById('map-canvas');
const ctx = canvas.getContext('2d');
const loading = document.getElementById('map-loading');
const cursorDisplay = document.getElementById('cursor-coords');
const vectorListEl = document.getElementById('vector-list');

// Map Config
// Map Config
let GLOBAL_OFFSET_X = 1597;
let GLOBAL_OFFSET_Y = 29862;

// Floor Config
let currentFloor = 6;
let floorsData = null; // Stores parsed OTMM data { z: { blocks, minX... } }
const floorCache = new Map(); // Stores rendered contexts
let isMapLoading = false;

let scale = 1;
let pannedX = 0;
let pannedY = 0;
let isDragging = false;
let startX, startY;

const mapImage = new Image();
// List of vectors
let vectors = [];
// We won't set src immediately if we are going full preload mode, 
// to avoid the image loading race condition with our preload logic.
// But we can fallback to image if OTMM fails.
// Just keep it simple: Init triggers the preload.

// Fallback: Generate from OTMM if PNG fails is now the PRIMARY path for multi-floor
// consistency. We will try to load OTMM immediately on start.

window.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
    loading.style.display = 'block';
    loading.textContent = "Initializing Map Data...";

    try {
        const loader = new OTMMLoader();
        let buffer;

        if (typeof MINIMAP_OTMM_BASE64 !== 'undefined') {
            loading.textContent = "Parsing embedded OTMM...";
            buffer = loader.base64ToArrayBuffer(MINIMAP_OTMM_BASE64);
        } else {
            loading.textContent = "Fetching minimap.otmm...";
            const resp = await fetch('./minimap.otmm');
            if (!resp.ok) throw new Error("Failed to load OTMM");
            buffer = await resp.arrayBuffer();
        }

        // Parse ALL floors once
        loading.textContent = "Indexing floors...";
        // Give UI a moment to render
        await new Promise(r => setTimeout(r, 10));

        // Johto Bounds: 1597, 29862 to 4075, 31480
        const johtoBounds = {
            minX: 1597, maxX: 4075,
            minY: 29862, maxY: 31480
        };

        floorsData = await loader.parseAllFloors(buffer, (msg) => {
            loading.textContent = msg;
        }, johtoBounds);

        // Initial Load
        await loadFloor(currentFloor, false); // false = don't preserve view on first load

    } catch (err) {
        console.error("Init Error:", err);
        loading.innerHTML = `Error initializing map:<br>${err.message}<br><small>${err.stack}</small>`;
        loading.style.color = "#ff5555";
    }

    // Fallback to legacy PNG mode if OTMM fails completely? 
    // Or just show error since multi-floor depends on OTMM.
    // Let's rely on OTMM for consistency.
}

function updateFloorUI() {
    document.getElementById('input-z').value = currentFloor;
}

async function changeFloor(delta) {
    const newFloor = currentFloor + delta;
    if (floorsData && !floorsData[newFloor]) {
        // If we have data but this floor doesn't exist, check limits?
        // Or maybe just let it try?
        // Check if floor exists in data keys
        // if (!floorsData[newFloor]) return; 
        // But 0-15 are standard, maybe just empty.
        if (newFloor < 0 || newFloor > 15) return;
    } else {
        if (newFloor < 0 || newFloor > 15) return;
    }

    // 1. Capture Global Center
    const viewportW = container.clientWidth;
    const viewportH = container.clientHeight;

    // Valid mapping only if canvas exists
    let globalCenterX, globalCenterY;

    if (canvas.width > 0) {
        const localCenterX = (viewportW / 2 - pannedX) / scale;
        const localCenterY = (viewportH / 2 - pannedY) / scale;
        globalCenterX = localCenterX + GLOBAL_OFFSET_X;
        globalCenterY = localCenterY + GLOBAL_OFFSET_Y;
    }

    currentFloor = newFloor;
    updateFloorUI();

    await loadFloor(currentFloor, true, globalCenterX, globalCenterY);
}

async function loadFloor(z, preserveView, targetGlobalX, targetGlobalY) {
    if (isMapLoading) return;
    isMapLoading = true;
    loading.style.display = 'block';
    loading.textContent = `Rendering Floor ${z}...`;
    loading.style.color = "#FFC107"; // Yellow

    try {
        // If we don't have buckets yet (init failed?), can't do much
        if (!floorsData) throw new Error("Map data not loaded");

        let floorCtx = floorCache.get(z);

        if (!floorCtx) {
            // Render it
            const fd = floorsData[z];
            if (!fd) {
                console.warn(`Floor ${z} has no data! Floors found: ${Object.keys(floorsData)}`);
                // Empty floor
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                isMapLoading = false;
                return;
            }

            console.log(`Rendering Floor ${z}, Found ${fd.blocks.length} blocks. Bounds: ${fd.minX},${fd.minY} to ${fd.maxX},${fd.maxY}`);

            // Create canvas for this floor
            // Bounds
            const width = (fd.maxX - fd.minX) + 64;
            const height = (fd.maxY - fd.minY) + 64;

            const fCanvas = document.createElement('canvas');
            fCanvas.width = width;
            fCanvas.height = height;

            const loader = new OTMMLoader(); // Helper instance
            await loader.renderFloor(fd, fCanvas, (msg) => {
                loading.textContent = msg;
            });

            floorCtx = fCanvas.getContext('2d');
            floorCache.set(z, floorCtx);
        }

        // Apply to main canvas
        canvas.width = floorCtx.canvas.width;
        canvas.height = floorCtx.canvas.height;

        // Use our new unified redraw function to ensure vectors are drawn over the new floor
        redrawMap();

        // Update Map Config for this floor
        // We need minX/minY from the floorsData to set GLOBAL_OFFSET
        // Wait, cache just stores context. We need metadata.
        const fd = floorsData[z];
        if (fd) {
            GLOBAL_OFFSET_X = fd.minX;
            GLOBAL_OFFSET_Y = fd.minY;
        }

        // Update View
        content.style.width = canvas.width + 'px';
        content.style.height = canvas.height + 'px';

        if (preserveView && targetGlobalX !== undefined) {
            // Recalculate pannedX/Y to center on targetGlobalX/Y
            const viewportW = container.clientWidth;
            const viewportH = container.clientHeight;

            const newLocalCenterX = targetGlobalX - GLOBAL_OFFSET_X;
            const newLocalCenterY = targetGlobalY - GLOBAL_OFFSET_Y;

            pannedX = (viewportW / 2) - (newLocalCenterX * scale);
            pannedY = (viewportH / 2) - (newLocalCenterY * scale);
        } else if (!preserveView) {
            // Reset to center
            const viewportW = container.clientWidth;
            const viewportH = container.clientHeight;
            pannedX = (viewportW - canvas.width) / 2;
            pannedY = (viewportH - canvas.height) / 2;
            scale = 0.8;
        }

        updateTransform();
        // renderCanvas(); // Removed: mapImage.onload will trigger renderCanvas via initMap
        loading.style.display = 'none';

    } catch (err) {
        console.error(err);
        loading.textContent = `Error loading floor ${z}`;
        loading.style.color = "#ff5555";
    }

    isMapLoading = false;
}

// Remove old initMap as it is replaced by initApp / loadFloor logic
// Keep renderCanvas etc.

function redrawMap() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw current floor from cache
    const floorCtx = floorCache.get(currentFloor);
    if (floorCtx) {
        ctx.drawImage(floorCtx.canvas, 0, 0);
    } else {
        // Fallback or empty?
        // If we are here, maybe we should trigger a load, but usually load handles drawing.
    }

    // Draw ALL vectors
    vectors.forEach(v => {
        drawVectorOnCanvas(v);
    });
}
// Alias for compatibility if needed, though we will replace calls.
const renderCanvas = redrawMap;

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

    // --- 3. Center Marker (Dot) ---
    // Drawn AFTER restore so it's not clipped/affected
    ctx.save();
    ctx.fillStyle = "black";
    ctx.fillRect(localX - 1, localY - 1, 2, 2); // 2x2 pixel dot
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

// Floor shortcut (CTRL + Scroll)
window.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
        e.preventDefault();
        const delta = Math.sign(e.deltaY);
        changeFloor(delta);
    }
}, { passive: false });

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
        cursorDisplay.textContent = `X: ${globalX}\nY: ${globalY}\nZ: ${currentFloor}`;
        cursorDisplay.style.color = "#4CAF50";
    } else {
        cursorDisplay.textContent = `Out of bounds`;
        cursorDisplay.style.color = "#888";
    }
}

async function pasteAndFill() {
    const status = document.getElementById('status');
    try {
        const text = await navigator.clipboard.readText();
        const regex = /(?:X[:\s]*)?(\d+)[^0-9]+(?:Y[:\s]*)?(\d+)/i;
        const match = text.match(regex);

        if (match) {
            document.getElementById('input-x').value = match[1];
            document.getElementById('input-y').value = match[2];
            // Check for Z if present
            const regexZ = /(?:Z[:\s]*)?(\d+)/i;
            // Logic to find Z might be tricky if not in same string, but let's try
            // Actually original regex had Z, let's keep simple for now or parsing logic
            // Original: /(?:X[:\s]*)?(\d+)[^0-9]+(?:Y[:\s]*)?(\d+)[^0-9]+(?:Z[:\s]*)?(\d+)/i

            const fullRegex = /(?:X[:\s]*)?(\d+)[^0-9]+(?:Y[:\s]*)?(\d+)[^0-9]+(?:Z[:\s]*)?(\d+)/i;
            const fullMatch = text.match(fullRegex);
            if (fullMatch && fullMatch[3]) {
                const z = parseInt(fullMatch[3]);
                if (z !== currentFloor) {
                    changeFloor(z - currentFloor);
                }
            }

            status.textContent = "Pasted: " + match[1] + ", " + match[2];
            status.style.color = "#4CAF50";
            return true;
        } else {
            status.textContent = "No coords found in clipboard.";
            status.style.color = "#ff5555";
            return false;
        }
    } catch (err) {
        console.error(err);
        status.textContent = "Paste error: " + err.message;
        return false;
    }
}

async function handleCompassClick(dir) {
    // 1. Try to paste first
    const pasted = await pasteAndFill();

    // 2. Add vector using current input values (whether pasted or existing)
    addVector(dir);
}

// --- NEW Multi-Vector Logic (Updated) ---
function addVector(dir) {
    const status = document.getElementById('status');
    const inputX = parseInt(document.getElementById('input-x').value);
    const inputY = parseInt(document.getElementById('input-y').value);
    // dir is passed in now
    if (!dir) {
        status.textContent = "Please select a direction (N, NE, etc.)";
        status.style.color = "#ff5555";
        return;
    }

    if (isNaN(inputX) || isNaN(inputY)) {
        status.textContent = "Enter coordinates first!";
        status.style.color = "#ff5555";
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

    // Auto-center on the new vector
    const viewportW = container.clientWidth;
    const viewportH = container.clientHeight;

    // Calculate panned positions to put localX/localY in center
    pannedX = (viewportW / 2) - (localX * scale);
    pannedY = (viewportH / 2) - (localY * scale);

    updateTransform();
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
function resetView() {
    // Clear vectors
    vectors = [];
    updateVectorList();

    // Reset view for current floor (preserveView = false)
    loadFloor(currentFloor, false);
}

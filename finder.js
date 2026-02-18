const container = document.getElementById('map-container');
const content = document.getElementById('map-content');
const canvas = document.getElementById('map-canvas');
const ctx = canvas.getContext('2d');
const loading = document.getElementById('map-loading');
const cursorDisplay = document.getElementById('cursor-coords');
const vectorListEl = document.getElementById('vector-list');

// Vector Canvas
const vectorCanvas = document.getElementById('vector-canvas');
const vectorCtx = vectorCanvas.getContext('2d');
const mapViewport = document.getElementById('map-viewport');

// Map Config
let GLOBAL_OFFSET_X = 2816;
let GLOBAL_OFFSET_Y = 3136;

// Floor Config
let currentFloor = 7;
let floorsData = null; // Stores parsed OTMM data { z: { blocks, minX... } }
const floorCache = new Map(); // Stores rendered contexts
const MAX_CACHE_SIZE = 3; // LRU Cache Limit
let isMapLoading = false;

let scale = 1;
let pannedX = 0;
let pannedY = 0;
let isDragging = false;
let startX, startY;

// Zoom Configuration
const zoomFactors = [0, 0.05, 0.1, 0.25, 0.5, 0.75, 1.0]; // 7 Levels: Fit -> Close (Soft start)
let currentZoomIndex = 0;

// List of vectors
let vectors = [];

window.addEventListener('DOMContentLoaded', initApp);
window.addEventListener('resize', handleResize);

function handleResize() {
    if (!vectorCanvas || !mapViewport) return;
    vectorCanvas.width = mapViewport.clientWidth;
    vectorCanvas.height = mapViewport.clientHeight;
    updateTransform();
}

async function initApp() {
    loading.style.display = 'block';
    loading.textContent = "Initializing Map Data...";

    // Init vector canvas size
    handleResize();

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

        floorsData = await loader.parseAllFloors(buffer, (msg) => {
            loading.textContent = msg;
        });

        // Initial Load
        await loadFloor(currentFloor, false); // false = don't preserve view on first load

    } catch (err) {
        console.error("Init Error:", err);
        loading.innerHTML = `Error initializing map:<br>${err.message}<br><small>${err.stack}</small>`;
        loading.style.color = "#ff5555";
    }
}

function updateFloorUI() {
    document.getElementById('input-z').value = currentFloor;
}

async function changeFloor(delta) {
    const newFloor = currentFloor + delta;
    if (floorsData && !floorsData[newFloor]) {
        // If no data, we generally assume empty or skip?
        // Standard Tibia floors 0-15
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

        let floorCtx;

        // LRU Cache Logic
        if (floorCache.has(z)) {
            // Cache Hit: Move to end (most recent)
            floorCtx = floorCache.get(z);
            floorCache.delete(z);
            floorCache.set(z, floorCtx);
        } else {
            // Cache Miss
            // Evict if full
            if (floorCache.size >= MAX_CACHE_SIZE) {
                const oldestKey = floorCache.keys().next().value;
                floorCache.delete(oldestKey);
            }

            // Render it
            const fd = floorsData[z];
            if (!fd) {
                console.warn(`Floor ${z} has no data!`);
                // Empty floor
                // Create a small empty canvas to avoid errors
                const fCanvas = document.createElement('canvas');
                fCanvas.width = 100;
                fCanvas.height = 100;
                floorCtx = fCanvas.getContext('2d');
            } else {
                console.log(`Rendering Floor ${z}, Found ${fd.blocks.length} blocks.`);
                const width = (fd.maxX - fd.minX) + 64;
                const height = (fd.maxY - fd.minY) + 64;

                const fCanvas = document.createElement('canvas');
                fCanvas.width = width;
                fCanvas.height = height;

                const loader = new OTMMLoader();
                await loader.renderFloor(fd, fCanvas, (msg) => {
                    loading.textContent = msg;
                });
                floorCtx = fCanvas.getContext('2d');
            }

            floorCache.set(z, floorCtx);
        }

        // Apply to main canvas
        canvas.width = floorCtx.canvas.width;
        canvas.height = floorCtx.canvas.height;

        // Draw floor texture
        redrawMap();

        // Update Map Config for this floor
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
            // Reset to fit and center
            currentZoomIndex = 0;
            scale = getTargetScale(0);
            const viewportW = container.clientWidth;
            const viewportH = container.clientHeight;
            pannedX = (viewportW - canvas.width * scale) / 2;
            pannedY = (viewportH - canvas.height * scale) / 2;
        }

        updateTransform(); // This will trigger drawVectors
        loading.style.display = 'none';

    } catch (err) {
        console.error(err);
        loading.textContent = `Error loading floor ${z}`;
        loading.style.color = "#ff5555";
    }

    isMapLoading = false;
}

function redrawMap() {
    // Only draws the map image. Vectors are handled by drawVectors.
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const floorCtx = floorCache.get(currentFloor);
    if (floorCtx) {
        ctx.drawImage(floorCtx.canvas, 0, 0);
    }
}

// Replaces old drawVectorOnCanvas
// Supports optional override parameters for animation syncing
function drawVectors(overrideScale, overridePannedX, overridePannedY) {
    // Use overrides if provided, otherwise use global state
    const currentScale = (overrideScale !== undefined) ? overrideScale : scale;
    const currentPannedX = (overridePannedX !== undefined) ? overridePannedX : pannedX;
    const currentPannedY = (overridePannedY !== undefined) ? overridePannedY : pannedY;

    // Clear vector canvas (screen space)
    vectorCtx.clearRect(0, 0, vectorCanvas.width, vectorCanvas.height);

    if (vectors.length === 0) return;

    const viewportW = vectorCanvas.width;
    const viewportH = vectorCanvas.height;
    // Length large enough to cover screen diagonal
    // Use map dimensions * scale to ensure lines don't disappear when panning
    const maxLen = Math.max(canvas.width, canvas.height) * currentScale * 3;

    vectors.forEach(v => {
        const { localX, localY, angle1, angle2 } = v;

        // Project Map Point to Screen Point
        // Screen = Panned + Map * Scale
        const screenX = currentPannedX + localX * currentScale;
        const screenY = currentPannedY + localY * currentScale;

        vectorCtx.save();

        // Calculate endpoints in screen space
        const x1 = screenX + Math.cos(angle1) * maxLen;
        const y1 = screenY + Math.sin(angle1) * maxLen;
        const x2 = screenX + Math.cos(angle2) * maxLen;
        const y2 = screenY + Math.sin(angle2) * maxLen;

        // --- 1. Vector Boundaries (The "V" Shape) ---
        vectorCtx.beginPath();
        vectorCtx.moveTo(screenX, screenY);
        vectorCtx.lineTo(x1, y1);
        vectorCtx.moveTo(screenX, screenY);
        vectorCtx.lineTo(x2, y2);

        // Draw Vector Lines
        vectorCtx.lineWidth = 3;
        vectorCtx.strokeStyle = "black";
        vectorCtx.setLineDash([]);
        vectorCtx.stroke();

        // --- 2. Distance Markers (Clipped Squares) ---
        // Distances: 30 and 500 (Map Units)
        const distances = [
            { r: 30, color: "black" },
            { r: 500, color: "black" }
        ];

        // Setup Clip Region (The Cone)
        vectorCtx.beginPath();
        vectorCtx.moveTo(screenX, screenY);
        vectorCtx.lineTo(x1, y1);
        vectorCtx.lineTo(x2, y2);
        vectorCtx.closePath();
        vectorCtx.clip();

        // Draw Squares
        distances.forEach(d => {
            const r = d.r * currentScale; // Scale the radius
            vectorCtx.beginPath();
            vectorCtx.rect(screenX - r, screenY - r, r * 2, r * 2);

            vectorCtx.lineWidth = 3;
            vectorCtx.strokeStyle = "black";
            vectorCtx.setLineDash([]);
            vectorCtx.stroke();
        });

        vectorCtx.restore();

        // --- 3. Center Marker (Dot) ---
        vectorCtx.fillStyle = "black";
        vectorCtx.fillRect(screenX - 1, screenY - 1, 2, 2);
    });
}

function updateTransform() {
    clampPosition();
    content.style.transform = `translate(${pannedX}px, ${pannedY}px) scale(${scale})`;
    // Sync vector overlay
    drawVectors();
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

// ... Mouse events ...
container.addEventListener('mousedown', (e) => {
    e.preventDefault();
    isDragging = true;
    startX = e.clientX - pannedX;
    startY = e.clientY - pannedY;

    // Disable transition during drag for responsiveness
    content.classList.remove('map-transition');
});

window.addEventListener('mousemove', (e) => {
    updateCursorCoords(e);
    if (!isDragging) return;
    e.preventDefault();
    pannedX = e.clientX - startX;
    pannedY = e.clientY - startY;
    updateTransform();
});
window.addEventListener('mouseup', () => { isDragging = false; });
container.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.ctrlKey) return; // Floor shortcut handled below

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const direction = -Math.sign(e.deltaY);
    setZoomIndex(currentZoomIndex + direction, { x: mouseX, y: mouseY });

    updateCursorCoords(e);
});

// Touch Events (Mobile)
let initialPinchDist = 0;
let initialScale = 1;

container.addEventListener('touchstart', (e) => {
    // Disable transition for any touch interaction (pan/pinch)
    content.classList.remove('map-transition');

    if (e.touches.length === 1) {
        // Single touch: Pan
        isDragging = true;
        startX = e.touches[0].clientX - pannedX;
        startY = e.touches[0].clientY - pannedY;
    } else if (e.touches.length === 2) {
        // Multi touch: Pinch Zoom
        isDragging = false;
        initialPinchDist = getPinchDist(e);
        initialScale = scale;
    }
}, { passive: false });

container.addEventListener('touchmove', (e) => {
    e.preventDefault(); // Prevent scroll/zoom of page
    if (e.touches.length === 1 && isDragging) {
        pannedX = e.touches[0].clientX - startX;
        pannedY = e.touches[0].clientY - startY;
        updateTransform();
    } else if (e.touches.length === 2) {
        const currentDist = getPinchDist(e);
        if (initialPinchDist > 0) {
            const pinchScale = currentDist / initialPinchDist;
            let newScale = initialScale * pinchScale;

            // Center zoom on pinch center
            const rect = container.getBoundingClientRect();
            const p1 = e.touches[0];
            const p2 = e.touches[1];
            const centerX = (p1.clientX + p2.clientX) / 2 - rect.left;
            const centerY = (p1.clientY + p2.clientY) / 2 - rect.top;

            const contentX = (centerX - pannedX) / scale;
            const contentY = (centerY - pannedY) / scale;

            if (newScale < 0.1) newScale = 0.1;
            if (newScale > 10) newScale = 10;

            pannedX = centerX - contentX * newScale;
            pannedY = centerY - contentY * newScale;
            scale = newScale;
            updateTransform();
        }
    }
}, { passive: false });

container.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) {
        initialPinchDist = 0;
    }
    if (e.touches.length === 0) {
        isDragging = false;
    }
});

function getPinchDist(e) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

// Floor shortcut (CTRL + Scroll)
window.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
        e.preventDefault();
        const delta = Math.sign(e.deltaY);
        changeFloor(delta);
    }
}, { passive: false });

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
    const btn = document.getElementById('btn-paste');
    try {
        const text = await navigator.clipboard.readText();
        const regex = /(?:X[:\s]*)?(\d+)[^0-9]+(?:Y[:\s]*)?(\d+)/i;
        const match = text.match(regex);

        if (match) {
            document.getElementById('input-x').value = match[1];
            document.getElementById('input-y').value = match[2];

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

            if (btn) {
                const originalText = "📋";
                btn.textContent = "✅";
                btn.style.backgroundColor = "rgba(76, 175, 80, 0.2)";
                btn.style.borderColor = "#4CAF50";

                if (btn._pasteTimeout) clearTimeout(btn._pasteTimeout);
                btn._pasteTimeout = setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.backgroundColor = "";
                    btn.style.borderColor = "";
                    btn._pasteTimeout = null;
                }, 2000);
            }

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
    await pasteAndFill();

    // 2. Add vector using current input values
    addVector(dir);
}

function addVector(dir) {
    const status = document.getElementById('status');
    const inputX = parseInt(document.getElementById('input-x').value);
    const inputY = parseInt(document.getElementById('input-y').value);

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

    const newVector = {
        id: Date.now(),
        label: `(${inputX}, ${inputY}) ${dir}`,
        localX, localY, angle1: rad1, angle2: rad2
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
}

function deleteVector(id) {
    vectors = vectors.filter(v => v.id !== id);
    updateVectorList();
    drawVectors();
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

function getTargetScale(index) {
    if (!canvas.width) return 1;
    const viewportW = container.clientWidth;
    const viewportH = container.clientHeight;

    // Scale to fit (95% of viewport)
    const scaleFitX = viewportW / canvas.width;
    const scaleFitY = viewportH / canvas.height;
    const scaleFit = Math.min(scaleFitX, scaleFitY) * 0.95;

    // Scale to show 100 tiles width
    const scaleClose = viewportW / 100;

    const factor = zoomFactors[index];
    // Linear interpolation between Fit and Close
    return scaleFit + (scaleClose - scaleFit) * factor;
}

function setZoomIndex(index, centerPoint) {
    if (index < 0) index = 0;
    if (index >= zoomFactors.length) index = zoomFactors.length - 1;

    // Enable smooth transition for zoom actions
    content.classList.add('map-transition');

    const oldScale = scale;
    const newScale = getTargetScale(index);
    currentZoomIndex = index;
    scale = newScale;

    // Center Logic
    const viewportW = container.clientWidth;
    const viewportH = container.clientHeight;

    let cX, cY;
    if (centerPoint) {
        cX = centerPoint.x;
        cY = centerPoint.y;
    } else {
        cX = viewportW / 2;
        cY = viewportH / 2;
    }

    // Screen = Panned + Content * Scale
    // Content = (Screen - Panned) / OldScale
    const contentX = (cX - pannedX) / oldScale;
    const contentY = (cY - pannedY) / oldScale;

    // NewPanned = Screen - Content * NewScale
    pannedX = cX - contentX * newScale;
    pannedY = cY - contentY * newScale;

    updateTransform();

    // Start synced vector animation
    animateVectors();
}

let animationFrameId = null;

function animateVectors() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    const startTime = performance.now();

    function loop() {
        const style = window.getComputedStyle(content);
        const matrix = new WebKitCSSMatrix(style.transform);

        // Extract transition state
        // scale is usually matrix.a (for 2d uniform scale)
        // translate is matrix.e (x) and matrix.f (y)
        const currentScale = matrix.a;
        const currentPanX = matrix.e;
        const currentPanY = matrix.f;

        drawVectors(currentScale, currentPanX, currentPanY);

        // Check if transition is roughly done (optional fallback)
        // Better to rely on transitionend, but loop keeps it fluid
        animationFrameId = requestAnimationFrame(loop);
    }

    loop();
}

// Stop animation when transition ends
content.addEventListener('transitionend', () => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
    drawVectors(); // Final draw with canonical state
});

function zoomIn() { setZoomIndex(currentZoomIndex + 1); }
function zoomOut() { setZoomIndex(currentZoomIndex - 1); }
function resetView() {
    // Clear vectors
    vectors = [];
    updateVectorList();

    // Reset view for current floor (preserveView = false)
    loadFloor(currentFloor, false);
    // loadFloor calls setZoomIndex(0) inside via preserveView logic
}

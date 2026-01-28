// Precompute color palette for faster rendering
// 6x6x6 color cube + alpha logic
// Bolt Optimization: Replaced per-pixel math with O(1) LUT lookup and 32-bit writes
const COLOR_LUT = new Uint32Array(256);
(function () {
    // Detect Endianness
    const isLittleEndian = new Uint8Array(new Uint32Array([0x12345678]).buffer)[0] === 0x78;

    for (let i = 0; i < 256; i++) {
        let r = 0, g = 0, b = 0, a = 255;
        if (i >= 216) {
            a = 0;
        } else {
            // Original logic:
            // r = Math.floor((colorIdx / 36) % 6 * 51);
            // g = Math.floor((colorIdx / 6) % 6 * 51);
            // b = Math.floor((colorIdx % 6) * 51);
            r = (Math.floor(i / 36) % 6) * 51;
            g = (Math.floor(i / 6) % 6) * 51;
            b = (i % 6) * 51;
        }

        if (isLittleEndian) {
            // ABGR
            COLOR_LUT[i] = (a << 24) | (b << 16) | (g << 8) | r;
        } else {
            // RGBA
            COLOR_LUT[i] = (r << 24) | (g << 16) | (b << 8) | a;
        }
    }
})();

class OTMMLoader {
    constructor() {
        this.blocks = [];
        this.minX = Infinity;
        this.minY = Infinity;
        this.maxX = -Infinity;
        this.maxY = -Infinity;
    }

    async loadAndRender(url, targetCanvas, statusCallback, validBounds) {
        try {
            if (statusCallback) statusCallback("Fetching OTMM file...");
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const arrayBuffer = await response.arrayBuffer();
            return this.parseAndRender(arrayBuffer, targetCanvas, statusCallback, validBounds);
        } catch (err) {
            console.error(err);
            if (statusCallback) statusCallback(`Error: ${err.message}`);
            throw err;
        }
    }

    async parseAllFloors(arrayBuffer, statusCallback) {
        try {
            const data = new DataView(arrayBuffer);
            if (statusCallback) statusCallback("Parsing ALL blocks...");

            // Header: 22 bytes
            let offset = 22;
            const fileSize = arrayBuffer.byteLength;

            // Bucket by Z
            const floors = {}; // z -> { blocks: [], minX, maxX, minY, maxY }

            // 1. First Pass: Parse and collect bounds
            let globalMinX = Infinity, globalMaxX = -Infinity;
            let globalMinY = Infinity, globalMaxY = -Infinity;

            while (offset < fileSize) {
                // Check if we have enough bytes for header (7 bytes)
                if (offset + 7 > fileSize) break;

                const x = data.getUint16(offset, true); // Little Endian
                const y = data.getUint16(offset + 2, true);
                const z = data.getUint8(offset + 4);
                const length = data.getUint16(offset + 5, true);

                offset += 7;

                if (offset + length > fileSize) {
                    console.error("Truncated block data");
                    break;
                }

                // Strict Bounds Filtering
                // Min: 2792, 3123 | Max: 4821, 6465
                if (x < 2792 || x > 4821 || y < 3123 || y > 6465) {
                    offset += length;
                    continue;
                }

                // Update GLOBAL bounds
                if (x < globalMinX) globalMinX = x;
                if (x > globalMaxX) globalMaxX = x;
                if (y < globalMinY) globalMinY = y;
                if (y > globalMaxY) globalMaxY = y;

                // Initialize bucket if needed
                if (!floors[z]) {
                    floors[z] = {
                        z: z,
                        blocks: [],
                        // We will set these later to global values
                        minX: 0, maxX: 0,
                        minY: 0, maxY: 0
                    };
                }

                const compressedData = arrayBuffer.slice(offset, offset + length);
                floors[z].blocks.push({ x, y, data: compressedData });

                offset += length;

                // Yield every 100000 bytes or so
                if (offset % 100000 < 100) {
                    await new Promise(r => setTimeout(r, 0));
                }
            }

            // 2. Second Pass: Apply UNIFIED Global Bounds to all floors
            // This ensures every floor renders to a canvas of the exact same size and origin.
            // (0,0) on Floor 7 will match (0,0) on Floor 8 exactly.
            if (globalMinX === Infinity) {
                // Fallback if no valid blocks found
                globalMinX = 2792; globalMaxX = 4821;
                globalMinY = 3123; globalMaxY = 6465;
            }

            Object.values(floors).forEach(f => {
                f.minX = globalMinX;
                f.maxX = globalMaxX;
                f.minY = globalMinY;
                f.maxY = globalMaxY;
            });

            if (statusCallback) statusCallback(`Parsed ${Object.keys(floors).length} floors. Unified Bounds: ${globalMinX},${globalMinY}`);
            return floors;

        } catch (err) {
            console.error(err);
            if (statusCallback) statusCallback(`Error: ${err.message}`);
            throw err;
        }
    }

    async renderFloor(floorData, targetCanvas, statusCallback) {
        if (!floorData || !floorData.blocks.length) return false;

        const { minX, maxX, minY, maxY, blocks } = floorData;
        const width = (maxX - minX) + 64;
        const height = (maxY - minY) + 64;

        if (statusCallback) statusCallback(`Rendering Floor ${floorData.z}...`);

        targetCanvas.width = width;
        targetCanvas.height = height;
        const ctx = targetCanvas.getContext('2d');
        const mapImageData = ctx.createImageData(width, height);

        // Bolt Optimization: Use 32-bit view for faster pixel writing
        const mapData32 = new Uint32Array(mapImageData.data.buffer);

        let processed = 0;
        const total = blocks.length;

        for (const block of blocks) {
            try {
                const ds = new DecompressionStream('deflate');
                const blob = new Blob([block.data]);
                const stream = blob.stream().pipeThrough(ds);
                const decompressedBuffer = await new Response(stream).arrayBuffer();
                const rawBytes = new Uint8Array(decompressedBuffer);

                const blockW = 64;
                const originX = block.x - minX;
                const originY = block.y - minY;

                for (let i = 0; i < rawBytes.length; i += 3) {
                    const colorIdx = rawBytes[i + 1];

                    // Bolt Optimization: Use LUT
                    const packedColor = COLOR_LUT[colorIdx];

                    const pIdx = i / 3;
                    const px = pIdx % blockW;
                    const py = Math.floor(pIdx / blockW);

                    const globalX = originX + px;
                    const globalY = originY + py;

                    const bufferIdx = (globalY * width + globalX);

                    mapData32[bufferIdx] = packedColor;
                }

            } catch (err) { }

            processed++;
            if (processed % 100 === 0) {
                await new Promise(r => setTimeout(r, 0)); // Yield logic
            }
        }

        ctx.putImageData(mapImageData, 0, 0);
        return { minX, minY, width, height }; // Return generated bounds useful for offsetting
    }

    base64ToArrayBuffer(base64) {
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }
}

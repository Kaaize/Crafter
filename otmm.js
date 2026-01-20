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

    async parseAndRender(arrayBuffer, targetCanvas, statusCallback, validBounds) {
        try {
            const data = new DataView(arrayBuffer);
            if (statusCallback) statusCallback("Parsing blocks...");

            // Header: 22 bytes
            let offset = 22;
            const fileSize = arrayBuffer.byteLength;

            this.blocks = [];

            // Use provided bounds or infinity
            const limitMinX = validBounds ? validBounds.minX : -Infinity;
            const limitMinY = validBounds ? validBounds.minY : -Infinity;
            const limitMaxX = validBounds ? validBounds.maxX : Infinity;
            const limitMaxY = validBounds ? validBounds.maxY : Infinity;

            // Recalculate actual bounds based on content found
            this.minX = Infinity;
            this.minY = Infinity;
            this.maxX = -Infinity;
            this.maxY = -Infinity;

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

                // We only care about Z=7 for the main map
                if (z === 7) {
                    // Check if block is within limits
                    if (x >= limitMinX && x <= limitMaxX && y >= limitMinY && y <= limitMaxY) {
                        // Update bounds
                        if (x < this.minX) this.minX = x;
                        if (x > this.maxX) this.maxX = x;
                        if (y < this.minY) this.minY = y;
                        if (y > this.maxY) this.maxY = y;

                        // Store reference to data for later decompression
                        // slicing is cheap on ArrayBuffer usually
                        const compressedData = arrayBuffer.slice(offset, offset + length);
                        this.blocks.push({ x, y, data: compressedData });
                    }
                }

                offset += length;
            }

            if (this.blocks.length === 0) {
                if (validBounds) {
                    throw new Error("No Z=7 blocks found in the specified range " + JSON.stringify(validBounds));
                } else {
                    throw new Error("No Z=7 blocks found in OTMM.");
                }
            }

            const width = (this.maxX - this.minX) + 64;
            const height = (this.maxY - this.minY) + 64;

            if (statusCallback) statusCallback(`Rendering ${this.blocks.length} blocks to ${width}x${height} canvas...`);

            // Check for massive size
            if (width * height * 4 > 300 * 1024 * 1024) {
                // Warn if > 300MB buffer
                console.warn(`Huge image buffer: ${width}x${height}`);
            }

            targetCanvas.width = width;
            targetCanvas.height = height;
            const ctx = targetCanvas.getContext('2d');
            const mapImageData = ctx.createImageData(width, height);

            let processed = 0;
            const total = this.blocks.length;

            for (const block of this.blocks) {
                try {
                    const ds = new DecompressionStream('deflate');
                    const blob = new Blob([block.data]);
                    const stream = blob.stream().pipeThrough(ds);
                    const decompressedBuffer = await new Response(stream).arrayBuffer();
                    const rawBytes = new Uint8Array(decompressedBuffer);

                    const blockW = 64;
                    const originX = block.x - this.minX;
                    const originY = block.y - this.minY;

                    for (let i = 0; i < rawBytes.length; i += 3) {
                        const colorIdx = rawBytes[i + 1];

                        let r = 0, g = 0, b = 0, a = 255;
                        if (colorIdx >= 216) {
                            a = 0;
                        } else {
                            r = Math.floor((colorIdx / 36) % 6 * 51);
                            g = Math.floor((colorIdx / 6) % 6 * 51);
                            b = Math.floor((colorIdx % 6) * 51);
                        }

                        const pIdx = i / 3;
                        const px = pIdx % blockW;
                        const py = Math.floor(pIdx / blockW);

                        const globalX = originX + px;
                        const globalY = originY + py;

                        const bufferIdx = (globalY * width + globalX) * 4;

                        mapImageData.data[bufferIdx] = r;
                        mapImageData.data[bufferIdx + 1] = g;
                        mapImageData.data[bufferIdx + 2] = b;
                        mapImageData.data[bufferIdx + 3] = a;
                    }

                } catch (err) {
                    // console.warn(`Failed block at ${block.x},${block.y}`, err);
                }

                processed++;
                if (processed % 50 === 0 && statusCallback) {
                    statusCallback(`Rendering... ${Math.round(processed / total * 100)}%`);
                    await new Promise(r => setTimeout(r, 0));
                }
            }

            ctx.putImageData(mapImageData, 0, 0);

            if (statusCallback) statusCallback("Done!");

            return {
                minX: this.minX,
                minY: this.minY,
                width,
                height
            };

        } catch (err) {
            console.error(err);
            if (statusCallback) statusCallback(`Error: ${err.message}`);
            throw err;
        }
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

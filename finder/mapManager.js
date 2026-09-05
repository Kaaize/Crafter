export class MapManager {
    constructor(mapInstance, floors, initialFloor = 7) {
        this.map = mapInstance;
        this.floors = floors;
        this.curFloor = initialFloor;
        this.activeTileLayer = floors[initialFloor.toString()] || null;
        this.clippedIslandsLayer = null;

        this.targetIcon = L.icon({
            iconUrl: 'imgs_finder/BestTarget.png',
            iconSize: [36, 36],
            iconAnchor: [18, 36],
            popupAnchor: [0, -36]
        });

        this.layers = {
            searchArea: L.layerGroup().addTo(this.map),
            clippedIslands: L.layerGroup().addTo(this.map),
            spawns: L.layerGroup().addTo(this.map),
            bestTarget: null,
            selector: null,
            cross: null
        };
    }

    changeFloor(newFloor, onFloorChangedCallback) {
        const targetFloorStr = newFloor.toString();
        if (!this.floors[targetFloorStr]) return;

        // Remove o andar visível atual
        if (this.floors[this.curFloor.toString()]) {
            this.map.removeLayer(this.floors[this.curFloor.toString()]);
        }

        this.curFloor = newFloor;
        this.floors[targetFloorStr].addTo(this.map);

        if (onFloorChangedCallback) onFloorChangedCallback(this.curFloor);
    }

    updateFloors(newFloors, newFloorIndex) {
        // Remove a camada visível da região antiga
        if (this.floors[this.curFloor.toString()]) {
            this.map.removeLayer(this.floors[this.curFloor.toString()]);
        }

        // Substitui o dicionário de andares
        this.floors = newFloors;

        // Exibe o andar inicial da nova região usando o changeFloor
        this.changeFloor(newFloorIndex);
    }    

    generateArcPoints(cx, cy, radius, startAngleDeg, endAngleDeg, steps = 16) {
        const points = [];
        const startRad = (startAngleDeg * Math.PI) / 180;
        const endRad = (endAngleDeg * Math.PI) / 180;
        const stepRad = (endRad - startRad) / steps;

        for (let i = 0; i <= steps; i++) {
            const rad = startRad + i * stepRad;
            const px = cx + radius * Math.cos(rad);
            const py = cy + radius * Math.sin(rad);
            points.push([px, py]);
        }

        return points;
    }   
                
    updateClickSelector(x, y, limitX = 5000, limitY = 7000) {
        if (this.layers.selector) this.map.removeLayer(this.layers.selector);
        if (this.layers.cross) this.map.removeLayer(this.layers.cross);

        const minR = 29.5;  
        const maxR = 499.5; 

        const radius = 0.5;
        const bounds = [[y + radius, x + radius], [y - radius, x - radius]];
        this.layers.selector = L.rectangle(bounds, { color: "#333333", weight: 1, fillOpacity: 0, interactive: false }).addTo(this.map);

        const lineElements = [];

        const anglesDeg = [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5];
        const maxDist = Math.max(limitX, limitY) * 2; 

        anglesDeg.forEach(deg => {
            const rad = (deg * Math.PI) / 180;
            
            const endX = x + maxDist * Math.cos(rad);
            const endY = y + maxDist * Math.sin(rad);

            lineElements.push(L.polyline([[y, x], [endY, endX]], {
                color: '#000000',
                weight: 1,
                interactive: false
            }));
        });

        const innerSquare = [
            [y - minR, x - minR],
            [y + minR, x - minR],
            [y + minR, x + minR],
            [y - minR, x + minR]
        ];

        const outerSquare = [
            [y - maxR, x - maxR],
            [y + maxR, x - maxR],
            [y + maxR, x + maxR],
            [y - maxR, x + maxR]
        ];

        [innerSquare, outerSquare].forEach(squarePts => {
            lineElements.push(L.polygon(squarePts, {
                color: '#000000',
                weight: 1,
                fill: false,
                interactive: false
            }));
        });

        this.layers.cross = L.layerGroup(lineElements).addTo(this.map);
    }

    renderSearchArea(geoJsonPolygon) {
        this.layers.searchArea.clearLayers();
        if (!geoJsonPolygon) return;

        const baseLayer = L.geoJSON(geoJsonPolygon, {
            style: { color: '#161761', weight: 2, fillColor: '#200f7e', fillOpacity: 0.25 }
        });
        this.layers.searchArea.addLayer(baseLayer);
    }

    renderClippedIslands(geoJsonPolygon, islandsGeoJSON) {
        this.layers.clippedIslands.clearLayers();

        if (!geoJsonPolygon || !islandsGeoJSON) return;

        const clippedGeoJSON = getClippedIslands(geoJsonPolygon, islandsGeoJSON);

        if (!clippedGeoJSON || clippedGeoJSON.features.length === 0) return;

        const islandStyle = {
            color: "#B7950B",        
            weight: 1.5,
            fillColor: "#F1C40F",
            fillOpacity: 0.5,
            interactive: false
        };

        const islandLayer = L.geoJSON(clippedGeoJSON, { style: islandStyle });
        this.layers.clippedIslands.addLayer(islandLayer);
    }

    renderBestTarget(bestPoint) {
        if (this.layers.bestTarget) {
            this.map.removeLayer(this.layers.bestTarget);
            this.layers.bestTarget = null;
        }

        if (!bestPoint) return;

        const y = bestPoint[1] - 0.5;
        const x = bestPoint[0] - 0.5;

        this.layers.bestTarget = L.marker([y, x], {
            icon: this.targetIcon,
            interactive: false
        }).addTo(this.map);        
    }

    renderSpawnPoints(points) {
        this.layers.spawns.clearLayers();

        if (!points || points.length === 0) return;

        points.forEach(point => {
            const marker = L.circle([point[1] - 0.5, point[0] - 0.5], {
                radius: 0.5,
                color: "#000000",
                fillColor: "#000000",
                fillOpacity: 0.3,
                weight: 1,
                interactive: false
            });

            marker.addTo(this.layers.spawns);
        });
    }

    renderClippedIslands(clippedGeoJSON) {
        if (this.clippedIslandsLayer) {
            this.map.removeLayer(this.clippedIslandsLayer);
            this.clippedIslandsLayer = null;
        }

        if (!clippedGeoJSON) return;

        this.clippedIslandsLayer = L.geoJSON(clippedGeoJSON, {
            style: {
                color: '#ff7800',
                weight: 2,
                opacity: 0.25,
                fillColor: '#ff7800',
                fillOpacity: 0.15
            }
        });

        this.clippedIslandsLayer.addTo(this.map);
    }

    clearAll() {
        this.layers.searchArea.clearLayers();
        this.layers.spawns.clearLayers();
        if (this.layers.bestTarget) {
            this.map.removeLayer(this.layers.bestTarget);
            this.layers.bestTarget = null;
        }
        if (this.clippedIslandsLayer) {
            this.map.removeLayer(this.clippedIslandsLayer);
            this.clippedIslandsLayer = null;
        }
    }
}
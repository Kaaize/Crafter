export class MapManager {
    constructor(mapInstance, floors, initialFloor = 7) {
        this.map = mapInstance;
        this.floors = floors;
        this.curFloor = initialFloor;

        this.targetIcon = L.icon({
            iconUrl: 'imgs_finder/BestTarget.png',
            iconSize: [36, 36],
            iconAnchor: [18, 36],
            popupAnchor: [0, -36]
        });

        this.layers = {
            searchArea: L.layerGroup().addTo(this.map),
            spawns: L.layerGroup().addTo(this.map),
            bestTarget: null,
            selector: null,
            cross: null
        };
    }

    changeFloor(newFloor, onFloorChangedCallback) {
        if (!this.floors[newFloor.toString()]) return;

        this.map.removeLayer(this.floors[this.curFloor.toString()]);
        this.curFloor = newFloor;
        this.floors[this.curFloor.toString()].addTo(this.map);

        if (onFloorChangedCallback) onFloorChangedCallback(this.curFloor);
    }

    updateClickSelector(x, y, limitX, limitY) {
        if (this.layers.selector) this.map.removeLayer(this.layers.selector);
        if (this.layers.cross) this.map.removeLayer(this.layers.cross);

        const radius = 0.5;
        const bounds = [[y + radius, x + radius], [y - radius, x - radius]];
        this.layers.selector = L.rectangle(bounds, { color: "#333333", weight: 1, fillOpacity: 0, interactive: false }).addTo(this.map);

        const lineV = L.polyline([[0, x], [limitY, x]], { color: '#333333', weight: 1, interactive: false });
        const lineH = L.polyline([[y, 0], [y, limitX]], { color: '#333333', weight: 1, interactive: false });
        this.layers.cross = L.layerGroup([lineV, lineH]).addTo(this.map);
    }

    renderSearchArea(geoJsonPolygon) {
        this.layers.searchArea.clearLayers();
        if (!geoJsonPolygon) return;

        const baseLayer = L.geoJSON(geoJsonPolygon, {
            style: { color: '#161761', weight: 2, fillColor: '#161761', fillOpacity: 0.25 }
        });
        this.layers.searchArea.addLayer(baseLayer);
    }

    renderBestTarget(bestPoint) {
        if (this.layers.bestTarget) {
            this.map.removeLayer(this.layers.bestTarget);
            this.layers.bestTarget = null;
        }

        if (!bestPoint) return;

        const y = bestPoint[1] + 0.5;
        const x = bestPoint[0] + 0.5;

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

    clearAll() {
        this.layers.searchArea.clearLayers();
        this.layers.spawns.clearLayers();
        if (this.layers.bestTarget) {
            this.map.removeLayer(this.layers.bestTarget);
            this.layers.bestTarget = null;
        }
    }
}
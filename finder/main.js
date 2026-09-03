import {MAP_CONFIGS, DEFAULT_MAP } from './mapConfig.js';
import { fetchSpawnMarks, loadIslandsGeoJSON } from './dataService.js';
import { getPoints, calcIntersectionPolygon, filterSpawnsInsidePolygon, getZoomLevelFromBox, findMostProbableSpawn, clipIslandsWithArea, clipSearchAreaWithBounds } from './geometryService.js';
import { MapManager } from './mapManager.js';
import { UIManager } from './uiManager.js';

let currentRegion = DEFAULT_MAP;
let config = MAP_CONFIGS[currentRegion];

const state = {    
    initPos: config.initPos,
    allSpawnMarks: [],
    limitX: config.limitX,
    limitY: config.limitY,
    curDist: { min: 30, max: 500 },
    curDir: 0,
    infos: [],
    bounds: config.bounds,
    excludeAreas: [config.excludeAreas],
    includeAreas: null,
};

const CRSPixel = L.Util.extend(L.CRS.Simple, {
    transformation: new L.Transformation(1, 0, 1, 0)
});

function createFloorLayers(basePath) {
    const floors = {};
    for (let i = 1; i <= 16; i++) {
        floors[i.toString()] = L.tileLayer(`${basePath}/${i}/{z}/{x}/{y}.webp`, {
            tileSize: 1024,
            noWrap: true,
            minNativeZoom: 0,
            maxNativeZoom: 0,
            minZoom: -4,
            maxZoom: 4
        });
    }
    
    return floors;
}

const floors = createFloorLayers(config.basePathTile);

const map = L.map('map', {
    crs: CRSPixel,
    layers: [floors[state.initPos[2].toString()]],
    minZoom: -4,
    maxZoom: 4,
    maxBounds: state.bounds,
    zoomSnap: 1,
    zoomDelta: 1
}).setView([state.initPos[0], state.initPos[1]], 2);

async function switchMapRegion(regionKey) {
    if (!MAP_CONFIGS[regionKey]) return;
    
    config = MAP_CONFIGS[regionKey];

    state.bounds = config.bounds;
    state.limitX = config.limitX;
    state.limitY = config.limitY;
    state.excludeAreas = config.excludeAreas;
    state.initPos = config.initPos;
    state.infos = [];

    mapManager.clearAll();

    map.setMaxBounds(config.bounds);

    const newFloors = createFloorLayers(config.basePathTile);
    mapManager.updateFloors(newFloors, state.initPos[2]);

    map.setView([state.initPos[0], state.initPos[1]], 2);
    map.setMaxBounds(config.bounds);

    state.allSpawnMarks = await fetchSpawnMarks(config.spawnsJsonPath);
    state.includeAreas = await loadIslandsGeoJSON(config.islandsGeoJsonPath);
    
    renderPipelineLayers();
}

const mapManager = new MapManager(map, floors, state.initPos[2]);
const uiManager = new UIManager((index) => removeItem(index));

uiManager.onRegionChange(async (newRegion) => {
    console.log(`Trocando região para: ${newRegion}`);
    await switchMapRegion(newRegion);
});

let btnDisplay = null;
const ZControl = L.Control.extend({
    options: { position: 'topleft' },
    onAdd: function () {
        const container = L.DomUtil.create('div', 'floor-control');
        L.DomEvent.disableClickPropagation(container);

        const btnUp = L.DomUtil.create('button', '', container);
        btnUp.innerHTML = '▲';
        L.DomEvent.on(btnUp, 'click', (e) => {
            L.DomEvent.stop(e);
            if (mapManager.curFloor > 1) mapManager.changeFloor(mapManager.curFloor - 1, updateFloorUI);
        });

        btnDisplay = L.DomUtil.create('button', 'floor-display', container);
        btnDisplay.innerHTML = mapManager.curFloor;
        L.DomEvent.on(btnDisplay, 'click', (e) => {
            L.DomEvent.stop(e);
            mapManager.changeFloor(7, updateFloorUI);
        });

        const btnDown = L.DomUtil.create('button', '', container);
        btnDown.innerHTML = '▼';
        L.DomEvent.on(btnDown, 'click', (e) => {
            L.DomEvent.stop(e);
            if (mapManager.curFloor < 16) mapManager.changeFloor(mapManager.curFloor + 1, updateFloorUI);
        });

        return container;
    }
});
map.addControl(new ZControl());

function updateFloorUI(newFloor) {
    if (btnDisplay) btnDisplay.innerHTML = newFloor;
    renderPipelineLayers();
}

function renderPipelineLayers() {
    mapManager.clearAll();

    let curIntersection = calcIntersectionPolygon(state.infos);
    if (!curIntersection) return;

    curIntersection = clipSearchAreaWithBounds(curIntersection, state.bounds);
    if (!curIntersection) return;

    mapManager.renderSearchArea(curIntersection);

    const clippedIslands = clipIslandsWithArea(curIntersection, state.includeAreas);
    mapManager.renderClippedIslands(clippedIslands);

    const pointsInside = filterSpawnsInsidePolygon(
        curIntersection, 
        state.allSpawnMarks, 
        state.bounds,
        state.excludeAreas
    );

    const bestPoint = findMostProbableSpawn(pointsInside);
    mapManager.renderBestTarget(bestPoint);

    const bbox = turf.bbox(curIntersection);
    const width = Math.abs(bbox[2] - bbox[0]);
    const height = Math.abs(bbox[3] - bbox[1]);

    if (width <= 100 && height <= 100) {
        const floorSpawns = pointsInside.filter(pos => pos[2] === mapManager.curFloor);
        mapManager.renderSpawnPoints(floorSpawns);
    }

    return curIntersection;    
}

function updatePipeline() {
    const curIntersection = renderPipelineLayers();
    if (!curIntersection) return;

    const bbox = turf.bbox(curIntersection);
    const center = turf.center(curIntersection);
    const zoom = Math.min(getZoomLevelFromBox(bbox), 0);

    map.setView([center.geometry.coordinates[1], center.geometry.coordinates[0]], zoom);
}

function removeItem(index) {
    state.infos.splice(index, 1);
    uiManager.renderList(state.infos);
    updatePipeline();
}

// Eventos de clique do Mapa
map.on('click', function (e) {
    const x = Math.floor(e.latlng.lng) + 0.5;
    const y = Math.floor(e.latlng.lat) + 0.5;

    mapManager.updateClickSelector(x, y, state.limitX, state.limitY);
    uiManager.updateCoords(x, y, mapManager.curFloor);
});

// Eventos da Interface (Botões de Distância/Direção)
document.querySelectorAll('.dist-btn').forEach((btn, index) => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.dist-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');

        if (index === 0) state.curDist = { min: 0, max: 30 };
        else if (index === 1) state.curDist = { min: 30, max: 500 };
        else state.curDist = { min: 500, max: Math.max(state.limitY, state.limitX) };
    });
});

document.querySelectorAll('.dir-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
        const dirIndex = parseInt(e.currentTarget.dataset.dir, 10);
        state.curDir = dirIndex * 45;
        pasteAndFill();
    });
});

document.getElementById('clear-btn').addEventListener('click', () => {
    state.infos = [];
    uiManager.renderList(state.infos);
    mapManager.clearAll();
});

async function pasteAndFill() {
    try {
        const cbxModoTeste = document.getElementById('checkbox-modo');
        const text = cbxModoTeste.checked ? document.getElementById('coords-display').textContent : await navigator.clipboard.readText();

        const regex = /(?:X[:\s]*)?(\d+)[^0-9]+(?:Y[:\s]*)?(\d+)[^0-9]+(?:Z[:\s]*)?(\d+)/i;
        const match = text.match(regex);

        if (!match || match.length < 4) return;

        const point = {
            x: parseInt(match[1]),
            y: parseInt(match[2]),
            z: parseInt(match[3]),
            dist: state.curDist,
            ang: state.curDir
        };

        point.points = getPoints({ x: point.x, y: point.y, z: point.z }, point.ang, point.dist.min, point.dist.max);
        state.infos.push(point);

        uiManager.renderList(state.infos);
        updatePipeline();
    } catch (err) {
        console.error(err);
    }
}

async function initApp() {
    state.allSpawnMarks = await fetchSpawnMarks(config.spawnsJsonPath);
    state.includeAreas = await loadIslandsGeoJSON(config.islandsGeoJsonPath);

    console.log(`Região ${config.name} carregada!`);
}

initApp();
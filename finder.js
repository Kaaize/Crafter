const directions = {
    0: "East",
    45: "SouthEast",
    90: "South",
    135: "SouthWest",
    180: "West",
    225: "NorthWest",
    270: "North",
    315: "NorthEast"
}

let allSpawnMarks

async function loadSpawnMarks() {
    try {
        const response = await fetch('spawn_mark.json');

        allSpawnMarks = await response.json();
    } catch (error) {
        console.error("Erro ao carregar o json de SpawnMark:", error)
    }
}

loadSpawnMarks();

const display = document.getElementById('coords-display');

let activeSelector = null;
let activeCross = null;

let limitX = 5000
let limitY = 7000

let curDist = {min: 30, max: 500}
let curDir = 0

let infos = []

let intersection = {mark: null, center: null, centroid: null, box: null};

var CRSPixel = L.Util.extend(L.CRS.Simple, {
    transformation: new L.Transformation(1, 0, 1, 0)
})

var btnDisplay = null;

distButtons = document.querySelectorAll('.dist-btn');

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

const floors = {
    "1": L.tileLayer('tiles/1/{z}/{x}/{y}.webp', {tileSize: 1024, noWrap: true, minNativeZoom: 0, maxNativeZoom: 0, minZoom: -4, maxZoom: 4}),
    "2": L.tileLayer('tiles/2/{z}/{x}/{y}.webp', {tileSize: 1024, noWrap: true, minNativeZoom: 0, maxNativeZoom: 0, minZoom: -4, maxZoom: 4}),
    "3": L.tileLayer('tiles/3/{z}/{x}/{y}.webp', {tileSize: 1024, noWrap: true, minNativeZoom: 0, maxNativeZoom: 0, minZoom: -4, maxZoom: 4}),
    "4": L.tileLayer('tiles/4/{z}/{x}/{y}.webp', {tileSize: 1024, noWrap: true, minNativeZoom: 0, maxNativeZoom: 0, minZoom: -4, maxZoom: 4}),
    "5": L.tileLayer('tiles/5/{z}/{x}/{y}.webp', {tileSize: 1024, noWrap: true, minNativeZoom: 0, maxNativeZoom: 0, minZoom: -4, maxZoom: 4}),
    "6": L.tileLayer('tiles/6/{z}/{x}/{y}.webp', {tileSize: 1024, noWrap: true, minNativeZoom: 0, maxNativeZoom: 0, minZoom: -4, maxZoom: 4}),
    "7": L.tileLayer('tiles/7/{z}/{x}/{y}.webp', {tileSize: 1024, noWrap: true, minNativeZoom: 0, maxNativeZoom: 0, minZoom: -4, maxZoom: 4}),
    "8": L.tileLayer('tiles/8/{z}/{x}/{y}.webp', {tileSize: 1024, noWrap: true, minNativeZoom: 0, maxNativeZoom: 0, minZoom: -4, maxZoom: 4}),
    "9": L.tileLayer('tiles/9/{z}/{x}/{y}.webp', {tileSize: 1024, noWrap: true, minNativeZoom: 0, maxNativeZoom: 0, minZoom: -4, maxZoom: 4}),
    "10": L.tileLayer('tiles/10/{z}/{x}/{y}.webp', {tileSize: 1024, noWrap: true, minNativeZoom: 0, maxNativeZoom: 0, minZoom: -4, maxZoom: 4}),
    "11": L.tileLayer('tiles/11/{z}/{x}/{y}.webp', {tileSize: 1024, noWrap: true, minNativeZoom: 0, maxNativeZoom: 0, minZoom: -4, maxZoom: 4}),
    "12": L.tileLayer('tiles/12/{z}/{x}/{y}.webp', {tileSize: 1024, noWrap: true, minNativeZoom: 0, maxNativeZoom: 0, minZoom: -4, maxZoom: 4}),
    "13": L.tileLayer('tiles/13/{z}/{x}/{y}.webp', {tileSize: 1024, noWrap: true, minNativeZoom: 0, maxNativeZoom: 0, minZoom: -4, maxZoom: 4}),
    "14": L.tileLayer('tiles/14/{z}/{x}/{y}.webp', {tileSize: 1024, noWrap: true, minNativeZoom: 0, maxNativeZoom: 0, minZoom: -4, maxZoom: 4}),
    "15": L.tileLayer('tiles/15/{z}/{x}/{y}.webp', {tileSize: 1024, noWrap: true, minNativeZoom: 0, maxNativeZoom: 0, minZoom: -4, maxZoom: 4}),
    "16": L.tileLayer('tiles/16/{z}/{x}/{y}.webp', {tileSize: 1024, noWrap: true, minNativeZoom: 0, maxNativeZoom: 0, minZoom: -4, maxZoom: 4}),
}

var bounds = [
    [3000, 3000],
    [7000, 7000]
]

const map = L.map('map', {
    crs: CRSPixel,
    layers: [floors["7"]],
    minZoom: -4,
    maxZoom: 4,
    maxBounds: bounds,
    zoomSnap: 1,
    zoomDelta: 1
}).setView([3793, 4098], 2)

let spawnsLayer = L.layerGroup().addTo(map);

let curFloor = 7; 

const ZControl = L.Control.extend({
    options: { position: 'topleft' },
    onAdd: function() {
        const container = L.DomUtil.create('div', 'floor-control');

        L.DomEvent.disableClickPropagation(container);
        
        const btnUp = L.DomUtil.create('button', '', container);
        btnUp.innerHTML = '▲';
        btnUp.title = 'Subir Andar';

        btnDisplay = L.DomUtil.create('button', '', container);
        btnDisplay.innerHTML = curFloor;
        btnDisplay.className = 'floor-display';
        L.DomEvent.on(btnDisplay, 'click', (e) => {
            L.DomEvent.stop(e);
            changeFloor(7);
        });

        const btnDown = L.DomUtil.create('button', '', container);
        btnDown.innerHTML = '▼';
        btnDown.title = 'Descer Andar';

        L.DomEvent.on(btnUp, 'click', (e) => {
            L.DomEvent.stop(e);
            if (curFloor > 1) changeFloor(curFloor - 1);
        });

        L.DomEvent.on(btnDown, 'click', (e) => {
            L.DomEvent.stop(e);
            if (curFloor < 16) changeFloor(curFloor + 1);
        });

        return container;
    }
});

map.addControl(new ZControl());

function changeFloor(novoAndar) {

    if (!floors[novoAndar.toString()]) {
        return
    }

    map.removeLayer(floors[curFloor.toString()]);
    
    curFloor = novoAndar;
    floors[curFloor.toString()].addTo(map);
    btnDisplay.innerHTML = curFloor;

    const points = getPointsToMarkSpawn();
    markSpawnPoints(points);
}

map.on('click', function(e) {
    if (activeSelector) map.removeLayer(activeSelector);
    if (activeCross) map.removeLayer(activeCross);

    const x = Math.floor(e.latlng.lng) + 0.5;
    const y = Math.floor(e.latlng.lat) + 0.5;    
    raio = 0.5

    var bounds = [
        [y + raio, x + raio],
        [y - raio, x - raio]
    ];
    
    activeSelector = L.rectangle(bounds, {color: "#333333", weight: 1, fillOpacity: 0, smoothFactor: 0, interactive: false}).addTo(map);

    xMeio = x; 
    yMeio = y;

    const linhaV = L.polyline([[0, xMeio], [limitY, xMeio]], {color: '#333333', weight: 1, interactive: false});
    const linhaH = L.polyline([[yMeio, 0], [yMeio, limitX]], {color: '#333333', weight: 1, interactive: false});
    activeCross = L.layerGroup([linhaV, linhaH]).addTo(map);
    
    display.innerText = `X: ${Math.floor(x)}, Y: ${Math.floor(y)}, Z: ${curFloor}`;
});

function distClick(event, dist) {
    distButtons.forEach(element => {
        element.classList.remove('active');
    });

    event.currentTarget.classList.add('active');
    switch(dist) {
        case 0: 
            curDist = {min: 0, max: 30}
            break
        case 1: 
            curDist = {min: 30, max: 500}
            break
        case 2: 
            curDist = {min: 500, max: Math.max(limitY, limitX)}
            break
    }
}

function dirClick(dir) {
    curDir = dir * 45
    pasteAndFill()
}

function focusPoint(x, y, z, zoom) {
    if (z !== undefined && z !== curFloor) {
        changeFloor(z); 
    }

    x = clamp(x, bounds[0][0], bounds[1][0]);
    y = clamp(y, bounds[0][1], bounds[1][1]);

    map.setView([y, x], zoom); 
}

async function pasteAndFill() {
    try {
        const cbxModoTeste = document.getElementById('checkbox-modo');

        if (cbxModoTeste.checked) {
            text =  display.textContent;
        }
        else {
            text = await navigator.clipboard.readText();
        }

        const regex = /(?:X[:\s]*)?(\d+)[^0-9]+(?:Y[:\s]*)?(\d+)[^0-9]+(?:Z[:\s]*)?(\d+)/i;
        const match = text.match(regex);

        if (!match) {
            return false;
        }

        if (match.length < 3) {
            return false;
        }
      
        point = {x: parseInt(match[1]), y: parseInt(match[2]), z: parseInt(match[3]), dist: curDist, ang: curDir};
        point.points = getPoints({x: point.x, y: point.y, z: point.z}, point.ang, point.dist.min, point.dist.max);
        infos.push(point);
        updateMarks();
        listUpdate();
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

function degToRad(deg) {
    return deg * (Math.PI / 180);
}

function calcDist(x1, y1, x2, y2) {
    let dx = x2 - x1;
    let dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

function getSquarePoints(pos, dist) {
    const points = [
        {x: pos.x - dist, y: pos.y - dist},
        {x: pos.x + dist, y: pos.y - dist},
        {x: pos.x + dist, y: pos.y + dist},
        {x: pos.x - dist, y: pos.y + dist}
    ]

    return points;
}

function getPoints(pos, ang, distMin, distMax) {
    if (ang === -45) {
        return getSquarePoints(pos, 30);
    }

    const innerPoints = [];
    const outerPoints = [];
    const angles = [degToRad(ang - 22.5), degToRad(ang), degToRad(ang + 22.5)];

    angles.forEach((angle, i) => {
        cos = Math.cos(angle);
        sin = Math.sin(angle);

        if (distMin === 0) {
            pad = 0.5; 
        }
        else {
            pad = 0
        }

        div = Math.max(Math.abs(cos), Math.abs(sin));
        multMin = (distMin) / div;
        multMax = distMax / div;

        x_min = pos.x + (cos * multMin) + pad;
        y_min = pos.y + (sin * multMin) + pad;
        x_max = pos.x + (cos * multMax);
        y_max = pos.y + (sin * multMax);
        
        innerPoints.push({x: x_min, y: y_min});
        outerPoints.push({x: x_max, y: y_max});
    });
    
    const points = [...innerPoints, ...outerPoints.reverse()];
    return points;
}

function updateMarks() {
    calcIntersection();

    if (intersection.mark) {        
        intersection.mark.addTo(map);
        focusPoint(intersection.center[0], intersection.center[1], curFloor, getZoomLevelFromBox(intersection.box));

        const width = Math.abs(intersection.box[2] - intersection.box[0]);
        const height = Math.abs(intersection.box[3] - intersection.box[1]);

        if (width <= 500 && height <= 500) {
            const spawnsInBox = getPointsToMarkSpawn();
            markSpawnPoints(spawnsInBox);
        }
    }
}
    
function listUpdate() {
    const listContainer = document.getElementById('pos-list');
    listContainer.innerHTML = ''; 

    infos.forEach((info, index) => {
        const div = document.createElement('div');
        div.className = 'pos-item'; 
        
        const span = document.createElement('span');
        span.innerText = `${info.x}, ${info.y}, ${info.z} `;
        div.appendChild(span);

        const dirbtn = document.createElement('img');
        dirbtn.src = `/imgs_finder/${directions[info.ang]}.png`
        dirbtn.className = 'del-btn'; 

        const delbtn = document.createElement('img');
        delbtn.src = '/imgs_finder/Delete.png'
        delbtn.className = 'del-btn'; 
        

        delbtn.onclick = () => {            
            infos.splice(index, 1);
            updateMarks();
            listUpdate();
        };

        div.appendChild(dirbtn)
        div.appendChild(delbtn);
        listContainer.appendChild(div);
    });
}

function clearList() {
    infos = []

    if (intersection.mark) {
        map.removeLayer(intersection.mark);
        intersection = {mark: null, center: null, centroid: null, box: null};
    }

    listUpdate();
}

function getPointsToMarkSpawn()  {
    if (!intersection.box) {
        return [];
    }

    const [xMin, yMin, xMax, yMax] = intersection.box;

    return allSpawnMarks.filter(pos => {
        if (pos.z !== curFloor) {
            return false;
        }

        return pos.x >= xMin &&
               pos.x <= xMax &&
               pos.y >= yMin &&
               pos.y <= yMax;
    });
}

function markSpawnPoints(points) {
    spawnsLayer.clearLayers();

    points.forEach(point => {
        const marker = L.circle([point.y - 0.5, point.x - 0.5], {
            radius: 1.5,
            color: '#000000',
            fillColor: '#000000',
            fillOpacity: 0.3,
            weight: 1,
            interactive: false
        });

        marker.addTo(spawnsLayer)
    });
}

function getZoomLevelFromBox(bbox) {
    if (!bbox) return 2;

    const width = Math.abs(bbox[2] - bbox[0]);
    const height = Math.abs(bbox[3] - bbox[1]);
    const maxDim = Math.max(width, height);

    if (maxDim > 1000) return -1;
    if (maxDim > 500)  return 0;
    if (maxDim > 200)  return 1;
    if (maxDim > 50)   return 2;
    if (maxDim > 10)   return 3;
    return 4;
}

function calcIntersection() {
    if (intersection.mark) {
        map.removeLayer(intersection.mark);
    }

    intersection = {mark: null, center: null, centroid: null, box: null};

    let curIntersection = null;
    
    for (let i =0; i < infos.length; i++) {
        let coords = infos[i].points.map(p => [p.x, p.y]);
        coords.push([infos[i].points[0].x, infos[i].points[0].y]);

        let polyTurf = turf.polygon([coords]);

        if (i === 0) {
            curIntersection = polyTurf;        
        }
        else {
            curIntersection = turf.intersect(curIntersection, polyTurf);
        }

        if (!curIntersection) {
            break;
        }
    }

    if (curIntersection) {
        intersection.box = turf.bbox(curIntersection);
        const center = turf.center(curIntersection);
        const centroid = turf.centroid(curIntersection);
        intersection.center = [center.geometry.coordinates[0], center.geometry.coordinates[1]];
        intersection.centroid = [centroid.geometry.coordinates[0], centroid.geometry.coordinates[1]];

        intersection.mark = L.geoJSON(curIntersection, {
            style: {
                color: '#161761',
                weight: 2,
                fillColor: '#161761',
                fillOpacity: 0.3
            }
        });
    }
}
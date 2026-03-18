const display = document.getElementById('coords-display');

let seletorAtivo = null;
let cruzAtiva = null;

let limiteX = 7000
let limiteY = 7000

let curDist = {min: 20, max: 200}
let curDir = 0

let infos = []

var CRSPixel = L.Util.extend(L.CRS.Simple, {
    transformation: new L.Transformation(1, 0, 1, 0)
})

const andares = {
    "1": L.tileLayer('tiles/1/{z}/{x}/{y}.webp', {tileSize: 256, noWrap: true, minNativeZoom: 0, maxNativeZoom: 0, minZoom: -4, maxZoom: 4}),
    "2": L.tileLayer('tiles/2/{z}/{x}/{y}.webp', {tileSize: 256, noWrap: true, minNativeZoom: 0, maxNativeZoom: 0, minZoom: -4, maxZoom: 4}),
    "3": L.tileLayer('tiles/3/{z}/{x}/{y}.webp', {tileSize: 256, noWrap: true, minNativeZoom: 0, maxNativeZoom: 0, minZoom: -4, maxZoom: 4}),
    "4": L.tileLayer('tiles/4/{z}/{x}/{y}.webp', {tileSize: 256, noWrap: true, minNativeZoom: 0, maxNativeZoom: 0, minZoom: -4, maxZoom: 4}),
    "5": L.tileLayer('tiles/5/{z}/{x}/{y}.webp', {tileSize: 256, noWrap: true, minNativeZoom: 0, maxNativeZoom: 0, minZoom: -4, maxZoom: 4}),
    "6": L.tileLayer('tiles/6/{z}/{x}/{y}.webp', {tileSize: 256, noWrap: true, minNativeZoom: 0, maxNativeZoom: 0, minZoom: -4, maxZoom: 4}),
    "7": L.tileLayer('tiles/7/{z}/{x}/{y}.webp', {tileSize: 256, noWrap: true, minNativeZoom: 0, maxNativeZoom: 0, minZoom: -4, maxZoom: 4}),
    "8": L.tileLayer('tiles/8/{z}/{x}/{y}.webp', {tileSize: 256, noWrap: true, minNativeZoom: 0, maxNativeZoom: 0, minZoom: -4, maxZoom: 4}),
    "9": L.tileLayer('tiles/9/{z}/{x}/{y}.webp', {tileSize: 256, noWrap: true, minNativeZoom: 0, maxNativeZoom: 0, minZoom: -4, maxZoom: 4}),
    "10": L.tileLayer('tiles/10/{z}/{x}/{y}.webp', {tileSize: 256, noWrap: true, minNativeZoom: 0, maxNativeZoom: 0, minZoom: -4, maxZoom: 4}),
    "11": L.tileLayer('tiles/11/{z}/{x}/{y}.webp', {tileSize: 256, noWrap: true, minNativeZoom: 0, maxNativeZoom: 0, minZoom: -4, maxZoom: 4}),
    "12": L.tileLayer('tiles/12/{z}/{x}/{y}.webp', {tileSize: 256, noWrap: true, minNativeZoom: 0, maxNativeZoom: 0, minZoom: -4, maxZoom: 4}),
    "13": L.tileLayer('tiles/13/{z}/{x}/{y}.webp', {tileSize: 256, noWrap: true, minNativeZoom: 0, maxNativeZoom: 0, minZoom: -4, maxZoom: 4}),
    "14": L.tileLayer('tiles/14/{z}/{x}/{y}.webp', {tileSize: 256, noWrap: true, minNativeZoom: 0, maxNativeZoom: 0, minZoom: -4, maxZoom: 4}),
    "15": L.tileLayer('tiles/15/{z}/{x}/{y}.webp', {tileSize: 256, noWrap: true, minNativeZoom: 0, maxNativeZoom: 0, minZoom: -4, maxZoom: 4}),
    "16": L.tileLayer('tiles/16/{z}/{x}/{y}.webp', {tileSize: 256, noWrap: true, minNativeZoom: 0, maxNativeZoom: 0, minZoom: -4, maxZoom: 4}),
}
// 1. Configura o mapa para o plano 2D
const map = L.map('map', {
    crs: CRSPixel,
    layers: [andares["7"]],
    minZoom: -4,
    maxZoom: 4,
    maxbounds: [[0, 0], [26, 19]],
    zoomSnap: 1,
    zoomDelta: 1
}).setView([4056, 3689], -2)

let marks = L.layerGroup().addTo(map);

let andarAtual = 7; // Começa no 7 conforme seu setView

const ZControl = L.Control.extend({
    options: { position: 'topleft' },
    onAdd: function() {
        const container = L.DomUtil.create('div', 'floor-control');
        
        const btnUp = L.DomUtil.create('button', '', container);
        btnUp.innerHTML = '▲';
        btnUp.title = 'Subir Andar';

        const btnDown = L.DomUtil.create('button', '', container);
        btnDown.innerHTML = '▼';
        btnDown.title = 'Descer Andar';

        // Evento Subir
        L.DomEvent.on(btnUp, 'click', (e) => {
            L.DomEvent.stop(e);
            if (andarAtual < 16) mudarAndar(andarAtual + 1);
        });

        // Evento Descer
        L.DomEvent.on(btnDown, 'click', (e) => {
            L.DomEvent.stop(e);
            if (andarAtual > 1) mudarAndar(andarAtual - 1);
        });

        return container;
    }
});

map.addControl(new ZControl());

function mudarAndar(novoAndar) {
    // 1. Remove a camada de tiles atual
    map.removeLayer(andares[andarAtual.toString()]);
    
    // 2. Atualiza a variável e adiciona a nova camada
    andarAtual = novoAndar;
    andares[andarAtual.toString()].addTo(map);
}

map.on('click', function(e) {
    if (seletorAtivo) map.removeLayer(seletorAtivo);
    if (cruzAtiva) map.removeLayer(cruzAtiva);

    const x = Math.floor(e.latlng.lng) + 0.5;
    const y = Math.floor(e.latlng.lat) + 0.5;    
    raio = 0.5

    var bounds = [
        [y + raio, x + raio],
        [y - raio, x - raio]
    ];
    
    seletorAtivo = L.rectangle(bounds, {color: "#333333", weight: 1, fillOpacity: 0, smoothFactor: 0, interactive: false}).addTo(map);

    xMeio = x; 
    yMeio = y;

    const linhaV = L.polyline([[0, xMeio], [limiteY, xMeio]], {color: '#333333', weight: 1, interactive: false});
    const linhaH = L.polyline([[yMeio, 0], [yMeio, limiteX]], {color: '#333333', weight: 1, interactive: false});
    cruzAtiva = L.layerGroup([linhaV, linhaH]).addTo(map);
    
    // Atualiza o texto do elemento
    display.innerText = `X: ${Math.floor(x)}, Y: ${Math.floor(y)} | Z: ${andarAtual}`;
});

function distClick(dist) {
    switch(dist) {
        case 0: 
            curDist = {min: 0, max: 20}
            break
        case 1: 
            curDist = {min: 20, max: 200}
            break
        case 2: 
            curDist = {min: 200, max: Math.max(limiteY, limiteX)}
            break
    }
}

function dirClick(dir) {
    curDir = dir * 45
    pasteAndFill()
}

function focarPonto(x, y, z) {
    console.log(z)
    if (z !== undefined && z !== andarAtual) {
        mudarAndar(z); 
    }

    map.setView([y, x], 0); 
}

async function pasteAndFill() {
    try {
        const text = await navigator.clipboard.readText();
        const regex = /(?:X[:\s]*)?(\d+)[^0-9]+(?:Y[:\s]*)?(\d+)[^0-9]+(?:Z[:\s]*)?(\d+)/i;
        const match = text.match(regex);

        if (!match) {
            return false;
        }

        if (match.length < 3) {
            return false;
        }
      
        point = {x: parseInt(match[1]), y: parseInt(match[2]), z: parseInt(match[3]), dist: curDist, ang: curDir};
        point.mark = obterListaPontos({x: point.x, y: point.y}, point.ang, point.dist.min, point.dist.max);
        map.setView([point.y, point.x], map.getZoom());
        focarPonto(point.x, point.y, point.z);
        infos.push(point);
        AtualizarLista();
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

function degToRad(deg) {
    return deg * (Math.PI / 180);
}

function calcularDistancia(x1, y1, x2, y2) {
    let dx = x2 - x1;
    let dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

function obterListaPontos(pos, ang, distMin, distMax) {
    const pontosMin = [];
    const pontosMax = [];
    const angulos = [degToRad(ang - 22.5), degToRad(ang), degToRad(ang + 22.5)];

    angulos.forEach(angulo => {
        cos = Math.cos(angulo);
        sin = Math.sin(angulo);

        if (distMin === 0) {
            pad = 0.5; 
        }
        else {
            pad = 0
        }

        div = Math.max(Math.abs(cos), Math.abs(sin));
        multMin = (distMin) / div;
        multMax = Math.min(distMax, 5000) / div;

        x_min = pos.x + (cos * multMin) + pad;
        y_min = pos.y + (sin * multMin) + pad;
        x_max = pos.x + (cos * multMax);
        y_max = pos.y + (sin * multMax);
        pontosMin.push({x: x_min, y: y_min});
        pontosMax.push({x: x_max, y: y_max});
    });
    //reverse para garantir a ordem correta dos pontos (sentido horário ou anti-horário)
    const pontos = [...pontosMin, ...pontosMax.reverse()];
    return L.polygon(pontos.map(p => [p.y, p.x]), {
        color: "#161761", 
        weight: 1, 
        fillOpacity: 0.2, 
        smoothFactor: 0
    }).addTo(marks);
}
    
function AtualizarLista() {
    const listContainer = document.getElementById('pos-list');
    listContainer.innerHTML = ''; 

    // Usamos o index para saber exatamente qual item remover do array
    infos.forEach((info, index) => {
        const div = document.createElement('div');
        div.className = 'pos-item'; 
        
        // Texto das coordenadas
        const span = document.createElement('span');
        span.innerText = `X: ${info.x}, Y: ${info.y}, Z: ${info.z} `;
        div.appendChild(span);

        // Botão de deletar
        const delbtn = document.createElement('button');
        delbtn.innerText = 'X';
        delbtn.className = 'del-btn'; // Para você estilizar no CSS
        
        delbtn.onclick = () => {
            // 1. Remove o polígono (layer) do mapa
            if (info.mark) {
                map.removeLayer(info.mark);
            }
            
            // 2. Remove o item do array 'infos'
            infos.splice(index, 1);
            
            // 3. Atualiza a interface novamente
            AtualizarLista();
        };

        div.appendChild(delbtn);
        listContainer.appendChild(div);
    });
}

function LimparLista() {
    infos.forEach(info => {
        if (info.mark) {
            map.removeLayer(info.mark);
        }
    });
    infos = []
    console.log(infos)
    AtualizarLista();
}
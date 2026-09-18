export const directionsMap = {
    0: "East", 45: "SouthEast", 90: "South", 135: "SouthWest",
    180: "West", 225: "NorthWest", 270: "North", 315: "NorthEast"
};

export function degToRad(deg) {
    return deg * (Math.PI / 180);
}

export function getSquarePoints(pos, dist) {
    return [
        { x: pos.x - dist, y: pos.y - dist },
        { x: pos.x + dist, y: pos.y - dist },
        { x: pos.x + dist, y: pos.y + dist },
        { x: pos.x - dist, y: pos.y + dist }
    ];
}

export function getPoints(pos, ang, distMin, distMax) {
    if (ang === -45) return getSquarePoints(pos, 29.5);

    const innerPoints = [];
    const outerPoints = [];
    const angles = [degToRad(ang - 22.5), degToRad(ang), degToRad(ang + 22.5)];

    angles.forEach((angle) => {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const pad = (distMin === 0) ? 0.5 : 0;
        const div = Math.max(Math.abs(cos), Math.abs(sin)) || 1;

        const minRadius = (distMin === 0) ? 0: distMin - 0.5
        const multMin = minRadius / div;
        const multMax = (distMax + 0.5) / div;

        innerPoints.push({ x: pos.x + (cos * multMin), y: pos.y + (sin * multMin)});
        outerPoints.push({ x: pos.x + (cos * multMax), y: pos.y + (sin * multMax)});
    });

    return [...innerPoints, ...outerPoints.reverse()];
}

export function calcIntersectionPolygon(infos) {
    if (!infos || infos.length === 0) return null;

    let curIntersection = null;    

    for (let i = 0; i < infos.length; i++) {
        const coords = infos[i].points.map(p => [p.x, p.y]);
        coords.push([infos[i].points[0].x, infos[i].points[0].y]);

        const polyTurf = turf.polygon([coords]);
        curIntersection = (i === 0) ? polyTurf : turf.intersect(curIntersection, polyTurf);

        if (!curIntersection) break;
    }

    return curIntersection;
}

export function getZoomLevelFromBox(bbox) {
    if (!bbox) return 2;
    const maxDim = Math.max(Math.abs(bbox[2] - bbox[0]), Math.abs(bbox[3] - bbox[1]));

    if (maxDim > 1000) return -1;
    if (maxDim > 500)  return 0;
    if (maxDim > 200)  return 1;
    if (maxDim > 50)   return 2;
    if (maxDim > 10)   return 3;
    return 4;
}

export function isPointWithinBounds(x, y, bounds) {
    if (!bounds || bounds.length < 2) return true;

    const yMin = bounds[0][0];
    const xMin = bounds[0][1];
    const yMax = bounds[1][0];
    const xMax = bounds[1][1];

    return x >= xMin && x <= xMax && y >= yMin && y <= yMax;
}

export function isPointInExcludeAreas(point, excludeAreas) {
    if (!excludeAreas || !Array.isArray(excludeAreas) || excludeAreas.length === 0) {
        return false;
    }

    const [x, y] = Array.isArray(point) ? point : [point.x, point.y];

    return excludeAreas.some(box => {
        // Valida se a caixa de exclusão tem exatamente os 4 pontos [x1, y1, x2, y2]
        if (!box || !Array.isArray(box) || box.length < 4) return false;

        const [x1, y1, x2, y2] = box;
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);

        return x >= minX && x <= maxX && y >= minY && y <= maxY;
    });
}

export function filterSpawnsInsidePolygon(searchPoly, spawns, bounds, excludeAreas, useIslandsFilter) {
    if (!spawns || !Array.isArray(spawns)) return [];

    // Se houver polígono de busca, converte/garante que é uma Feature
    const polyFeature = searchPoly ? (searchPoly.type === 'Feature' ? searchPoly : turf.feature(searchPoly)) : null;

    return spawns.filter(spawn => {
        if (!spawn || spawn.length < 2) return false;

        const [x, y] = spawn;

        // 1. Descarta se estiver em uma área excluída
        if (isPointInExcludeAreas([x, y], excludeAreas)) {
            return false;
        }

        // 2. Descarta se estiver fora do bounds do mapa
        if (bounds && bounds.length >= 2) {
            const [[yMin, xMin], [yMax, xMax]] = bounds;
            if (x < xMin || x > xMax || y < yMin || y > yMax) return false;
        }

        // 3. Testa se o ponto está dentro do polígono de busca do Turf
        if (polyFeature) {
            const pt = turf.point([x, y]);
            if (turf.booleanPointInPolygon(pt, polyFeature)) return true;

            const line = turf.polygonToLine(polyFeature);
            const distToBorder = turf.pointToLineDistance(pt, line, { units : 'degrees' });

            return distToBorder <= 3;
        }

        return true;
    });
}

export function createBoundsPolygon(bounds) {
    if (!bounds || bounds.length < 2) return null;

    const [yMin, xMin] = bounds[0];
    const [yMax, xMax] = bounds[1];

    return turf.polygon([[
        [xMin, yMin],
        [xMax, yMin],
        [xMax, yMax],
        [xMin, yMax],
        [xMin, yMin]
    ]]);
}

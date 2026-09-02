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
    if (ang === -45) return getSquarePoints(pos, 30);

    const innerPoints = [];
    const outerPoints = [];
    const angles = [degToRad(ang - 22.5), degToRad(ang), degToRad(ang + 22.5)];

    angles.forEach((angle) => {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const pad = (distMin === 0) ? 0.5 : 0;
        const div = Math.max(Math.abs(cos), Math.abs(sin));

        const multMin = distMin / div;
        const multMax = distMax / div;

        innerPoints.push({ x: pos.x + (cos * multMin) + pad, y: pos.y + (sin * multMin) + pad });
        outerPoints.push({ x: pos.x + (cos * multMax), y: pos.y + (sin * multMax) });
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

export function isPointInExcludeAreas(x, y, excludeAreas = []) {
    if (!excludeAreas || excludeAreas.length === 0) return false;

    const pt = turf.point([x, y]);

    return excludeAreas.some(area => {
        if (Array.isArray(area) && area.length === 4) {
            return x >= area[0] && y >= area[1] && x <= area[2] && y <= area[3];
        }
        return turf.booleanPointInPolygon(pt, area);
    });
}

export function filterSpawnsInsidePolygon(curIntersection, allSpawnMarks, bounds = null, excludeAreas = []) {
    if (!curIntersection || !allSpawnMarks) return [];

    return allSpawnMarks.filter(pos => {
        const x = pos[0];
        const y = pos[1];

        if (bounds && !isPointWithinBounds(x, y, bounds)) return false;

        if (isPointInExcludeAreas(x, y, excludeAreas)) return false;

        const pt = turf.point([x, y]);
        return turf.booleanPointInPolygon(pt, curIntersection);
    });
}

export function findMostProbableSpawn(pointsInside) {
    if (!pointsInside || pointsInside.length === 0) return null;
    if (pointsInside.length === 1) return pointsInside[0];

    let bestPoint = null;
    let minTotalDistance = Infinity;

    for (let i = 0; i < pointsInside.length; i++) {
        let totalDist = 0;
        const p1 = pointsInside[i];

        for (let j = 0; j < pointsInside.length; j++) {
            if (i === j) continue;
            const p2 = pointsInside[j];
            
            const dx = p1[0] - p2[0];
            const dy = p1[1] - p2[1];
            totalDist += Math.sqrt(dx * dx + dy * dy);
        }

        if (totalDist < minTotalDistance) {
            minTotalDistance = totalDist;
            bestPoint = p1;
        }
    }

    return bestPoint; 
}
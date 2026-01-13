
// Mock strict logic from converter.js
const k0 = 1.0000067;
const a = 6378137.0;
const b = 6356752.3142;
const f = (a - b) / a;
const e = Math.sqrt(f * (2 - f));
const e2 = e * e;
const esq = (1 - (b / a) * (b / a));
const e_prime_sq = esq / (1 - esq);
const lon0 = 0.614503320045622;
const lat0 = 0.553864476827628;
const false_e = 219529.584;
const false_n = 626907.390;

function itmToWgs84(x, y) {
    // Calculate M0 (Meridional distance from equator to lat0)
    const M0 = a * ((1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256) * lat0
        - (3 * e2 / 8 + 3 * e2 * e2 / 32 + 45 * e2 * e2 * e2 / 1024) * Math.sin(2 * lat0)
        + (15 * e2 * e2 / 256 + 45 * e2 * e2 * e2 / 1024) * Math.sin(4 * lat0)
        - (35 * e2 * e2 * e2 / 3072) * Math.sin(6 * lat0));

    // Calculate M (Meridional distance for the point)
    const M = M0 + (y - false_n) / k0;

    const mu = M / (a * (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256));

    const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
    const J1 = (3 * e1 / 2 - 27 * e1 * e1 * e1 / 32);
    const J2 = (21 * e1 * e1 / 16 - 55 * e1 * e1 * e1 * e1 / 32);
    const J3 = (151 * e1 * e1 / 96);
    const J4 = (1097 * e1 * e1 * e1 * e1 / 512);

    const fp = mu + J1 * Math.sin(2 * mu) + J2 * Math.sin(4 * mu) + J3 * Math.sin(6 * mu) + J4 * Math.sin(8 * mu);

    const T1 = Math.tan(fp) * Math.tan(fp);
    const C1 = e_prime_sq * Math.cos(fp) * Math.cos(fp);
    const R1 = a * (1 - e2) / Math.pow(1 - e2 * Math.sin(fp) * Math.sin(fp), 1.5);
    const N1 = a / Math.sqrt(1 - e2 * Math.sin(fp) * Math.sin(fp));
    const D = (x - false_e) / (N1 * k0);

    const Q1 = N1 * Math.tan(fp) / R1;
    const Q2 = D * D / 2;
    const Q3 = (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * e_prime_sq) * D * D * D * D / 24;
    const Q4 = (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * e_prime_sq - 3 * C1 * C1) * D * D * D * D * D * D / 720;

    const latRad = fp - Q1 * (Q2 - Q3 + Q4);

    const Q5 = D;
    const Q6 = (1 + 2 * T1 + C1) * D * D * D / 6;
    const Q7 = (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * e_prime_sq + 24 * T1 * T1) * D * D * D * D * D / 120;

    const lonRad = lon0 + (Q5 - Q6 + Q7) / Math.cos(fp);

    return {
        lat: latRad * 180 / Math.PI,
        lon: lonRad * 180 / Math.PI
    };
}

// Test cases
// Tel Aviv (approx)
const ta_itm = { x: 178700, y: 664300 };
const ta_wgs = itmToWgs84(ta_itm.x, ta_itm.y);
console.log(`Tel Aviv: ITM(${ta_itm.x}, ${ta_itm.y}) -> WGS84(${ta_wgs.lat}, ${ta_wgs.lon})`);

// Eilat (approx - extreme south)
const eilat_itm = { x: 195000, y: 387000 };
const eilat_wgs = itmToWgs84(eilat_itm.x, eilat_itm.y);
console.log(`Eilat: ITM(${eilat_itm.x}, ${eilat_itm.y}) -> WGS84(${eilat_wgs.lat}, ${eilat_wgs.lon})`);

// Metula (approx - extreme north)
const metula_itm = { x: 253000, y: 798000 };
const metula_wgs = itmToWgs84(metula_itm.x, metula_itm.y);
console.log(`Metula: ITM(${metula_itm.x}, ${metula_itm.y}) -> WGS84(${metula_wgs.lat}, ${metula_wgs.lon})`);

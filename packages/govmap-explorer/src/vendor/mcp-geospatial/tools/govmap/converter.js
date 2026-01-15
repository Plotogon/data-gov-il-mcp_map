/**
 * Coordinate Converter Tool
 * ITM (Israel Transverse Mercator) ↔ WGS84 conversion
 */

import { z } from 'zod';

/**
 * Convert ITM to WGS84 (approximate formula)
 */
// ITM (Israel New Grid) coordinate system constants (GRS80 ellipsoid)
const k0 = 1.0000067;
const a = 6378137.0;
const b = 6356752.3142;
const f = (a - b) / a;
const e = Math.sqrt(f * (2 - f));
const e2 = e * e;
const esq = (1 - (b / a) * (b / a));
const e_prime_sq = esq / (1 - esq);
const lon0 = 0.614503320045622; // 35.2045 degrees in radians
const lat0 = 0.553864476827628; // 31.7340969 degrees in radians (Approx) - Using standard ITM false northing origin
// Accurate Shift for ITM:
const false_e = 219529.584;
const false_n = 626907.390;

/**
 * Convert ITM (Israel Transverse Mercator) to WGS84 (Lat/Lon)
 * Using precise Transverse Mercator inverse formulas
 */
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
    const J3 = (151 * e1 * e1 * e1 / 96);
    const J4 = (1097 * e1 * e1 * e1 * e1 / 512);

    const fp = mu + J1 * Math.sin(2 * mu) + J2 * Math.sin(4 * mu) + J3 * Math.sin(6 * mu) + J4 * Math.sin(8 * mu);

    const C1 = e_prime_sq * Math.cos(fp) * Math.cos(fp);
    const T1 = Math.tan(fp) * Math.tan(fp);
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

/**
 * Convert WGS84 (Lat/Lon) to ITM (Israel Transverse Mercator)
 * Using precise Transverse Mercator forward formulas
 */
function wgs84ToItm(lat, lon) {
    const latRad = lat * Math.PI / 180;
    const lonRad = lon * Math.PI / 180;

    const N = a / Math.sqrt(1 - e2 * Math.sin(latRad) * Math.sin(latRad));
    const T = Math.tan(latRad) * Math.tan(latRad);
    const C = e_prime_sq * Math.cos(latRad) * Math.cos(latRad);
    const A = (lonRad - lon0) * Math.cos(latRad);

    const M = a * ((1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256) * latRad
        - (3 * e2 / 8 + 3 * e2 * e2 / 32 + 45 * e2 * e2 * e2 / 1024) * Math.sin(2 * latRad)
        + (15 * e2 * e2 / 256 + 45 * e2 * e2 * e2 / 1024) * Math.sin(4 * latRad)
        - (35 * e2 * e2 * e2 / 3072) * Math.sin(6 * latRad));

    const y = false_n + k0 * (M + N * Math.tan(latRad) * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * A * A * A * A / 24
        + (61 - 58 * T + T * T + 600 * C - 330 * e_prime_sq) * A * A * A * A * A * A / 720));

    const x = false_e + k0 * N * (A + (1 - T + C) * A * A * A / 6
        + (5 - 18 * T + T * T + 72 * C - 58 * e_prime_sq) * A * A * A * A * A / 120);

    return { x, y };
}

/**
 * Register coordinate converter tool
 * @param {McpServer} server - MCP server instance
 */
export function registerConverterTool(server) {
    server.tool(
        "convert_coordinates",
        {
            from_system: z.enum(['itm', 'wgs84']).describe("Source coordinate system: 'itm' or 'wgs84'"),
            to_system: z.enum(['itm', 'wgs84']).describe("Target coordinate system: 'itm' or 'wgs84'"),
            x: z.number().optional().describe("X coordinate (for ITM) or Longitude (for WGS84)"),
            y: z.number().optional().describe("Y coordinate (for ITM) or Latitude (for WGS84)"),
            lat: z.number().optional().describe("Latitude (for WGS84)"),
            lon: z.number().optional().describe("Longitude (for WGS84)")
        },
        async ({ from_system, to_system, x, y, lat, lon }) => {
            try {
                let result;

                if (from_system === 'itm' && to_system === 'wgs84') {
                    if (!x || !y) {
                        return {
                            content: [{ type: "text", text: "❌ Error: x and y coordinates required for ITM input" }]
                        };
                    }
                    result = itmToWgs84(x, y);
                    return {
                        content: [{
                            type: "text",
                            text: [
                                "## 🌍 Coordinate Conversion: ITM → WGS84",
                                "",
                                `**Input (ITM):**`,
                                `- X: ${x}`,
                                `- Y: ${y}`,
                                "",
                                `**Output (WGS84):**`,
                                `- **Latitude:** ${result.lat.toFixed(6)}`,
                                `- **Longitude:** ${result.lon.toFixed(6)}`,
                                "",
                                `📍 [View on Google Maps](https://www.google.com/maps?q=${result.lat},${result.lon})`
                            ].join("\n")
                        }]
                    };
                } else if (from_system === 'wgs84' && to_system === 'itm') {
                    const inputLat = lat || y;
                    const inputLon = lon || x;

                    if (!inputLat || !inputLon) {
                        return {
                            content: [{ type: "text", text: "❌ Error: lat/lon or x/y coordinates required for WGS84 input" }]
                        };
                    }
                    result = wgs84ToItm(inputLat, inputLon);
                    return {
                        content: [{
                            type: "text",
                            text: [
                                "## 🌍 Coordinate Conversion: WGS84 → ITM",
                                "",
                                `**Input (WGS84):**`,
                                `- Latitude: ${inputLat}`,
                                `- Longitude: ${inputLon}`,
                                "",
                                `**Output (ITM):**`,
                                `- **X:** ${result.x.toFixed(2)}`,
                                `- **Y:** ${result.y.toFixed(2)}`
                            ].join("\n")
                        }]
                    };
                } else {
                    return {
                        content: [{ type: "text", text: "❌ Error: Invalid conversion (same source and target system)" }]
                    };
                }
            } catch (error) {
                return {
                    content: [{ type: "text", text: `❌ Conversion Error: ${error.message}` }]
                };
            }
        }
    );
}

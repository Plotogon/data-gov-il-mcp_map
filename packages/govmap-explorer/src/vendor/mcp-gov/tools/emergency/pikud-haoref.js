/**
 * Pikud Haoref Emergency Alerts
 * Real-time emergency alerts from Israel's Home Front Command
 */

import axios from 'axios';
import { z } from 'zod';

const ALERTS_URL = 'https://www.oref.org.il/WarningMessages/alert/alerts.json';
const CACHE_DURATION = 5000; // 5 seconds

let alertsCache = {
    data: null,
    timestamp: 0
};

/**
 * Get current emergency alerts
 * @returns {Object} Current alerts
 */
export async function getEmergencyAlerts() {
    console.error(`🚨 Fetching emergency alerts from Pikud Haoref`);

    // Check cache
    const now = Date.now();
    if (alertsCache.data && (now - alertsCache.timestamp) < CACHE_DURATION) {
        console.error(`✅ Returning cached alerts (${Math.floor((now - alertsCache.timestamp) / 1000)}s old)`);
        return alertsCache.data;
    }

    try {
        const response = await axios.get(ALERTS_URL, {
            timeout: 10000,
            headers: {
                'User-Agent': 'MCP-Gov/1.0',
                'Accept': 'application/json'
            },
            validateStatus: () => true
        });

        const result = {
            timestamp: new Date().toISOString(),
            status: response.status,
            hasAlerts: false,
            alerts: [],
            raw: response.data
        };

        // Parse response
        if (response.status === 200 && response.data) {
            if (typeof response.data === 'object') {
                result.hasAlerts = true;

                // Handle different response formats
                if (response.data.data && Array.isArray(response.data.data)) {
                    result.alerts = response.data.data;
                } else if (Array.isArray(response.data)) {
                    result.alerts = response.data;
                } else {
                    result.alerts = [response.data];
                }
            }
        }

        // Update cache
        alertsCache = {
            data: result,
            timestamp: now
        };

        console.error(`✅ Alerts fetched: ${result.hasAlerts ? result.alerts.length + ' active' : 'none'}`);
        return result;

    } catch (error) {
        console.error(`❌ Error fetching alerts:`, error.message);
        throw new Error(`Failed to fetch emergency alerts: ${error.message}`);
    }
}

/**
 * Register the emergency_alerts tool with MCP server
 */
export function registerEmergencyAlertsTool(server) {
    server.tool(
        'emergency_alerts',
        {}, // No parameters needed
        async () => {
            try {
                const result = await getEmergencyAlerts();

                let summary = [
                    `🚨 **Pikud Haoref Emergency Alerts**`,
                    ``,
                    `**Status:** ${result.hasAlerts ? '⚠️ ACTIVE ALERTS' : '✅ No Active Alerts'}`,
                    `**Timestamp:** ${result.timestamp}`,
                    `**Source:** Israel Home Front Command`,
                    ``
                ];

                if (result.hasAlerts && result.alerts.length > 0) {
                    summary.push(`**Active Alerts (${result.alerts.length}):**`);
                    summary.push('');

                    result.alerts.forEach((alert, index) => {
                        summary.push(`### Alert ${index + 1}`);
                        if (typeof alert === 'object') {
                            summary.push('```json');
                            summary.push(JSON.stringify(alert, null, 2));
                            summary.push('```');
                        } else {
                            summary.push(String(alert));
                        }
                        summary.push('');
                    });
                } else {
                    summary.push(`**Message:** No emergency alerts at this time.`);
                    summary.push(`**Note:** Alerts are updated in real-time from oref.org.il`);
                }

                summary.push('');
                summary.push('**Raw Response:**');
                summary.push('```json');
                summary.push(JSON.stringify(result.raw, null, 2).substring(0, 1000));
                summary.push('```');

                return {
                    content: [{
                        type: 'text',
                        text: summary.join('\n')
                    }]
                };

            } catch (error) {
                return {
                    content: [{
                        type: 'text',
                        text: `❌ Error: ${error.message}\n\nFailed to fetch emergency alerts from Pikud Haoref. The service may be temporarily unavailable.`
                    }],
                    isError: true
                };
            }
        }
    );
}

/**
 * Website Analyzer
 * Crawls and analyzes government websites to discover APIs and data sources
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { z } from 'zod';

/**
 * Analyze a website to discover potential APIs
 * @param {string} url - Website URL to analyze
 * @param {number} depth - Crawl depth (1-3)
 * @param {string} focus - What to focus on: api | forms | downloads | all
 * @returns {Object} Analysis results
 */
export async function analyzeWebsite(url, depth = 1, focus = 'all') {
    console.error(`🔍 Analyzing website: ${url} (depth: ${depth}, focus: ${focus})`);

    const results = {
        url,
        timestamp: new Date().toISOString(),
        apis: [],
        forms: [],
        downloads: [],
        documentation: [],
        links: []
    };

    try {
        // Fetch the page
        const response = await axios.get(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'MCP-Discovery/1.0 (API Analysis Bot)'
            }
        });

        const $ = cheerio.load(response.data);

        // Find potential API endpoints
        if (focus === 'api' || focus === 'all') {
            results.apis = findApiEndpoints($, url);
        }

        // Find forms (potential API candidates)
        if (focus === 'forms' || focus === 'all') {
            results.forms = findForms($, url);
        }

        // Find download links
        if (focus === 'downloads' || focus === 'all') {
            results.downloads = findDownloads($, url);
        }

        // Find documentation links
        results.documentation = findDocumentation($, url);

        // Find relevant links for deeper crawling
        if (depth > 1) {
            results.links = findRelevantLinks($, url);
        }

        console.error(`✅ Analysis complete: ${results.apis.length} APIs, ${results.forms.length} forms, ${results.downloads.length} downloads`);

        return results;

    } catch (error) {
        console.error(`❌ Error analyzing website:`, error.message);
        throw new Error(`Failed to analyze ${url}: ${error.message}`);
    }
}

/**
 * Find potential API endpoints in page content
 */
function findApiEndpoints($, baseUrl) {
    const endpoints = [];

    // Look for API-related keywords in links and text
    const apiKeywords = ['api', 'swagger', 'openapi', 'rest', 'graphql', 'endpoint', 'wsdl', 'soap'];

    $('a').each((i, elem) => {
        const href = $(elem).attr('href');
        const text = $(elem).text().toLowerCase();

        if (href && apiKeywords.some(keyword => href.toLowerCase().includes(keyword) || text.includes(keyword))) {
            try {
                endpoints.push({
                    url: new URL(href, baseUrl).href,
                    text: $(elem).text().trim(),
                    type: 'link'
                });
            } catch (e) {
                // Invalid URL, skip
            }
        }
    });

    // Look for API URLs in ALL text content (including scripts)
    const allText = $('html').html() || '';

    // Pattern 1: Standard API URLs
    const urlPattern = /https?:\/\/[^\s<>"{}|\\^`\[\]]+\/api\/[^\s<>"{}|\\^`\[\]]*/gi;
    const matches = allText.match(urlPattern) || [];

    matches.forEach(url => {
        if (!endpoints.find(e => e.url === url)) {
            endpoints.push({
                url,
                text: 'Found in page source',
                type: 'discovered'
            });
        }
    });

    // Pattern 2: CKAN API (common in data.gov.il)
    const ckanPattern = /https?:\/\/[^\s<>"]+\/api\/\d+\/action\/[^\s<>"]*/gi;
    const ckanMatches = allText.match(ckanPattern) || [];

    ckanMatches.forEach(url => {
        if (!endpoints.find(e => e.url === url)) {
            endpoints.push({
                url,
                text: 'CKAN API endpoint',
                type: 'ckan'
            });
        }
    });

    // Pattern 3: Check for known API base URLs
    const knownApis = [
        { pattern: 'data.gov.il', api: 'https://data.gov.il/api/3/action/' },
        { pattern: 'oref.org.il', api: 'https://www.oref.org.il/WarningMessages/alert/alerts.json' }
    ];

    const hostname = new URL(baseUrl).hostname;
    knownApis.forEach(known => {
        if (hostname.includes(known.pattern)) {
            endpoints.push({
                url: known.api,
                text: 'Known API for this domain',
                type: 'known'
            });
        }
    });

    // Look in script tags specifically
    $('script').each((i, elem) => {
        const scriptContent = $(elem).html() || '';
        const scriptUrls = scriptContent.match(/https?:\/\/[^\s<>"']+\/api\/[^\s<>"']*/gi) || [];

        scriptUrls.forEach(url => {
            if (!endpoints.find(e => e.url === url)) {
                endpoints.push({
                    url,
                    text: 'Found in JavaScript',
                    type: 'script'
                });
            }
        });
    });

    return endpoints;
}

/**
 * Find forms that might represent API endpoints
 */
function findForms($, baseUrl) {
    const forms = [];

    $('form').each((i, elem) => {
        const action = $(elem).attr('action');
        const method = $(elem).attr('method') || 'GET';

        if (action) {
            const fields = [];
            $(elem).find('input, select, textarea').each((j, field) => {
                fields.push({
                    name: $(field).attr('name'),
                    type: $(field).attr('type') || 'text',
                    required: $(field).attr('required') !== undefined
                });
            });

            forms.push({
                action: new URL(action, baseUrl).href,
                method: method.toUpperCase(),
                fields
            });
        }
    });

    return forms;
}

/**
 * Find data download links
 */
function findDownloads($, baseUrl) {
    const downloads = [];
    const dataExtensions = ['.json', '.xml', '.csv', '.xlsx', '.pdf', '.zip'];

    $('a').each((i, elem) => {
        const href = $(elem).attr('href');
        if (href && dataExtensions.some(ext => href.toLowerCase().endsWith(ext))) {
            downloads.push({
                url: new URL(href, baseUrl).href,
                text: $(elem).text().trim(),
                type: href.split('.').pop().toLowerCase()
            });
        }
    });

    return downloads;
}

/**
 * Find documentation links
 */
function findDocumentation($, baseUrl) {
    const docs = [];
    const docKeywords = ['documentation', 'docs', 'guide', 'manual', 'api-docs', 'תיעוד'];

    $('a').each((i, elem) => {
        const href = $(elem).attr('href');
        const text = $(elem).text().toLowerCase();

        if (href && docKeywords.some(keyword => href.toLowerCase().includes(keyword) || text.includes(keyword))) {
            docs.push({
                url: new URL(href, baseUrl).href,
                text: $(elem).text().trim()
            });
        }
    });

    return docs;
}

/**
 * Find relevant links for deeper crawling
 */
function findRelevantLinks($, baseUrl) {
    const links = new Set();
    const relevantKeywords = ['api', 'data', 'open', 'developer', 'נתונים'];

    $('a').each((i, elem) => {
        const href = $(elem).attr('href');
        const text = $(elem).text().toLowerCase();

        if (href && relevantKeywords.some(keyword => href.toLowerCase().includes(keyword) || text.includes(keyword))) {
            try {
                const fullUrl = new URL(href, baseUrl).href;
                // Only include links from the same domain
                if (new URL(fullUrl).hostname === new URL(baseUrl).hostname) {
                    links.add(fullUrl);
                }
            } catch (e) {
                // Invalid URL, skip
            }
        }
    });

    return Array.from(links).slice(0, 10); // Limit to 10 links
}

/**
 * Register the analyze_website tool with MCP server
 */
export function registerAnalyzeWebsiteTool(server) {
    server.tool(
        'analyze_website',
        {
            url: z.string().url().describe('Website URL to analyze'),
            depth: z.number().min(1).max(3).optional().describe('Crawl depth (1-3, default: 1)'),
            focus: z.enum(['api', 'forms', 'downloads', 'all']).optional().describe('What to focus on (default: all)')
        },
        async ({ url, depth, focus }) => {
            try {
                const results = await analyzeWebsite(url, depth || 1, focus || 'all');

                const summary = [
                    `🔍 Website Analysis: ${url}`,
                    '',
                    `📊 **Results:**`,
                    `- APIs found: ${results.apis.length}`,
                    `- Forms found: ${results.forms.length}`,
                    `- Downloads found: ${results.downloads.length}`,
                    `- Documentation links: ${results.documentation.length}`,
                    '',
                    `📋 **Details:**`,
                    JSON.stringify(results, null, 2)
                ].join('\n');

                return {
                    content: [{
                        type: 'text',
                        text: summary
                    }]
                };

            } catch (error) {
                return {
                    content: [{
                        type: 'text',
                        text: `❌ Error: ${error.message}`
                    }],
                    isError: true
                };
            }
        }
    );
}

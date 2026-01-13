import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import YahooFinance from 'yahoo-finance2';
import z from 'zod';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

// Initialize Yahoo Finance with survey suppression
// Initialize Yahoo Finance
const yahooFinance = new YahooFinance();

const server = new Server(
    {
        name: "mcp-finance",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// Helper to format currency
const fmt = (val, currency) => {
    if (val === undefined || val === null) return 'N/A';
    return new Intl.NumberFormat('he-IL', { style: 'currency', currency: currency || 'ILA' }).format(val);
};

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "get_tase_data",
                description: "Get real-time (delayed) data for Tel Aviv Stock Exchange (TASE) securities. Valid symbols include stock tickers (e.g., 'TEVA', 'LUMI') or indices.",
                inputSchema: {
                    type: "object",
                    properties: {
                        symbol: {
                            type: "string",
                            description: "Ticker symbol (e.g., 'TEVA', 'LUMI', 'TA35'). The tool will automatically handle the .TA suffix."
                        }
                    },
                    required: ["symbol"]
                }
            },
            {
                name: "get_exchange_rates",
                description: "Get representative exchange rates from Bank of Israel (USD, EUR, GBP, etc.)",
                inputSchema: {
                    type: "object",
                    properties: {},
                    required: []
                }
            }
        ]
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "get_tase_data") {
        let { symbol } = request.params.arguments;
        symbol = symbol.toUpperCase();

        // Heuristic: If it doesn't have a suffix and isn't a known US symbol, append .TA
        // Or if user explicitly asks for TASE. 
        // For simplicity, we assume TASE intent and append .TA if likely needed.
        if (!symbol.includes('.') && !symbol.startsWith('^')) {
            symbol += '.TA';
        }
        // Fix for Index if user types TA35 -> ^TA35.TA ? 
        // Let's just try the symbol as is first, if fail, try variations?
        // For now, simple append.

        try {
            const quote = await yahooFinance.quote(symbol);

            if (!quote) {
                return {
                    content: [{ type: "text", text: `❌ No data found for symbol: ${symbol}` }],
                    isError: true
                };
            }

            const name = quote.shortName || quote.longName || symbol;
            const price = quote.regularMarketPrice;
            const currency = quote.currency;
            const change = quote.regularMarketChange;
            const changePercent = quote.regularMarketChangePercent;
            const marketCap = quote.marketCap ? fmt(quote.marketCap, currency) : 'N/A';
            const volume = quote.regularMarketVolume ? quote.regularMarketVolume.toLocaleString() : 'N/A';

            const isPositive = change >= 0;
            const icon = isPositive ? '📈' : '📉';
            const color = isPositive ? 'green' : 'red';

            const markdown = `
# ${icon} ${name} (${symbol})

**Price:** ${fmt(price, currency)}
**Change:** ${change > 0 ? '+' : ''}${change?.toFixed(2)} (${changePercent?.toFixed(2)}%)

| Metric | Value |
| :--- | :--- |
| **Previous Close** | ${fmt(quote.regularMarketPreviousClose, currency)} |
| **Open** | ${fmt(quote.regularMarketOpen, currency)} |
| **Day Range** | ${fmt(quote.regularMarketDayLow, currency)} - ${fmt(quote.regularMarketDayHigh, currency)} |
| **Volume** | ${volume} |
| **Market Cap** | ${marketCap} |

*Data source: Yahoo Finance (Delayed)*
`;

            return {
                content: [{ type: "text", text: markdown }]
            };

        } catch (error) {
            return {
                content: [{ type: "text", text: `Error fetching data for ${symbol}: ${error.message}` }],
                isError: true
            };
        }
    }

    if (request.params.name === "get_exchange_rates") {
        try {
            const url = 'https://boi.org.il/PublicApi/GetExchangeRates?asXml=true';
            const response = await axios.get(url);
            const parser = new XMLParser();
            const jObj = parser.parse(response.data);

            // Navigate structure (handle potential double nesting of ExchangeRates tag)
            const root = jObj.ExchangeRatesResponseCollectioDTO;
            const rates = root?.ExchangeRates?.ExchangeRateResponseDTO ||
                root?.ExchangeRates?.ExchangeRates?.ExchangeRate ||
                root?.ExchangeRates?.ExchangeRate || [];

            if (rates.length === 0) {
                return {
                    content: [{ type: "text", text: "⚠️ No exchange rates found from Bank of Israel." }],
                    isError: true
                };
            }

            // Common currencies highlights
            const commons = ['USD', 'EUR', 'GBP', 'JOD'];
            const commonRates = rates.filter(r => commons.includes(r.Key));
            const otherRates = rates.filter(r => !commons.includes(r.Key));

            const formatRate = (r) => {
                const change = parseFloat(r.CurrentChange);
                const trend = change > 0 ? '📈' : (change < 0 ? '📉' : '➖');
                return `| **${r.Key}** | ${r.CurrentExchangeRate} | ${trend} ${change}% | ${r.Unit} |`;
            };

            const markdown = `
# 🇮🇱 Bank of Israel Exchange Rates
*Last Update: ${rates[0].LastUpdate.split('T')[0]}*

## Key Currencies
| Currency | Rate (NIS) | Change | Unit |
| :--- | :--- | :--- | :--- |
${commonRates.map(formatRate).join('\n')}

## All Rates
| Currency | Rate (NIS) | Change | Unit |
| :--- | :--- | :--- | :--- |
${otherRates.map(formatRate).join('\n')}
`;
            return {
                content: [{ type: "text", text: markdown }]
            };

        } catch (error) {
            return {
                content: [{ type: "text", text: `Error fetching exchange rates: ${error.message}` }],
                isError: true
            };
        }
    }

    throw new Error("Tool not found");
});

async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("💸 MCP Finance Server running on stdio");
}

runServer().catch((error) => {
    console.error("Fatal error running server:", error);
    process.exit(1);
});

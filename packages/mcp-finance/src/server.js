import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import YahooFinance from 'yahoo-finance2';
import z from 'zod';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { fileURLToPath } from 'url';

// Initialize Yahoo Finance
const yahooFinance = new YahooFinance();

// Helper to format currency
const fmt = (val, currency) => {
    if (val === undefined || val === null) return 'N/A';
    return new Intl.NumberFormat('he-IL', { style: 'currency', currency: currency || 'ILA' }).format(val);
};

export function registerFinanceTools(server) {
    // TASE Data Tool
    server.tool(
        "get_tase_data",
        {
            symbol: z.string().describe("Ticker symbol (e.g., 'TEVA', 'LUMI', 'TA35'). The tool will automatically handle the .TA suffix.")
        },
        async ({ symbol }) => {
            symbol = symbol.toUpperCase();
            if (!symbol.includes('.') && !symbol.startsWith('^')) {
                symbol += '.TA';
            }

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
    );

    // Exchange Rates Tool
    server.tool(
        "get_exchange_rates",
        {},
        async () => {
            try {
                const url = 'https://boi.org.il/PublicApi/GetExchangeRates?asXml=true';
                const response = await axios.get(url);
                const parser = new XMLParser();
                const jObj = parser.parse(response.data);

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
    );
}

async function main() {
    const server = new McpServer({
        name: "mcp-finance",
        version: "1.0.0",
    });

    registerFinanceTools(server);

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("💸 MCP Finance Server running on stdio");
}

// Only run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main().catch((error) => {
        console.error("Fatal error running server:", error);
        process.exit(1);
    });
}

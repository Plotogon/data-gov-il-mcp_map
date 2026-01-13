# 🇮🇱 Israel Explorer Walkthrough

## Overview
This demo application unifies multiple **MCP Servers** into a single dashboard. It allows you to query Government, Financial, Judicial, and Geospatial data from one interface.

### Active MCP Servers
1.  **mcp-geospatial**: Addresses, Cadastral (Gush/Helka), City Data.
2.  **mcp-finance**: TASE Stock Quotes (Yahoo) & Bank of Israel Exchange Rates.
3.  **mcp-gov**: National Transport Stats & Pikud HaOref Alerts.
4.  **mcp-judicial**: Court details and statistics.

## How to Run

1.  **Restart the Application** (Important if you just updated code):
    ```powershell
    # Stop any running process with Ctrl+C
    cd c:\Work\MCP\gov-IL\data-gov-il-mcp
    npm start
    ```

2.  **Open Browser**:
    *   Navigate to: [http://localhost:3002](http://localhost:3002)

## Features Guide

### 1. 🌍 Geo (Geospatial)
*   **Address Search**: Type "Rothschild 1 Tel Aviv" (in Hebrew or English) -> See location on map + ITM/WGS84 coords.
*   **Cadastral**: Enter Gush and Helka (e.g., 7422 / 116) -> Finds the parcel centroid.

### 2. 📈 Fin (Finance)
*   **Get Quote**: Enter a symbol (e.g., `TEVA`, `LUMI`, `TA35`).
    *   *Result*: Real-time price, change %, market cap using Yahoo Finance.
*   **Exchange Rates**: Click "Show Exchange Rates (BOI)".
    *   *Result*: Official table from Bank of Israel (XML API) showing USD, EUR, GBP, etc.

### 3. 🏛️ Gov (Government)
*   **Red Alert History**: Click to see recent emergency alerts from Pikud HaOref.
*   **Transport Stats**: View general public transport statistics (placeholder/mock or real if API key active).
*   **Transport Tab**: Dedicated view for transport datasets (Buses, Roads, etc).

### 4. ⚖️ Law (Judicial)
*   **Court Info**: Select a court (e.g., Supreme Court) to view address, phone, and jurisdiction info.

## Technical Details
*   **Frontend**: Vanilla JS + Leaflet Maps + CSS Grid/Flexbox.
*   **Backend**: `govmap-explorer/src/server.js` acts as an **MCP Host**, connecting to 4 child processes (the other MCP servers) via `stdio`.
*   **Architecture**:
    ```mermaid
    graph TD
    Browser[Browser UI] -->|HTTP/JSON| Host[Explorer Server]
    Host -->|Stdio| Geo[MCP Geospatial]
    Host -->|Stdio| Fin[MCP Finance]
    Host -->|Stdio| Gov[MCP Gov]
    Host -->|Stdio| Law[MCP Judicial]
    Geo -->|API| GovMap
    Fin -->|API| Yahoo/BOI
    Gov -->|API| Data.gov.il
    ```

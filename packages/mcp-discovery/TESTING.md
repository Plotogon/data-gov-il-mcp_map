# MCP-Discovery Testing Guide

## Quick Start

The MCP-Discovery server is running. Here's how to test it:

### Method 1: Using Claude Desktop (Recommended)

1. **Configure Claude Desktop** to connect to MCP-Discovery:
   ```json
   {
     "mcpServers": {
       "discovery": {
         "command": "node",
         "args": ["src/server.js"],
         "cwd": "c:/Work/MCP/gov-IL/data-gov-il-mcp/packages/mcp-discovery"
       }
     }
   }
   ```

2. **Restart Claude Desktop**

3. **Run test commands** in Claude:

---

## Test Scenarios

### Test 1: Analyze data.gov.il 🔍

**Command:**
```
Use the analyze_website tool with:
- url: "https://data.gov.il"
- depth: 1
- focus: "api"
```

**Expected Results:**
- ✅ Discover CKAN API endpoints (`/api/3/action`)
- ✅ Find data download links
- ✅ Identify documentation pages
- ✅ Detect forms for data search

**Success Criteria:**
- At least 5 API endpoints found
- CKAN API base URL identified
- JSON/XML download links discovered

---

### Test 2: Analyze Pikud Haoref (Emergency Alerts) 🚨

**Command:**
```
Use the analyze_website tool with:
- url: "https://www.oref.org.il"
- depth: 1
- focus: "api"
```

**Expected Results:**
- ✅ Find alerts API endpoint
- ✅ Discover `/WarningMessages/alert/alerts.json`
- ✅ Identify emergency alert documentation

**Success Criteria:**
- Alerts API URL found
- JSON endpoint detected
- Real-time data source identified

---

### Test 3: Analyze Court System 👨‍⚖️

**Command:**
```
Use the analyze_website tool with:
- url: "https://court.gov.il"
- depth: 1
- focus: "all"
```

**Expected Results:**
- ✅ Find Net HaMishpat links
- ✅ Discover case search forms
- ✅ Identify court calendar pages
- ✅ Find documentation links

**Success Criteria:**
- Form endpoints detected
- Search functionality identified
- Hebrew content properly handled

---

### Test 4: Parse API Specification 📄

**Prerequisites:** Complete Test 2 first to get API URL

**Command:**
```
Use the parse_api_spec tool with:
- spec_url: "https://www.oref.org.il/WarningMessages/alert/alerts.json"
- spec_type: "auto-detect"
```

**Expected Results:**
- ✅ Detect JSON structure
- ✅ Extract endpoint information
- ✅ Identify response format

**Note:** This endpoint returns data, not an OpenAPI spec. For full spec parsing, need actual Swagger/OpenAPI URL.

---

### Test 5: Generate MCP Schema 🔧

**Prerequisites:** Complete Test 4 first

**Command:**
```
Use the generate_mcp_schema tool with:
- api_spec: {result from parse_api_spec}
- tool_name: "emergency_alerts"
- include_examples: true
```

**Expected Results:**
- ✅ Generate Zod validation schema
- ✅ Create MCP tool code template
- ✅ Provide usage examples
- ✅ Include authentication details

**Success Criteria:**
- Valid JavaScript code generated
- Zod schema is syntactically correct
- Tool can be copy-pasted into MCP-Gov server

---

## Manual Testing (Alternative)

If Claude Desktop is not available, test via Node.js REPL:

```javascript
// Start server in one terminal
cd packages/mcp-discovery
node src/server.js

// In another terminal, use MCP client library
// (This requires implementing a simple MCP client)
```

---

## Validation Checklist

After running all tests:

- [ ] **Test 1 (data.gov.il):** Found CKAN API
- [ ] **Test 2 (oref.org.il):** Found alerts endpoint
- [ ] **Test 3 (court.gov.il):** Found forms and links
- [ ] **Test 4 (parse_api_spec):** Successfully parsed spec
- [ ] **Test 5 (generate_schema):** Generated valid MCP code

---

## Expected Issues & Solutions

### Issue 1: Website blocks crawling
**Solution:** Tool includes proper User-Agent header

### Issue 2: No OpenAPI spec found
**Solution:** Use analyze_website first to discover spec URLs

### Issue 3: Hebrew content not detected
**Solution:** Tool supports UTF-8 and Hebrew keywords

### Issue 4: Rate limiting
**Solution:** Add delays between requests (depth parameter)

---

## Next Steps After Testing

1. **Document findings** in test results
2. **Use generated schemas** to create MCP-Gov tools
3. **Refine analyzers** based on real-world results
4. **Add discovered APIs** to MCP-Gov server

---

## Success Metrics

**Discovery Server is successful if:**
- ✅ Finds at least 80% of known APIs
- ✅ Generates valid, usable MCP code
- ✅ Handles Hebrew content correctly
- ✅ Provides actionable insights
- ✅ Runs without crashes

---

**Ready to test!** 🚀

Start with Test 1 and work through all scenarios.

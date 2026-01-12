/**
 * Test Suite for MCP-Discovery Server
 * Tests all three tools against real Israeli government websites
 */

import axios from 'axios';

const MCP_SERVER_URL = 'http://localhost:3000'; // Adjust if using different transport

/**
 * Test 1: Analyze data.gov.il
 */
async function testDataGovIl() {
    console.log('\n🧪 TEST 1: Analyzing data.gov.il');
    console.log('='.repeat(50));

    const request = {
        method: 'tools/call',
        params: {
            name: 'analyze_website',
            arguments: {
                url: 'https://data.gov.il',
                depth: 1,
                focus: 'api'
            }
        }
    };

    console.log('Request:', JSON.stringify(request, null, 2));
    console.log('\nExpected: Should discover CKAN API endpoints');
    console.log('Looking for: /api/3/action endpoints\n');
}

/**
 * Test 2: Analyze Pikud Haoref (Emergency Alerts)
 */
async function testPikudHaoref() {
    console.log('\n🧪 TEST 2: Analyzing oref.org.il');
    console.log('='.repeat(50));

    const request = {
        method: 'tools/call',
        params: {
            name: 'analyze_website',
            arguments: {
                url: 'https://www.oref.org.il',
                depth: 1,
                focus: 'api'
            }
        }
    };

    console.log('Request:', JSON.stringify(request, null, 2));
    console.log('\nExpected: Should find alerts API');
    console.log('Looking for: /WarningMessages/alert/alerts.json\n');
}

/**
 * Test 3: Analyze Court System
 */
async function testCourtGovIl() {
    console.log('\n🧪 TEST 3: Analyzing court.gov.il');
    console.log('='.repeat(50));

    const request = {
        method: 'tools/call',
        params: {
            name: 'analyze_website',
            arguments: {
                url: 'https://court.gov.il',
                depth: 1,
                focus: 'all'
            }
        }
    };

    console.log('Request:', JSON.stringify(request, null, 2));
    console.log('\nExpected: Should find Net HaMishpat links and forms');
    console.log('Looking for: Case search forms, court calendars\n');
}

/**
 * Test 4: Parse Known API Spec (if available)
 */
async function testParseApiSpec() {
    console.log('\n🧪 TEST 4: Parsing API Specification');
    console.log('='.repeat(50));

    // Note: This is a hypothetical endpoint - adjust based on Test 1 results
    const request = {
        method: 'tools/call',
        params: {
            name: 'parse_api_spec',
            arguments: {
                spec_url: 'https://data.gov.il/api/3/action/package_list',
                spec_type: 'auto-detect'
            }
        }
    };

    console.log('Request:', JSON.stringify(request, null, 2));
    console.log('\nExpected: Parse CKAN API structure');
    console.log('Note: May need to adjust URL based on actual API spec location\n');
}

/**
 * Test 5: Generate MCP Schema
 */
async function testGenerateSchema() {
    console.log('\n🧪 TEST 5: Generating MCP Schema');
    console.log('='.repeat(50));

    // Mock API spec for demonstration
    const mockApiSpec = {
        type: 'openapi',
        version: '3.0.0',
        info: {
            title: 'Pikud Haoref Alerts API',
            description: 'Emergency alert system for Israel'
        },
        baseUrl: 'https://www.oref.org.il',
        paths: {
            '/WarningMessages/alert/alerts.json': {
                get: {
                    summary: 'Get current alerts',
                    parameters: [],
                    responses: {
                        '200': {
                            description: 'List of active alerts'
                        }
                    }
                }
            }
        },
        auth: {
            types: [],
            details: {}
        }
    };

    const request = {
        method: 'tools/call',
        params: {
            name: 'generate_mcp_schema',
            arguments: {
                api_spec: mockApiSpec,
                tool_name: 'pikud_haoref_alerts',
                include_examples: true
            }
        }
    };

    console.log('Request:', JSON.stringify(request, null, 2));
    console.log('\nExpected: Generate Zod schema and MCP tool code');
    console.log('Should produce: Ready-to-use tool definition\n');
}

/**
 * Run all tests
 */
async function runAllTests() {
    console.log('🚀 MCP-Discovery Server Test Suite');
    console.log('='.repeat(50));
    console.log('Server should be running on stdio');
    console.log('These are the test scenarios - execute them via MCP client\n');

    await testDataGovIl();
    await testPikudHaoref();
    await testCourtGovIl();
    await testParseApiSpec();
    await testGenerateSchema();

    console.log('\n✅ Test scenarios prepared!');
    console.log('\nTo execute these tests:');
    console.log('1. Use Claude Desktop or another MCP client');
    console.log('2. Connect to the MCP-Discovery server');
    console.log('3. Run each tool with the parameters shown above');
    console.log('4. Verify the results match expected outcomes\n');
}

// Run tests
runAllTests().catch(console.error);

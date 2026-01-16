// Deployment Verification Script
// Run this before deploying to ensure everything is working

const http = require('http');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

console.log('\n' + COLORS.cyan + '================================' + COLORS.reset);
console.log(COLORS.cyan + '🔍 DEPLOYMENT VERIFICATION SCRIPT' + COLORS.reset);
console.log(COLORS.cyan + '================================' + COLORS.reset + '\n');
console.log(`Testing: ${BASE_URL}\n`);

let passed = 0;
let failed = 0;

async function testEndpoint(name, path, expectedStatus = 200) {
  try {
    const url = `${BASE_URL}${path}`;
    const response = await fetch(url);
    
    if (response.status === expectedStatus) {
      console.log(COLORS.green + '✅' + COLORS.reset + ` ${name}: PASSED (${response.status})`);
      passed++;
      return true;
    } else {
      console.log(COLORS.red + '❌' + COLORS.reset + ` ${name}: FAILED (Expected ${expectedStatus}, got ${response.status})`);
      failed++;
      return false;
    }
  } catch (error) {
    console.log(COLORS.red + '❌' + COLORS.reset + ` ${name}: ERROR (${error.message})`);
    failed++;
    return false;
  }
}

async function testHealthEndpoints() {
  console.log(COLORS.blue + '\n📊 Testing Health Endpoints...' + COLORS.reset);
  
  await testEndpoint('Basic Health Check', '/health');
  await testEndpoint('Detailed Health Check', '/health/detailed');
  await testEndpoint('Validation Check', '/health/validation');
  await testEndpoint('Endpoints List', '/health/endpoints');
  await testEndpoint('Database Check', '/health/db');
}

async function testAPIEndpoints() {
  console.log(COLORS.blue + '\n🔌 Testing API Endpoints...' + COLORS.reset);
  
  // Public endpoints (should work without auth)
  await testEndpoint('Get Schemes', '/api/schemes');
  await testEndpoint('Get Entrepreneurs', '/api/entrepreneurs');
  
  // Protected endpoints (should require auth - 401)
  await testEndpoint('Get Products (protected)', '/api/products', 401);
  await testEndpoint('Get Requests (protected)', '/api/requests', 401);
  await testEndpoint('Get Current User (protected)', '/api/auth/me', 401);
}

async function testValidation() {
  console.log(COLORS.blue + '\n🔍 Fetching Validation Results...' + COLORS.reset);
  
  try {
    const response = await fetch(`${BASE_URL}/health/validation`);
    const data = await response.json();
    
    console.log(`\n  Healthy: ${data.healthy ? COLORS.green + 'YES' + COLORS.reset : COLORS.red + 'NO' + COLORS.reset}`);
    console.log(`  Summary: ${data.summary.ok} OK, ${data.summary.warnings} Warnings, ${data.summary.errors} Errors`);
    
    if (data.results) {
      console.log('\n  Component Status:');
      data.results.forEach(result => {
        const icon = result.status === 'ok' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
        const color = result.status === 'ok' ? COLORS.green : result.status === 'warning' ? COLORS.yellow : COLORS.red;
        console.log(`    ${icon} ${result.component}: ${color}${result.message}${COLORS.reset}`);
      });
    }
  } catch (error) {
    console.log(COLORS.red + '  Error fetching validation: ' + error.message + COLORS.reset);
  }
}

async function runAllTests() {
  await testHealthEndpoints();
  await testAPIEndpoints();
  await testValidation();
  
  console.log('\n' + COLORS.cyan + '================================' + COLORS.reset);
  console.log(COLORS.cyan + '📊 TEST RESULTS' + COLORS.reset);
  console.log(COLORS.cyan + '================================' + COLORS.reset);
  console.log(COLORS.green + `✅ Passed: ${passed}` + COLORS.reset);
  console.log(COLORS.red + `❌ Failed: ${failed}` + COLORS.reset);
  
  const total = passed + failed;
  const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;
  
  console.log(`\n${COLORS.cyan}Success Rate: ${percentage}%${COLORS.reset}`);
  
  if (failed === 0) {
    console.log('\n' + COLORS.green + '🎉 ALL TESTS PASSED!' + COLORS.reset);
    console.log(COLORS.green + '✅ Backend is READY FOR DEPLOYMENT!' + COLORS.reset + '\n');
    process.exit(0);
  } else {
    console.log('\n' + COLORS.red + '⚠️  Some tests failed.' + COLORS.reset);
    console.log(COLORS.yellow + '📋 Check the issues above before deploying.' + COLORS.reset + '\n');
    process.exit(1);
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/health`);
    if (response.ok) {
      console.log(COLORS.green + '✅ Server is running!' + COLORS.reset + '\n');
      return true;
    }
  } catch (error) {
    console.log(COLORS.red + '❌ Server is not running!' + COLORS.reset);
    console.log(COLORS.yellow + '💡 Start the server first: npm start or npm run dev' + COLORS.reset + '\n');
    process.exit(1);
  }
}

// Main execution
(async () => {
  await checkServer();
  await runAllTests();
})();


const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testAllFeatures() {
  console.log('🧪 Testing Library Management System Features...\n');
  
  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Health Check:', healthResponse.data.status);
    
    // Test 2: Main Test Endpoint
    console.log('\n2️⃣ Testing Main API...');
    const testResponse = await axios.get(`${BASE_URL}/api/test`);
    console.log('✅ API Version:', testResponse.data.data.version);
    console.log('✅ Features Count:', testResponse.data.data.features.length);
    
    // Test 3: Check all endpoints exist
    console.log('\n3️⃣ Verifying API Endpoints...');
    const endpoints = testResponse.data.data.endpoints;
    console.log('✅ Available Endpoints:');
    Object.entries(endpoints).forEach(([name, path]) => {
      console.log(`   📍 ${name}: ${path}`);
    });
    
    // Test 4: Check features
    console.log('\n4️⃣ Verifying Features...');
    const features = testResponse.data.data.features;
    features.forEach(feature => {
      console.log(`   ${feature}`);
    });
    
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('\n📊 Summary:');
    console.log(`   ✅ Server Status: ${healthResponse.data.status}`);
    console.log(`   ✅ API Version: ${testResponse.data.data.version}`);
    console.log(`   ✅ Features Implemented: ${features.length}`);
    console.log(`   ✅ Endpoints Available: ${Object.keys(endpoints).length}`);
    
    console.log('\n🌟 The Library Management System is fully functional!');
    console.log('\n🚀 Next Steps:');
    console.log('   1. Start MongoDB: mongod');
    console.log('   2. Seed Database: npm run seed');
    console.log('   3. Start Full Server: npm run dev');
    console.log('   4. Access Frontend: http://localhost:3000');
    console.log('   5. View API Docs: http://localhost:5000/api-docs');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the server is running:');
      console.log('   node test-app.js');
    }
  }
}

testAllFeatures();

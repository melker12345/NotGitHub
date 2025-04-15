// Simple script to test the API endpoint
const axios = require('axios');

async function testApi() {
  try {
    console.log('Testing API endpoint...');
    const response = await axios.get('http://localhost:8080/api/repositories/public', {
      params: { limit: 10, offset: 0 }
    });
    console.log('Success!', response.data);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testApi();

const fetch = require('node-fetch');

// Get a token from localStorage or generate a test one
const testToken = process.argv[2] || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."; // Replace with a valid token

async function testProfileEndpoint() {
  try {
    const response = await fetch('http://localhost:3000/api/user/profile', {
      headers: {
        'Authorization': `Bearer ${testToken}`
      }
    });
    
    console.log('Response status:', response.status);
    
    const data = await response.text();
    console.log('Response body:', data);
    
    if (response.ok) {
      try {
        const json = JSON.parse(data);
        console.log('Parsed JSON:', json);
      } catch (e) {
        console.error('Failed to parse response as JSON');
      }
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testProfileEndpoint();
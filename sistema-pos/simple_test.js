const axios = require('axios');

async function testLogin() {
  const testUsers = [
    { username: 'admin', password: 'superadmin123' },
    { username: 'paola.torrico', password: 'pao123' },
    { username: 'jose.torrico', password: 'jose123' }
  ];

  for (const user of testUsers) {
    try {
      console.log(`\nProbando login con: ${user.username}`);
      const response = await axios.post('http://localhost:3000/api/v1/auth/login', user);
      console.log('✅ Login exitoso:', response.data.data);
      return response.data;
    } catch (error) {
      console.log('❌ Login fallido:', error.response?.data?.message || error.message);
    }
  }
  
  console.log('\n❌ No se pudo hacer login con ninguna credencial');
}

testLogin(); 
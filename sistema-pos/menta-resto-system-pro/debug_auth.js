// Script para debuggear el estado de autenticación
console.log('=== DEBUG AUTH ===');

// Verificar localStorage
console.log('localStorage.getItem("currentUser"):', localStorage.getItem('currentUser'));
console.log('localStorage.getItem("user"):', localStorage.getItem('user'));
console.log('localStorage.getItem("authToken"):', localStorage.getItem('authToken'));

// Intentar parsear los datos
try {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  console.log('currentUser parsed:', currentUser);
  console.log('currentUser.sucursal:', currentUser.sucursal);
  console.log('currentUser.id_sucursal:', currentUser.id_sucursal);
} catch (error) {
  console.error('Error parsing currentUser:', error);
}

try {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  console.log('user parsed:', user);
  console.log('user.sucursal:', user.sucursal);
  console.log('user.id_sucursal:', user.id_sucursal);
} catch (error) {
  console.error('Error parsing user:', error);
}

console.log('=== FIN DEBUG AUTH ==='); 
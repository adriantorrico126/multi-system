// Script para actualizar el localStorage del frontend
// Ejecutar este script en la consola del navegador

console.log('🔧 Actualizando localStorage con id_restaurante...');

// Obtener el usuario actual del localStorage
const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

console.log('Usuario actual:', currentUser);

// Agregar id_restaurante si no existe
if (!currentUser.id_restaurante) {
  currentUser.id_restaurante = 1; // ID del restaurante por defecto
  
  // Guardar el usuario actualizado
  localStorage.setItem('currentUser', JSON.stringify(currentUser));
  
  console.log('✅ id_restaurante agregado al usuario:', currentUser);
} else {
  console.log('✅ El usuario ya tiene id_restaurante:', currentUser.id_restaurante);
}

// Verificar que se guardó correctamente
const updatedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
console.log('Usuario actualizado:', updatedUser);

console.log('🎉 localStorage actualizado correctamente'); 
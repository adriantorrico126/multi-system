const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:3000/api/v1';

async function checkAvailableData() {
  try {
    console.log('Checking available data in database...\n');
    
    // Verificar sucursales
    const sucursalesResponse = await axios.get(`${BASE_URL}/sucursales`);
    console.log('Available sucursales:', sucursalesResponse.data.data.map(s => s.nombre));
    
    // Verificar productos
    const productosResponse = await axios.get(`${BASE_URL}/productos`);
    console.log('Available products:', productosResponse.data.data.map(p => ({ id: p.id_producto, nombre: p.nombre, stock: p.stock_actual })));
    
    return {
      sucursales: sucursalesResponse.data.data,
      productos: productosResponse.data.data
    };
  } catch (error) {
    console.error('❌ Error checking available data:', error.response?.data || error.message);
    return null;
  }
}

async function testVentaWithMesa() {
  try {
    console.log('Testing venta with mesa_numero...');
    
    // Primero verificar datos disponibles
    const availableData = await checkAvailableData();
    if (!availableData) {
      throw new Error('Could not get available data');
    }
    
    // Usar la primera sucursal disponible
    const sucursal = availableData.sucursales[0];
    const producto = availableData.productos[0];
    
    if (!sucursal || !producto) {
      throw new Error('No sucursal or product available');
    }
    
    const ventaData = {
      items: [
        {
          id_producto: producto.id_producto,
          cantidad: 1,
          precio_unitario: producto.precio,
          observaciones: 'Test venta'
        }
      ],
      total: producto.precio,
      paymentMethod: 'Efectivo',
      cashier: 'admin',
      branch: sucursal.nombre,
      mesa_numero: 5
    };
    
    console.log('Sending venta data:', ventaData);
    
    const response = await axios.post(`${BASE_URL}/ventas`, ventaData);
    
    console.log('✅ Venta created successfully!');
    console.log('Response:', response.data);
    
    // Verificar que mesa_numero se guardó correctamente
    if (response.data.venta && response.data.venta.mesa_numero === 5) {
      console.log('✅ mesa_numero saved correctly:', response.data.venta.mesa_numero);
    } else {
      console.log('❌ mesa_numero not saved correctly:', response.data.venta?.mesa_numero);
    }
    
    return response.data.venta.id_venta;
  } catch (error) {
    console.error('❌ Error creating venta:', error.response?.data || error.message);
    throw error;
  }
}

async function checkStockAfterVenta(productId) {
  try {
    console.log('\nChecking stock after venta...');
    
    const response = await axios.get(`${BASE_URL}/productos`);
    const product = response.data.data.find(p => p.id_producto === productId);
    
    if (product) {
      console.log('✅ Product stock after venta:', product.stock_actual);
      return product.stock_actual;
    } else {
      console.log('❌ Product not found');
      return null;
    }
  } catch (error) {
    console.error('❌ Error checking stock:', error.response?.data || error.message);
    return null;
  }
}

async function checkVentaInDB(ventaId) {
  try {
    console.log('\nChecking venta in database...');
    
    // Usar el endpoint de ventas ordenadas para ver la venta
    const response = await axios.get(`${BASE_URL}/ventas/ordenadas`);
    const venta = response.data.data.find(v => v.id_venta === parseInt(ventaId));
    
    if (venta) {
      console.log('✅ Venta found in DB:', {
        id_venta: venta.id_venta,
        mesa_numero: venta.mesa_numero,
        total: venta.total,
        fecha: venta.fecha
      });
      return venta;
    } else {
      console.log('❌ Venta not found in DB');
      return null;
    }
  } catch (error) {
    console.error('❌ Error checking venta in DB:', error.response?.data || error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting venta tests...\n');
  
  try {
    // Test 1: Crear venta con mesa_numero
    const ventaId = await testVentaWithMesa();
    
    // Test 2: Verificar que la venta se guardó con mesa_numero
    await checkVentaInDB(ventaId);
    
    // Test 3: Verificar que el stock se actualizó
    const availableData = await checkAvailableData();
    if (availableData && availableData.productos.length > 0) {
      await checkStockAfterVenta(availableData.productos[0].id_producto);
    }
    
    console.log('\n🏁 Tests completed!');
  } catch (error) {
    console.error('\n❌ Tests failed:', error.message);
  }
}

runTests(); 
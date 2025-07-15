// migrate_products.ts
// Script para migrar categorías y productos del frontend al backend
// Ejecutar con: npx ts-node migrate_products.ts
// Requiere: npm install axios

import path from 'path';
import fs from 'fs';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1'; // Ajusta si tu backend corre en otro puerto

async function migrate() {
  try {
    // Leer productos y categorías desde products.json
    const jsonPath = path.resolve(__dirname, './products.json');
    const raw = fs.readFileSync(jsonPath, 'utf-8');
    const { products, productCategories } = JSON.parse(raw);

    // 1. Migrar categorías
    console.log('Migrando categorías...');
    // Obtener categorías existentes del backend
    const catRes = await axios.get(`${API_URL}/categorias?includeInactive=true`);
    const backendCategories = catRes.data.data || [];
    const backendCatMap = new Map(backendCategories.map((c: any) => [c.nombre, c]));

    // Crear las categorías que faltan
    for (const nombre of productCategories) {
      if (!backendCatMap.has(nombre)) {
        const res = await axios.post(`${API_URL}/categorias`, { nombre });
        backendCatMap.set(nombre, res.data.data);
        console.log(`Categoría creada: ${nombre}`);
      } else {
        console.log(`Categoría ya existe: ${nombre}`);
      }
    }

    // 2. Migrar productos
    console.log('\nMigrando productos...');
    // Obtener productos existentes para evitar duplicados
    const prodRes = await axios.get(`${API_URL}/productos`);
    const backendProducts = prodRes.data.data || [];
    const backendProdNames = new Set(backendProducts.map((p: any) => p.nombre));

    let created = 0, skipped = 0;
    for (const prod of products) {
      if (backendProdNames.has(prod.name)) {
        console.log(`Producto ya existe: ${prod.name}`);
        skipped++;
        continue;
      }
      const cat = backendCatMap.get(prod.category) as { id_categoria: number };
      if (!cat) {
        console.error(`Categoría no encontrada para producto: ${prod.name}`);
        continue;
      }
      const payload = {
        nombre: prod.name,
        precio: prod.price,
        id_categoria: cat.id_categoria,
        stock_actual: prod.stock || 0,
        activo: prod.available,
        imagen_url: '' // Puedes ajustar si tienes imágenes
      };
      try {
        await axios.post(`${API_URL}/productos`, payload);
        console.log(`Producto creado: ${prod.name}`);
        created++;
      } catch (err: any) {
        console.error(`Error creando producto ${prod.name}:`, err.response?.data || err.message);
      }
    }
    console.log(`\nMigración completada. Productos creados: ${created}, saltados (ya existían): ${skipped}`);
  } catch (err: any) {
    console.error('Error general en la migración:', err.response?.data || err.message);
  }
}

(async () => { await migrate(); })(); 
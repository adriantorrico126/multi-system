const { Pool } = require('pg');

const fixEnterprisePlan = async () => {
    console.log('🔧 FIXING ENTERPRISE PLAN FEATURES IN PRODUCTION...\n');
    
    // Conectarse directamente a la base de datos de producción
    const pool = new Pool({
        user: process.env.DB_USER || 'doadmin',
        host: process.env.DB_HOST || 'db-postgresql-nyc3-64232-do-user-24932517-0.j.db.ondigitalocean.com',
        database: process.env.DB_NAME || 'defaultdb',
        password: process.env.DB_PASSWORD, // La contraseña debe ser proporcionada por una variable de entorno
        port: process.env.DB_PORT || 25060,
        ssl: { rejectUnauthorized: false } // SSL necesario para DigitalOcean
    });

    try {
        console.log('📡 Connecting to production database...');
        
        // Verificar el plan Enterprise actual
        console.log('🔍 Checking current Enterprise plan...');
        const currentPlanQuery = `
            SELECT id_plan, nombre, 
                   incluye_pos, incluye_promociones, incluye_inventario_avanzado,
                   incluye_reservas, incluye_arqueo_caja, incluye_egresos,
                   incluye_reportes_avanzados, incluye_analytics, incluye_delivery,
                   incluye_impresion, incluye_soporte_24h, incluye_api, incluye_white_label
            FROM planes 
            WHERE id_plan = 4 AND nombre = 'enterprise';
        `;
        
        const currentResult = await pool.query(currentPlanQuery);
        
        if (currentResult.rows.length === 0) {
            console.log('❌ Enterprise plan not found in database');
            return;
        }
        
        const currentPlan = currentResult.rows[0];
        console.log('📋 Current Enterprise plan features:');
        console.log(`   incluuye_pos: ${currentPlan.incluye_pos}`);
        console.log(`   incluuye_promociones: ${currentPlan.incluye_promociones}`);
        console.log(`   incluuye_inventario_avanzado: ${currentPlan.incluye_inventario_avanzado}`);
        
        // Actualizar todas las características del plan Enterprise
        console.log('\n🚀 Updating Enterprise plan features...');
        const updateQuery = `
            UPDATE planes SET 
                incluye_pos = true,
                incluye_inventario_basico = true,
                incluye_inventario_avanzado = true,
                incluye_promociones = true,
                incluye_reservas = true,
                incluye_arqueo_caja = true,
                incluye_egresos = true,
                incluye_egresos_avanzados = true,
                incluye_reportes_avanzados = true,
                incluye_analytics = true,
                incluye_delivery = true,
                incluye_impresion = true,
                incluye_soporte_24h = true,
                incluye_api = true,
                incluye_white_label = true,
                updated_at = NOW()
            WHERE id_plan = 4 AND nombre = 'enterprise';
        `;
        
        const updateResult = await pool.query(updateQuery);
        console.log(`✅ Updated ${updateResult.rowCount} row(s)`);
        
        // Verificar los cambios
        console.log('\n🔍 Verifying changes...');
        const verifyResult = await pool.query(currentPlanQuery);
        const updatedPlan = verifyResult.rows[0];
        
        console.log('✅ Updated Enterprise plan features:');
        console.log(`   incluuye_pos: ${updatedPlan.incluye_pos}`);
        console.log(`   incluuye_promociones: ${updatedPlan.incluye_promociones}`);
        console.log(`   incluuye_inventario_avanzacion: ${updatedPlan.incluye_inventario_avanzacion}`);
        console.log(`   incluuye_reservas: ${updatedPlan.incluye_reservas}`);
        
        console.log('\n🎉 SUCCESS! Enterprise plan updated successfully!');
        console.log('✅ All features enabled for Enterprise plan');
        console.log('\n🔄 Next steps:');
        console.log('1. Refresh the web application');
        console.log('2. Check that "Acceso a pedidos" now returns true');
        console.log('3. Verify Header shows plan features correctly');
        
    } catch (error) {
        console.log('❌ Error:', error.message);
        
        if (error.message.includes('password')) {
            console.log('\n💡 Password authentication failed. Check database credentials.');
        } else if (error.message.includes('SSL')) {
            console.log('\n💡 SSL connection failed. Check network connectivity.');
        } else {
            console.log('\n💡 Database connection failed. Please check:');
            console.log('- Database credentials');
            console.log('- Network connectivity');
            console.log('- SSL configuration');
        }
    } finally {
        await pool.end();
    }
};

// Las credenciales para este script deben ser proporcionadas a través de variables de entorno.
// Asegúrate de que DB_USER, DB_HOST, DB_NAME, DB_PASSWORD y DB_PORT estén configuradas.
if (!process.env.DB_PASSWORD) {
    console.error("Error: La variable de entorno DB_PASSWORD no está definida.");
    process.exit(1);
}

fixEnterprisePlan();


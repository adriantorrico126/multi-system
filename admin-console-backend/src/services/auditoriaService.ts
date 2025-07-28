import pool from '../config/database';

export async function registrarAuditoria({
  id_usuario,
  accion,
  tabla_afectada,
  id_registro,
  datos_anteriores,
  datos_nuevos,
}: {
  id_usuario: number;
  accion: string;
  tabla_afectada: string;
  id_registro: number;
  datos_anteriores?: any;
  datos_nuevos?: any;
}) {
  await pool.query(
    `INSERT INTO auditoria_admin (id_usuario, accion, tabla_afectada, id_registro, datos_anteriores, datos_nuevos, fecha_accion)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
    [
      id_usuario,
      accion,
      tabla_afectada,
      id_registro,
      datos_anteriores ? JSON.stringify(datos_anteriores) : null,
      datos_nuevos ? JSON.stringify(datos_nuevos) : null,
    ]
  );
} 
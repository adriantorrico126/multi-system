import pool from '../config/database';

export interface IRestaurante {
    id_restaurante?: number;
    nombre: string;
    direccion?: string;
    telefono?: string;
    activo?: boolean;
}

export const createRestaurante = async (restaurante: IRestaurante): Promise<IRestaurante> => {
    const { nombre, direccion, telefono } = restaurante;
    const result = await pool.query(
        'INSERT INTO restaurantes (nombre, direccion, telefono) VALUES ($1, $2, $3) RETURNING *',
        [nombre, direccion, telefono]
    );
    return result.rows[0];
};

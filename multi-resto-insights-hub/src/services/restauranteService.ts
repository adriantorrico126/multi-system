import axios from 'axios';

const API_URL = 'http://localhost:5001/api/restaurantes';

export interface INewRestaurante {
    nombre: string;
    direccion: string;
    ciudad: string;
    telefono?: string;
    email?: string;
}

export const createRestaurante = async (restaurante: INewRestaurante) => {
    // Asumimos que el token se manejará en un interceptor de axios
    const response = await axios.post(API_URL, restaurante);
    return response.data;
};

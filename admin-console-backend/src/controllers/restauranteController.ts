import { Request, Response } from 'express';
import * as restauranteService from '../services/restauranteService';

export const createRestaurante = async (req: Request, res: Response) => {
    try {
        const nuevoRestaurante = await restauranteService.createRestaurante(req.body);
        res.status(201).json(nuevoRestaurante);
    } catch (error) {
        res.status(500).json({ message: 'Error creating restaurante', error });
    }
};

const InventarioLotesModel = require('../models/inventarioLotesModel');

exports.getAllLotes = async (req, res, next) => {
  try {
    const id_restaurante = req.user.id_restaurante;
    const lotes = await InventarioLotesModel.getAll(id_restaurante);
    res.status(200).json({ success: true, data: lotes });
  } catch (error) {
    next(error);
  }
};

exports.getLotesByCategoriaAlmacen = async (req, res, next) => {
  try {
    const { id_categoria } = req.params;
    const id_restaurante = req.user.id_restaurante;
    const lotes = await InventarioLotesModel.getByCategoriaAlmacen(id_restaurante, id_categoria);
    res.status(200).json({ success: true, data: lotes });
  } catch (error) {
    next(error);
  }
};

exports.getLotesPorVencer = async (req, res, next) => {
  try {
    const id_restaurante = req.user.id_restaurante;
    const { dias } = req.query;
    const lotes = await InventarioLotesModel.getLotesPorVencer(id_restaurante, parseInt(dias) || 7);
    res.status(200).json({ success: true, data: lotes });
  } catch (error) {
    next(error);
  }
};

exports.getProductosStockBajo = async (req, res, next) => {
  try {
    const id_restaurante = req.user.id_restaurante;
    const { limite } = req.query;
    const lotes = await InventarioLotesModel.getProductosStockBajo(id_restaurante, parseInt(limite) || 10);
    res.status(200).json({ success: true, data: lotes });
  } catch (error) {
    next(error);
  }
};

exports.createLote = async (req, res, next) => {
  try {
    const id_restaurante = req.user.id_restaurante;
    const loteData = { ...req.body, id_restaurante };
    const newLote = await InventarioLotesModel.create(loteData);
    res.status(201).json({ success: true, data: newLote });
  } catch (error) {
    next(error);
  }
};

exports.updateLote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const id_restaurante = req.user.id_restaurante;
    const loteData = { ...req.body, id_restaurante };
    const updatedLote = await InventarioLotesModel.update(id, loteData);
    res.status(200).json({ success: true, data: updatedLote });
  } catch (error) {
    next(error);
  }
};

exports.deleteLote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const id_restaurante = req.user.id_restaurante;
    await InventarioLotesModel.delete(id, id_restaurante);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

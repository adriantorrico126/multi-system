const InventarioLotesModel = require('../models/inventarioLotesModel');

exports.getAllLotes = async (req, res, next) => {
  try {
    const lotes = await InventarioLotesModel.getAll();
    res.status(200).json({ success: true, data: lotes });
  } catch (error) {
    next(error);
  }
};

exports.createLote = async (req, res, next) => {
  try {
    const newLote = await InventarioLotesModel.create(req.body);
    res.status(201).json({ success: true, data: newLote });
  } catch (error) {
    next(error);
  }
};

exports.updateLote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedLote = await InventarioLotesModel.update(id, req.body);
    res.status(200).json({ success: true, data: updatedLote });
  } catch (error) {
    next(error);
  }
};

exports.deleteLote = async (req, res, next) => {
  try {
    const { id } = req.params;
    await InventarioLotesModel.delete(id);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

import Part from "../models/Part.js";
import { isNonEmptyString, publicErrorMessage } from "../utils/validation.js";

const validatePart = ({ name, price = 0, quantity = 0 }) => {
    if (!isNonEmptyString(name)) return "Part name is required.";
    if (Number.isNaN(Number(quantity)) || Number(quantity) < 0) return "Quantity must be a non-negative number.";
    if (Number.isNaN(Number(price)) || Number(price) < 0) return "Price must be a non-negative number.";
    return null;
};

export const createPart = async (req, res) => {
    try {
        const validationError = validatePart(req.body);
        if (validationError) return res.status(400).json({ message: validationError });
        const part = new Part({ name: req.body.name.trim(), price: Number(req.body.price || 0), quantity: Number(req.body.quantity || 0) });
        await part.save();
        res.status(201).json(part);
    } catch (err) {
        res.status(400).json({ message: publicErrorMessage(err, "Part could not be saved. Please check the form and try again.") });
    }
};

export const getAllParts = async (req, res) => {
    try { res.json(await Part.find().sort({ name: 1 })); }
    catch { res.status(500).json({ message: "Unable to load parts. Please try again." }); }
};

export const getPartById = async (req, res) => {
    try {
        const part = await Part.findById(req.params.id);
        if (!part) return res.status(404).json({ message: "Part not found." });
        res.json(part);
    } catch { res.status(400).json({ message: "Invalid part identifier." }); }
};

export const updatePart = async (req, res) => {
    try {
        const validationError = validatePart(req.body);
        if (validationError) return res.status(400).json({ message: validationError });
        const part = await Part.findByIdAndUpdate(req.params.id, { name: req.body.name.trim(), price: Number(req.body.price || 0), quantity: Number(req.body.quantity || 0) }, { new: true, runValidators: true });
        if (!part) return res.status(404).json({ message: "Part not found." });
        res.json(part);
    } catch (err) {
        res.status(400).json({ message: publicErrorMessage(err, "Part could not be updated. Please check the form and try again.") });
    }
};

export const addPartOrder = async (req, res) => {
    try {
        const { supplier, amount, notes, orderDate } = req.body;
        const orderAmount = Number(amount);
        if (!isNonEmptyString(supplier)) return res.status(400).json({ message: "Supplier is required." });
        if (!Number.isFinite(orderAmount) || orderAmount <= 0) return res.status(400).json({ message: "Amount must be a positive number." });
        if (orderDate && Number.isNaN(Date.parse(orderDate))) return res.status(400).json({ message: "Enter a valid order date." });

        const part = await Part.findById(req.params.id);
        if (!part) return res.status(404).json({ message: "Part not found." });
        part.quantity = (typeof part.quantity === "number" ? part.quantity : 0) + orderAmount;
        part.lastOrder = { supplier: supplier.trim(), orderDate: orderDate ? new Date(orderDate) : new Date(), amount: orderAmount, notes: notes || "" };
        const saved = await part.save();
        res.status(201).json({ message: "Order recorded and stock increased.", part: saved });
    } catch (err) {
        res.status(400).json({ message: publicErrorMessage(err, "Part order could not be recorded. Please check the form and try again.") });
    }
};

export const getLowStockParts = async (req, res) => {
    try {
        const threshold = parseInt(req.query.threshold, 10) || 5;
        res.json(await Part.find({ quantity: { $lt: threshold } }));
    } catch { res.status(500).json({ message: "Unable to load low stock parts. Please try again." }); }
};

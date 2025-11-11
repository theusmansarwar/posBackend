const express= require("express");
const { createStock, listStock, updateStock, deleteStock, deleteMultipleStocks } = require("../Controller/StockController");
const router=express.Router();

router.post("/create", createStock);
router.get("/list", listStock);
router.put("/update/:id", updateStock);
router.delete("/delete/:id", deleteStock);
router.delete("/deleteMultiple", deleteMultipleStocks);
module.exports = router;
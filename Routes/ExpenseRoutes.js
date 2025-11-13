const express = require("express");
const { AddExpense, getAllExpense, updateExpense, deleteMultipleExpense } = require("../Controller/ExpenseController");
const { route } = require("./UserRoutes");

const router=express.Router();


router.post('/add', AddExpense);
router.get('/list', getAllExpense);
router.put('/update/:id', updateExpense);
router.delete('/multipleDelete',deleteMultipleExpense);
module.exports = router;

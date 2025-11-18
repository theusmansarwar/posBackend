const express = require("express");
const { AddExpense, getAllExpense, updateExpense, deleteMultipleExpense, getExpenseReport } = require("../Controller/ExpenseController");
const { route } = require("./UserRoutes");

const router=express.Router();


router.post('/add', AddExpense);
router.get('/list', getAllExpense);

router.get('/report', getExpenseReport);
router.put('/update/:id', updateExpense);
router.delete('/multipleDelete',deleteMultipleExpense);
module.exports = router;

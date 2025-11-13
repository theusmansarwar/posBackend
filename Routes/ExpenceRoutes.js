const express = require("express");
const { AddExpence, getAllExpence, updateExpence, deleteMultipleExpence } = require("../Controller/ExpenceController");
const { route } = require("./UserRoutes");

const router=express.Router();


router.post('/add', AddExpence);
router.get('/list', getAllExpence);
router.put('/update/:id', updateExpence);
router.delete('/multipleDelete',deleteMultipleExpence);
module.exports = router;

const express = require("express");
const { AddRole, getAllRoles, updateRole, deleteRole, deleteMultipleRoles, getActiveRoles } = require("../Controller/RoleController");
const { route } = require("./UserRoutes");

const router=express.Router();


router.post('/add', AddRole);
router.get('/list', getAllRoles);
router.put('/update/:id', updateRole);
router.delete('/delete/:id', deleteRole);
router.delete('/multipleDelete',deleteMultipleRoles);
router.get('/activeList', getActiveRoles);
module.exports = router;

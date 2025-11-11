const Roles = require("../Models/RoleModel")

// const AddRole= async (req, res) =>{
// const {name, description, modules,status}= req.body; 
// if(!name){
//     return res.json({
//         error:"Name is required"
//     });
// }else if(!description){
//     return res.json({
//         error:"Description is empty"
//     })
// }else if (!modules || modules.length === 0) {
//       return res.status(400).json({ error: "Minimum one module must be selected" });
//     }

// try{
//     //check if roles already exists
//     const roleExist=await Roles.findOne({name});
//     if(roleExist){
//         return res.json({
//             error: "Role already Exists"
//         });
//     }  //create new Role
//     const createRole= await Roles.create({
//         name,
//         description,
//         Modules: modules,
//         status: status ??false,

//     });

//     return res.json({
//         status: 200,
//         message: "Roles Created Successfully",
//         data: createRole,
//     });
// }catch(error){
//     return res.json({
//       error: "Something went wrong",
//       details: error.message,
//     });
// }
// }


    // Create Role
const AddRole = async (req, res) => {
  try {
    const { name, description, modules, status } = req.body;

    const missingFields = [];

    // 🔍 Validate required fields
    if (!name) missingFields.push({ name: "name", message: "Name is required" });
    if (!description) missingFields.push({ name: "description", message: "Description is required" });
    if (!modules || modules.length === 0)
      missingFields.push({ name: "modules", message: "At least one module is required" });
    if (status === undefined) missingFields.push({ name: "status", message: "Status is required" });

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: 400,
        message: "Validation failed",
        missingFields,
      });
    }

    // ✅ Generate unique roleId like "rol-0001"
    const lastRole = await Roles.findOne().sort({ createdAt: -1 });

    let newIdNumber = 1;
    if (lastRole && lastRole.roleId) {
      const lastNumber = parseInt(lastRole.roleId.split("-")[1]);
      newIdNumber = lastNumber + 1;
    }

    const roleId = `rol-${newIdNumber.toString().padStart(4, "0")}`;

    // ✅ Create new role with generated ID
    const role = new Roles({
      roleId,
      name,
      description,
      Modules: modules,
      status,
    });

    await role.save();

    return res.status(201).json({
      status: 201,
      message: "Role created successfully",
      data: role,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Something went wrong while creating role",
      details: error.message,
    });
  }
};

  
//get All Roles(list)
const getAllRoles = async(req, res) => {
    try{
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const keyword = req.query.keyword || "";

        const filter = {
            $or: [
                {name: {$regex: keyword, $options: "i"} },
        ]
        };

       // get total Count
       const totalRoles = await Roles.countDocuments(filter);

       //Fetch roles with paginaton
        const roles = await Roles.find(filter)
        .sort({createdAt: -1})
        .limit(limit)
        .skip((page - 1) * limit);


        return res.status(200).json({
            status: 200,
            message: "Roles Fetched Successfully",
            totalRoles,
            totalPages: Math.ceil(totalRoles / limit),
            currentPage: page,
            limit,
            data: roles,
        });
    }catch(error){
        return res.status(500).json({
            error:"Something went wrong while fetching Roles",
            details: error.message,
        });
    }
};

//update role by id
// const updateRole= async(req,res) => {
//     try{
//         const{ id } = req.params;
//         const {name, description,Modules,status} = req.body;    

//         const updatedRole = await Roles.findByIdAndUpdate(
//             id,
//             {name, description, Modules, status},
//             {new: true, runValidators: true}
//         );

        
//     if (!updatedRole) {
//       return res.status(404).json({ error: "Role not found" });
//     }

//     return res.json({
//       status: 200,
//       message: "Role updated successfully",
//       data: updatedRole,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       error: "Something went wrong while updating role",
//       details: error.message,
//     });
//   }
// };

// Update Role
const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, modules, status} = req.body;

    const missingFields = [];

    // ✅ Validate required only if publishing

      if (!name) missingFields.push({ name: "name", message: "Name is required" });
      if (!description) missingFields.push({ name: "description", message: "Description is required" });
      if (!modules || modules.length === 0)
        missingFields.push({ name: "modules", message: "At least one module is required" });
      if (status === undefined) missingFields.push({ name: "status", message: "Status is required" });
    

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: 400,
        message: "Validation failed",
        missingFields,
      });
    }

    const updatedRole = await Roles.findByIdAndUpdate(
      id,
      { name, description, Modules:modules, status },
      { new: true }
    );

    if (!updatedRole) {
      return res.status(404).json({
        status: 404,
        message: "Role not found",
      });
    }

    return res.status(200).json({
      status: 200,
      message: "Role updated successfully",
      data: updatedRole,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Something went wrong while updating role",
      details: error.message,
    });
  }
};

//Delete Role
const deleteRole= async(req,res) => {
    try{
        const {id} = req.params;

       const deletedRole= await Roles.findByIdAndDelete(id);

        if(!deletedRole){
            return res.status(404).json({error: "Role not found"});
        }

        return res.json({
            status: 200,
            message: "Role Deleted Successfully",
            data: deletedRole,
        })
    }catch(error){
        return res.status(500).json({
            error:"Something went wrong While deleting Role",
            details: error.message,
        });
    }
};

//delete Multiple Roles
const deleteMultipleRoles = async(req,res) => {
    try{
        const {ids}=req.body;

        if(!ids || ids.length === 0){
            return res.status(400).json({
                error: "Atleast one role id is requires",
            });
        }

        const result = await Roles.deleteMany({_id:{$in: ids}});

        return res.json({
            status: 200,
            message: `${result.deletedCount} role(s) deleted Successfully`
        });
    }catch(error){
        return res.status(500).json({
            error: error.message,
        });
    }
};
// Get Only Active Roles
const getActiveRoles = async (req, res) => {
  try {
    const activeRoles = await Roles.find({ status: true }).sort({ createdAt: -1 });

    return res.status(200).json({
      status: 200,
      message: "Active roles fetched successfully",
      totalActiveRoles: activeRoles.length,
      data: activeRoles,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Something went wrong while fetching active roles",
      details: error.message,
    });
  }
};
module.exports={AddRole, getAllRoles, updateRole, deleteRole, deleteMultipleRoles, getActiveRoles};

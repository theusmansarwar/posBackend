
const Roles = require("../Models/RoleModel");
const User = require("../Models/UserModel");

//create User
// const createUser = async(req, res) => {
//     try{
//         const{  name, email, password, role} = req.body;
//         //Email Exist
//          const existingUser = await User.findOne({ email });
//             if (existingUser) {
//         return res.status(400).json({ error: "Email already exists" });
//     }

        //check if role exist
        // const roleExists= await Roles.findById(role);
        // if(!roleExists){
        //     return res.status(400).json({message: "Invalid role ID"});
        // }

        //create User
//         const user = await User.create({
//     name, 
//     email,
//     password,
//     role
// });
//         res.status(201).json({
//             message :"User created successfully",
//             user
//         });
       

//     }catch(error){
//         return res.status(500).json({error: error.message});
//     }
// };

// Create User
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, status } = req.body;

    const missingFields = [];

    // ✅ Validate required fields
    if (!name) missingFields.push({ name: "name", message: "Name is required" });
    if (!email) missingFields.push({ name: "email", message: "Email is required" });
    if (!password) missingFields.push({ name: "password", message: "Password is required" });
    if (!role) missingFields.push({ name: "role", message: "Role is required" });
    if (status === undefined) missingFields.push({ name: "status", message: "Status is required" });

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: 400,
        message: "Validation failed",
        missingFields,
      });
    }

    // ✅ Check if role exists
    const roleExists = await Roles.findById(role);
    if (!roleExists) {
      return res.status(400).json({ status: 400, message: "Invalid role ID" });
    }

    // ✅ Generate unique userId like "usr-0001"
    const lastUser = await User.findOne().sort({ createdAt: -1 });

    let newIdNumber = 1;
    if (lastUser && lastUser.userId) {
      const lastNumber = parseInt(lastUser.userId.split("-")[1]);
      newIdNumber = lastNumber + 1;
    }

    const userId = `usr-${newIdNumber.toString().padStart(4, "0")}`;

    // ✅ Create new user with generated ID
    const user = new User({
      userId,
      name,
      email,
      password, // ⚠️ Consider hashing later with bcrypt
      role,
      status,
    });

    await user.save();

    return res.status(201).json({
      status: 201,
      message: "User created successfully",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Something went wrong while creating user",
      details: error.message,
    });
  }
};

//get all users
const listUser= async(req, res) => {
    try{
        //Querry Params
        const page = Math.max(parseInt(req.query.page) || 1,1);
        const limit = Math.min(parseInt(req.query.limit) || 10,50);
        const search = req.query.keyword || "";

        //search by name
        const filter = {
        $or: [
            {name: {$regex: search, $options: "i"} },
            {email: {$regex: search, $options: "i"} },
        ]
        };

        //total count for pagination
        const totalUsers = await User.countDocuments(filter);

        //Fetch users with pagination + role populate
        const users = await User.find(filter)
        .populate("role","name description Modules")
        .sort({createdAt: -1})
        .limit(limit)
        .skip((page - 1) * limit);

        //send response
        res.status(200).json({
            totalUsers,
            totalPages: Math.ceil(totalUsers / limit),
            currentPage: page,
            limit,
            users
        }); 
    }catch(err){
    return res.status(500).json({error: err.message});
    }
};

//update user
// const updateUser = async(req,res) => {
    // try{
    //     const { id } = req.params;
    //     const {name, email, password, role, status} = req.body
    

    //find the user
    // const user = await User.findById(id);
    // if(!user){
    //     return res.status(400).json({error: "User Not found"});
    // }

    //if role is provided , validate it
    // if(role){
    //     const roleExists = await Roles.findById(role);
    //     if(!roleExists){
    //         return res.status(400).json({ error: "Invalid role ID"});
    //     }
    //     user.role = role;
    // }

    // if (name) user.name = name;
    // if (email) user.email = email;
    // if(password) user.password = password;
    // if(status !== undefined) user.status = status;
   
    //save update user
//     const updatedUser = await user.save();
//     return res.json({
//         status: 200,
//         message: "user updated sucessfully",
//         data: updatedUser,
//     });
// }
// catch(err){
//     return res.status(500).json({error: err.message});
//     }
// }

// Update User
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, status } = req.body;

    const missingFields = [];

    // ✅ Validate required fields
    if (!name) missingFields.push({ name: "name", message: "Name is required" });
    if (!email) missingFields.push({ name: "email", message: "Email is required" });
    if (!role) missingFields.push({ name: "role", message: "Role is required" });
    if (status === undefined) missingFields.push({ name: "status", message: "Status is required" });

    // ❌ password ko required mat banao
    // ✅ sirf tab update karo jab user ne diya ho
    if (missingFields.length > 0) {
      return res.status(400).json({
        status: 400,
        message: "Validation failed",
        missingFields,
      });
    }

    // ✅ check valid role id
    if (role) {
      const roleExists = await Roles.findById(role);
      if (!roleExists) {
        return res.status(400).json({ status: 400, message: "Invalid role ID" });
      }
    }

    // ✅ update object dynamically build karo
    const updateData = { name, email, role, status };
    if (password) updateData.password = password; // only if provided

    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedUser) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: 200,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Something went wrong while updating user",
      details: error.message,
    });
  }
};

//delete Single User
const deleteUser = async(req,res) => {
    try{
        const { id } = req.params;
        const user= await User.findByIdAndDelete(id);
        if(!user){
            return res.status(400).json({error: "user not found"});
        }
        
        return res.json({
            status: 200,
            message: "User deleted Successfully",
            data: user,
        });
    }catch(err){
        return res.status(500).json({error: err.message});
    }
};

//delete Multiple User
    const deleteMultipleUsers = async(req, res) => {
        try{
        const { ids } = req.body;
        if(!ids  || ids.length === 0){
            return res.status(400).json({error: "please provide an array of user ids"});
        }

        const result = await User.deleteMany({_id: {$in:ids}  });
        
        return res.json({
            status: 200,
            message:`${result.deletedCount} user(s) deleted Successfully`,
        });
    }catch(err){
      status: 200
        return res.status(500).json({error: err.message});
    }
};

    module.exports = {createUser, listUser, updateUser, deleteUser, deleteMultipleUsers}
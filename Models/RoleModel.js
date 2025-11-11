const mongoose = require('mongoose');

const rolesSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true 
    },
    roleId:{
      type: String,
      unique: true,
    },
    description:{
        type: String,
        required: true 
    },
    Modules:[
{type: String,}
    ],
       
    status:{type:Boolean, default:false}
},
{timestamps: true}
)
const Roles = mongoose.model("Roles", rolesSchema);
module.exports = Roles;


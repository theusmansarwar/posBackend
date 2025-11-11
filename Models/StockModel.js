const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema(
  {
    productName:{
        type: String,
        required: true 
    },
    productId:{
        type: String,
        unique: true
    },
    quantity:{
        type: Number, 
        required: true
    },
    unitPrice:{
        type: Number, 
        required: true
    },
    totalPrice:{
        type: Number, 
        required: true
     },
     salePrice:{
        type: Number, 
        required: true
     },
    supplier:{
         type: String, 
         required: true 
    },
   
    warranty:{ 
      type: String, 
         required: true 
    }
  },
  { timestamps: true }
);

const Stock = mongoose.model("Stock", stockSchema);
module.exports= Stock;

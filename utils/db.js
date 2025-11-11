const mongoose=require('mongoose');
const url=process.env.MONGODBURI;
const connectdb=async()=>{
    try{
        const response = await mongoose.connect(url);
        if(response){
            console.log("Mongodb connected")
        }
        else{
            console.log("error while connecting")
        }
    }
    catch(error){
        console.log("ERROR", error)
        process.exit(1);

    }
}
module.exports=connectdb;
const mongoose = require("mongoose");



const urlSchema = new mongoose.Schema({
   urlCode:{
       type:String,
     
    
   },
   longUrl:{
       type:String,
       required:true,
       trim:true,
   },
   shortUrl:{
       type:String,
       trim:true,
       unique:true

   }


   
     
    
},{timestamps:true})


module.exports = mongoose.model("Url",urlSchema)
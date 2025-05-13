// require('dotenv').config({path: '.env'}) //tradition way to load env files

import { app } from './app.js'
import dotenv from "dotenv"
import  connectDB from "./db/index.js"

dotenv.config({
    path: './.env'
})

// console.log(process.env.MONGO_URI)
connectDB()
.then(()=>{
    app.on("error",(error)=>{
        console.log("ERRR: ",error);
        throw error
    })
    app.listen(process.env.PORT || 8000, ()=>{
        console.log (`Server is running at port : ${process.env.PORT}`);
    })
})
.catch((err) => {     
    console.log("MONGO  db connection failed !!! ",err)
})



//good aproach but the index in populated too much
// import express from "express"
// const app = express()

// (async () => {
//     try {
//          await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error",(error)=>{ //appication not able to talk to the database
//             console.log("ERR: ",error);
//             throw error
//         })
//         app.listend(process.env.PORT,()=>{
//             console.log(`App is listning on port ${process.env.PORT}`)
//         })
//      }
//     catch (error){
//         console.error("ERROR:",error)
//         throw err
//     }
// })()
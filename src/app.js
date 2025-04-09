import expres from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
const app = expres()
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))
app.use(expres.json({limit:"16kb"})) //json ka data
app.use(expres.urlencoded({extended: true, limit:"16kb"})) // url data
app.use(expres.static("public"))
app.use(cookieParser())
//middleware

app.get("/",(req,res)=>{
    res.send("Server is running")
})
//router
import userRouter from './routes/user.routes.js'


//routes declaration //we could have user app.get to perform any action but controllers are else where so use the fuction like middlewares
app.use("/api/v1/users",userRouter)



export { app }


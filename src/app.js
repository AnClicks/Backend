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

export { app }


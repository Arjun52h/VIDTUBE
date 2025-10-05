
import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()
  app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true
    })
  )
  

// this is common middlewares
  app.use(express.json({limit: "16kb"}))
  app.use(express.urlencoded({ extended : true , limit : "16kb"}))
  app.use(express.static("public"))
  app.use(cookieParser()) 


  //import routes
  import { healthchecker } from "./routes/healthchecker.routes.js";
  import userRouter from "./routes/user.routes.js"
  import { errorHandler } from "./middlewares/error.middlewares.js";


  // routes
  app.use("/api/v1/healthcheck",healthchecker)
  app.use("/api/v1/users",userRouter)
  app.post('/api/v1/users/refresh-token', (req, res) => {
  // handle token refresh logic
  console.log('Refresh token endpoint hit');
  res.status(200).send('Token refreshed');
});


app.use(errorHandler)
export { app }
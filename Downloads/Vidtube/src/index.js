
import dotenv from "dotenv";
import { app } from "./app.js";
import connectDB from "./db/index.js";
// import {router} from "./routes/user.routes.js";
dotenv.config({
    path : './.env'
})

const PORT =   process.env.PORT || 8001


    connectDB() 
    .then(() => {
        app.listen(PORT, () => {
            console.log("hello this is running on this ");
            
            console.log(`Server is running at ${PORT}`);
        })
    })
    .catch((error) => {
        console.log("Error occurred:", error);
    });   


    

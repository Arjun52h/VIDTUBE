import mongoose from "mongoose";
import { DB_name}  from "../constants.js"
import '@dotenvx/dotenvx/config';


// dotenv.config({
//     path: "./.env"
// })

const connectDB = async() => {
try {
     // Add this
    console.log("DB Name:", DB_name);
    console.log("MongoDB URI:", process.env.MONGODB_URI);
     const con = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_name}`)
     console.log(`\n MongoDB connected !! Data host: ${con.connection.host}`);
     
} catch (error) {
    console.log("connection failed",error);
    process.exit(1)
    
}
}

export default connectDB;
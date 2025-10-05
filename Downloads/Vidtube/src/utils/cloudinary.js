import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})
const UploadOnCloudinary = async (localfilepath) =>{
    try { 
        if(!localfilepath) return null
       const response = await cloudinary.uploader.upload(
            localfilepath,{
                resource_type : "auto",
                folder: "vidtube/users" 
            } 
        )
        console.log("File upload on cloudinary . File src :" + response.url);
        fs.unlinkSync(localfilepath)
        return response;
    } catch (error) {
        fs.unlinkSync(localfilepath)
        console.error("Cloudinary upload error:", error);
        console.log("Y nahi chal Raha")
        return null
    }
 

}
const deletefromCloudinary = async (publicid) =>{
    try {
        const result = await cloudinary.uploader.destroy(publicid)
        console.log("Deleted from Cloudinary");
        
        
    } catch (error) {
        console.log(" Error in Deleting from cloudinary",error);
        return null
        
    }
}

export {UploadOnCloudinary,deletefromCloudinary}
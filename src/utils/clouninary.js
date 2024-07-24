import {v2 as cloudinary} from "cloudinary"
import fs from "fs"


cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary =async (localFilePath)=>{
    try {
        if(!localFilePath) return null;
        const response=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        // file upload ho gyi
        // console.log("file is uploaded on cloudinary",response.url);
        console.log(`file response ${response}`,response);
        return response;
    } catch (error) {
        console.log("file is not uploaded retry again");
        return null

    }
    finally{
        localFilePath && fs.unlinkSync(localFilePath)
    }
}

export { uploadOnCloudinary}
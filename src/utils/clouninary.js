import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      asset_folder: 'Youtube-backend-images',
    });
    // file upload ho gyi
    // console.log("file is uploaded on cloudinary",response.url);
    // console.log(`file response ${response}`, response);
    return response;
  } catch (error) {
    console.log("file is not uploaded retry again");
    return null;
  } finally {
    localFilePath && fs.unlinkSync(localFilePath); // agr localfile mila to hi delete kro brna mt kro
  }
};


// complete it
const deleteFromCloudniary = async(publicKey)=>
{
  publicKey=publicKey.slice(68,88);
  console.log(publicKey);
  try {
    if (!publicKey) throw new ApiError(404,"key is worng");
    const response= await cloudinary.uploader.destroy(publicKey);
    console.log(response);

  } catch (error) {
      console.log(error||"error in deleting");
  }
}
export { uploadOnCloudinary,deleteFromCloudniary };

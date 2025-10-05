import { ApiResponse } from "../utils/ApiResonse.js";
import { Apierror } from "../utils/Apierror.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthchecker = asyncHandler( async (req, res ) =>{
    return res
    .status(200)
    .json(new ApiResponse(200,"ok","helthcheker process"))
})

export { healthchecker }
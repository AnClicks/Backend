import { asyncHandler } from "../utils/asyncHandler.js";
import{ApiError} from "../utils/ApiError.js"
import{User} from "../models/user.model.js"
const registerUser = asyncHandler(async (req,res) =>{
//get user details from frontend
//Validation
//check if user already exists : username, email
//check for images m check for avatar
//upload them to cloudinary, avatar 
//create user object - create entry in db
//remove password and refresh token firld from response
// check for user creation
//return res


const {fullName,email,username,password  }=req.body
// console.log("email",email);
                              // for checking the fields like fullname,email,username,password is empty then handel like this for begginers
if(fullName === ""){
    throw new  ApiError(400,"Full name is required")
}
if(email===""){
    throw new ApiError(400,"Email field is required")
}
if(username===""){
    throw new ApiError(400,"Username is empty")
}
if(password===""){
    throw new ApiError(400,"Password is empty")
}

User.findOne({
    $or:[{ username },{ email }]
})
})

export { registerUser }
import { asyncHandler } from "../utils/asyncHandler.js";
import{ApiError} from "../utils/ApiError.js"
import{User} from "../models/user.model.js"
import{uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefereshTokens = async (userId)=>{
    try{
        const user =await User.findById(userId)
            const accessToken =  user.generateAccessToken()
            const refreshToken =  user.generateRefreshToken()

            user.refreshToken = refreshToken
            await user.save({validateBeforeSave: false})
            return {accessToken,refreshToken}
    }
    catch(error){
        throw new ApiError(500,"Something went wrong while generating the access token and refresh token ")
    }
}

const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res


    const {fullName, email, username, password } = req.body
    //console.log("email: ", email);

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    //console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    // console.log(avatar)
    // console.log(coverImage)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
   

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

} )
const loginUser = asyncHandler(async (req,res)=>{
  // req body -> data
  // username or email
  // find the user
  // password check
  // access and refresh token
  // send cookie
  const {username,email,password} =req.body

  if(!username && !email ){
    throw new ApiError(400,"username or password field is empty");
  }
  const user = await  User.findOne({
    $or: [{username},{email}]
  })
  if(!user){
    throw new ApiError(404,"User does not exists");
  }
  const isPasswordValid =await user.isPasswordCorrect(password)
  if(!isPasswordValid){
    throw new ApiError(401,"Invalid credentials");
  }
  const {accessToken,refreshToken} =await generateAccessAndRefereshTokens(user._id)
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
  const options={
    httpOnly: true,   // for security so that the front end guys can work
    secure: true
  }
  return res.status(200).cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
    new ApiResponse(
        200,

        {
            user: loggedInUser,accessToken,
            refreshToken,
        },
        "User logged in Successfully"
    )
  )
})
const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new:true
        }
    )
    const options ={
        httpOnly:true,
        secure: true
    }
    return res.status(200).clearCookie("accessToken",options)
    .clearCookie("refreshToken",options).json( new ApiResponse(200,{},"User logged Out"))
})
const refreshAccessToken = asyncHandler(async (req,res) =>{
    const incommingRefreshToken =req.cookies.refreshToken || req.body.refreshToken

    if (!incommingRefreshToken){
        throw new ApiError(401,"Unauthorized request")
    }
    try {
        const decodedToken = jwt.verify(
            incommingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401,"Invalid refresh token")
     }
        if(incommingRefreshToken !=user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used")
        }
    
        const options ={
            httpOnly:true,
            secure: true
        }
    
        const {accessToken,newRefreshToken}=await generateAccessAndRefereshTokens(user._id)
        return res.status(200).cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken:newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || 
            "Invalid refreshToken"
        )
    }
})
const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword} = req.body
    const user =await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid old password")
    }
    user.password = newPassword
    await user.save({validateBeforeSave:false})
    return res.status(200)
    .json(new ApiResponse(200,{},"Password is changed"))

})
const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200)
    .json(200,req.user,"current user fetched successfully")
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName,email} = req.body

    if(!fullName || !email){
        throw new ApiError(400,"All fields are required")
    }
    User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email
            }
        },
        {new:true}
    ).select("-password"
    )

    return res
    .status(200)
    .json(new ApiResponse(200,"Account deatils updated successfully"))
})
const updateUserAvatar = asyncHandler(async (req,res)=>{
   const avatarLocalPath = req.file?.path
   if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is missing")
   }
   const avatar = await uploadOnCloudinary(avatarLocalPath)

   if(!avatar.url){
    throw new ApiError(400,"Error while uploading on avatar")
   }
//    const user = await User.findByIdAndUpdate(req.user?._id)
//    user.avatar=avatar
//    await user.save({validateBeforeSave:false})
//    return res.status(200)
//    .json(new ApiResponse(200,{},"Avatar of the user updated"))
   const user =await User.findOneAndUpdate(
    req.user?._id,
    {
        $set:{
            avatar:avatar.url
        }
    },
    {new:true}
   ).select("-password")
   return res.status(200)
   .json(new ApiResponse(200,user,"Avatar is updated"))
})

const updateCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400,"Cover image is missing")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading cover image")
    }
    const user =await User.findByIdAndUpdate(req._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true}).select("-password")
        return res.status(200)
        .json(new ApiResponse(200,user,"Cover Image updated"))
})
export { registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateCoverImage
  }
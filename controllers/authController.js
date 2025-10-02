
import jwt from 'jsonwebtoken';
import { User } from '../models/userModel.js';
import { userSignUpSchema,userSignInSchema } from '../models/zodValidationModels.js';
import { hashPassword,comparePasswords } from '../services/hashServices.js';
const JWT_SECRET = process.env.JWT_SECRET

export const userSignup = async (req, res) => {
  
  const parsedBodyData = userSignUpSchema.safeParse(req.body);
  if (!parsedBodyData.success) {
    return res.status(400).json({ error: parsedBodyData.error.message});
  }

  const { name, password, email, phone } = parsedBodyData.data;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User Already Exists' });
    }

    const hashedPassword = await hashPassword(password);

    // Create user, default role is PATIENT if not provided
    const newUser = await User.create({
      name,
      password: hashedPassword,
      email,
      phone
    });

    if (newUser) {
      const token = jwt.sign(
        { userId: newUser._id, role: newUser.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(201).json(`Bearer ${token}` );
    }
  } catch (e) {
    return res.status(500).json({ message: `Something Went Wrong: ${e.message}` });
  }
};

export const userSignIn=async(req,res)=>{
    const parsedUserData=userSignInSchema.safeParse(req.body)
    if(!parsedUserData.success){
      return res.status(400).json({ error: parsedBodyData.error.message});
    }
    try{
      const {email,password}=parsedUserData.data
      const userExists=await User.findOne({
        email
      })
      if(!userExists){
        return res.status(411).json({
        message:"Invalid Email"
      })
      }

      const isPasswordValid=await comparePasswords(password,userExists.password)
       if(!isPasswordValid){
        return res.status(401).json({
        message:"Invalid password"
    })
       }

    const token=jwt.sign({userId:userExists._id,role:userExists.role},JWT_SECRET, { expiresIn: '24h' });
    return res.status(200).json(
      `Bearer ${token}`
    )

    }catch(e){
      return res.status(500).json({
        message:`Something Bad Happened ${e.message}`
      })
    }

}

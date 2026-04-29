import jwt from 'jsonwebtoken'
import 'dotenv/config'

export const generateToken = (user)=>{
    return jwt.sign({
        _id: user._id,
        username: user.username
    }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

export const verifyToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET);
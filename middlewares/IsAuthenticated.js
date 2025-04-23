import jwt from "jsonwebtoken";
import UserModel from "../models/user.model.js";
import Admin from "../models/admin.model.js";
export const IsAuthenticated = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = (authHeader && authHeader.split(" ")[1]) || req.cookies.token;

    console.log(token, "token");

    if (!token) {
      return res.status(401).json({ message: "You are not authenticated." });
    }

    const decode = jwt.verify(token, process.env.JWT_SECRET);
    if (!decode) {
      return res.status(401).json({ message: "Invalid token." });
    }

    const user =
      (await UserModel.findById(decode.id)) ||
      (await Admin.findById(decode.id));
    console.log(user, "user");

    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    req.user = user;
    if (user.role === "admin") {
      const adminFind = await UserModel.findById(user._id);
      req.admin = adminFind;
    }

    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

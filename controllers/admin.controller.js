import Admin from "../models/admin.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import UpgradeTableModel from "../models/upgradeTable.model.js";
import UserModel from "../models/user.model.js";
import LevelIncome from "../models/levelIncome.model.js";
import DirectReferral from "../models/directReferral.model.js";
import InvestmentModel from "../models/investment.model.js";

export const adminRegister = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        message: "All Feild are requireds",
        success: false,
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const newAdmin = await Admin.create({
      email,
      password: hashPassword,
    });
    if (!newAdmin) {
      return res.status(400).json({
        message: "User Not Created",
        success: false,
      });
    }
    const admin = await newAdmin.save();

    return res.status(200).json({
      message: "Register Successfull",
      success: true,
      data: admin,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Server Error",
      success: false,
    });
  }
};
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "All fields are required",
        success: false,
      });
    }

    const user = await Admin.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        message: "User not found",
        success: false,
      });
    }

    const matchPassword = await bcrypt.compare(password, user.password);
    if (!matchPassword) {
      return res.status(401).json({
        message: "Invalid credentials",
        success: false,
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res
      .cookie("token", token, {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
      })
      .status(200)
      .json({
        success: true,
        token,
        data: user,
        message: "Login successful",
      });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message || "Server error",
      success: false,
    });
  }
};
export const getProfile = async (req, res) => {
  try {
    const userId = req.admin;
    if (!userId) {
      return res.status(404).json({
        message: "Unauthorized",
      });
    }
    const user = await Admin.findById(userId);
    if (!user) {
      return res.status(200).json({
        message: "User not found",
      });
    }
    return res.status(200).json({
      message: "User Profile",
      data: user,
      success: true,
    });
  } catch (error) {}
};
export const upgradeIncome = async (req, res) => {
  try {
    const userId = req.admin;
    const { amount, level } = req.body;
    if (!userId) {
      return res.status(404).json({
        message: "Unauthorized",
      });
    }
    if (!amount || !level) {
      return res.status(400).json({
        message: "All fields are required",
        success: false,
      });
    }
    const upgradeTable = await UpgradeTableModel.create({
      amount,
      level,
    });
    if (!upgradeTable) {
      return res.status(400).json({
        message: "User Not Created",
        success: false,
      });
    }
    const upgrade = await upgradeTable.save();
    return res.status(200).json({
      message: "Upgrade Table Created",
      success: true,
      data: upgrade,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Server error",
      success: false,
    });
  }
};

export const allUsers = async (req, res) => {
  try {
    const admin = req.admin;
    if (!admin) {
      return res.status(401).json({
        message: "Unauthorized",
        success: false,
      });
    }

    const users = await UserModel.find();
    if (!users || users.length === 0) {
      return res.status(200).json({
        message: "No users found",
        data: [],
        success: true,
      });
    }

    return res.status(200).json({
      message: "All Users",
      data: users,
      success: true,
    });
  } catch (error) {
    console.error("Error in allUsers:", error);
    return res.status(500).json({
      message: "Server Error",
      success: false,
    });
  }
};

export const getAllLevelIncome = async (req, res) => {
  try {
    const userId = req.admin;
    if (!userId) {
      return res.status(404).json({
        message: "Unauthorized",
      });
    }
    const levelIncome = await LevelIncome.find({}).populate(
      "userId fromUserId"
    );
    return res.status(200).json({
      message: "All User Level Income History",
      data: levelIncome,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server Error",
      success: false,
    });
  }
};

export const getAllReferalBonus = async (req, res) => {
  try {
    const userId = req.admin || req.user;
    if (!userId) {
      return res.status(404).json({
        message: "Unauthorized",
      });
    }
    const referalBonus = await DirectReferral.find({}).populate(
      "userId fromUserId"
    );
    if (!referalBonus) {
      return res.status(200).json({
        message: "No referal bonus found",
      });
    }
    return res.status(200).json({
      message: "All User Referal Bonus History",
      data: referalBonus,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server Error",
      success: false,
    });
  }
};

export const allPurchaseHistory = async (req, res) => {
  try {
    const userId = req.admin || req.user;
    if (!userId) {
      return res.status(404).json({
        message: "Unauthorized",
      });
    }
    const purchaseHistory = await InvestmentModel.find({}).populate("userId");
    if (!purchaseHistory) {
      return res.status(200).json({
        message: "No purchase history found",
      });
    }
    return res.status(200).json({
      message: "All User Purchase History",
      data: purchaseHistory,
      success: true,
    });
  } catch (error) {
    console.error("Error in allPurchaseHistory:", error);
    return res.status(500).json({
      message: "Server Error",
      success: false,
    });
  }
};

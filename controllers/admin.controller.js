import Admin from "../models/admin.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import UpgradeTableModel from "../models/upgradeTable.model.js";
import UserModel from "../models/user.model.js";
import LevelIncome from "../models/levelIncome.model.js";
import DirectReferral from "../models/directReferral.model.js";
import InvestmentModel from "../models/investment.model.js";
import Banner from "../models/Banner.model.js";
import path, { dirname } from "path";
import fs from "fs";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

export const uploadBanner = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({
        message: "title is required",
        success: false,
      });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No banner uploaded" });
    }

    const newBanner = new Banner({
      imageUrl: `/uploads/banners/${req.file.filename}`,
      title: title,
    });

    await newBanner.save();

    res.status(201).json({
      message: "Banner uploaded successfully",
      banner: newBanner,
    });
  } catch (error) {
    // console.log(error);
    res
      .status(500)
      .json({ message: "Banner upload failed", error: error.message });
  }
};
export const getBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });
    console.log(banners);
    res.status(200).json({
      message: "Banners fetched successfully",
      success: true,
      data: banners,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch banners",
      success: false,
      error: error.message,
    });
  }
};

export const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    const imagePath = path.join(__dirname, ".. ", banner.imageUrl);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await Banner.findByIdAndDelete(req.params.id);

    res.json({ message: "Banner deleted successfully" });
  } catch (error) {
    // console.log(error);
    res
      .status(500)
      .json({ message: "Failed to delete banner", error: error.message });
  }
};
export const allWithdrwal = async (req, res) => {
  try {
    const userId = req.user;
    if (!userId) {
      return res.status(400).json({
        messae: "Please Login First",
        success: false,
      });
    }

    const allWithdrwals = await Withdrawal.find({}).populate("userId");
    if (!allWithdrwals) {
      return res.status(200).json({
        message: "No Withdrwal Founds",
        success: false,
      });
    }
    return res.status(200).json({
      message: "All withdrwal fetched",
      success: true,
      data: allWithdrwals,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.messae || "Server Error",
      success: false,
    });
  }
};

export const ticketApprove = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;

    if (!ticketId || !message) {
      return res.status(400).json({
        message: "Ticket Id && message are required",
        success: false,
      });
    }

    const ticket = await Support.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
        success: false,
      });
    }

    ticket.status = "Approved";
    ticket.response = message;
    await ticket.save();

    return res.status(200).json({
      message: "Ticket Approved Successfully",
      success: true,
      data: ticket,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Server Error",
      success: false,
    });
  }
};

export const ticketReject = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;

    if (!ticketId || !message) {
      return res.status(400).json({
        message: "Ticket Id  & message are required",
        success: false,
      });
    }

    const ticket = await Support.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
        success: false,
      });
    }

    ticket.status = "Rejected";
    ticket.response = message;
    await ticket.save();

    return res.status(200).json({
      message: "Ticket Rejected Successfully",
      success: true,
      data: ticket,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Server Error",
      success: false,
    });
  }
};

export const updateGlobalLimit = async (req, res) => {
  const { newLimit } = req.body;

  if (!newLimit || isNaN(newLimit)) {
    return res.status(400).json({ message: "Invalid limit" });
  }

  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ withdrawalLimit: newLimit });
    } else {
      settings.withdrawalLimit = newLimit;
      await settings.save();
    }

    res.json({ message: "Global withdrawal limit updated", success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to update", error: err.message });
  }
};

export const getAllMessage = async (req, res) => {
  try {
    const allTickets = await Support.find({});
    if (!allTickets) {
      return res.sta(200).json({
        messae: "No Tickets Founds",
        success: false,
      });
    }
    return res.status(200).json({
      message: "All Tickets Fetched",
      success: false,
      data: allTickets,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Server Error",
      success: false,
    });
  }
};
export const getLevelIncomeHistory = async (_, res) => {
  try {
    const getAllLevelIncomes = await LevelIncome.find({})
      .sort({ createdAt: -1 })
      .populate({
        path: "userId fromUserId",
        select: "username walletAddress levelIncome",
      })
      .populate({
        path: "investmentId",
        select: "investmentAmount investmentDate",
      });

    if (!getAllLevelIncomes) {
      return res.status(404).json({
        message: "No Level Income History Found",
        success: false,
      });
    }
    return res.status(200).json({
      message: "LevelIncome History",
      success: true,
      data: getAllLevelIncomes,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Server Errro",
    });
  }
};
export const getTotalInvestedUsers = async (_, res) => {
  try {
    const allInvestUsers = await Investment.find({}).populate("userId");

    if (!allInvestUsers) {
      return res.status(200).json({
        message: "No Invested Users",
        success: false,
      });
    }

    return res.status(200).json({
      message: "All Invested Users",
      success: false,
      data: allInvestUsers,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "server error",
      success: false,
    });
  }
};

export const getBinaryTree = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await UserModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const tree = await buildTree(user._id);

    res.json({ success: true, tree });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
export const getAllAutoPoolHistory = async (req, res) => {
  try {
    const userId = req.admin || req.user;
    if (!userId) {
      return res.status(404).json({
        message: "Unauthorized",
      });
    }
    const allAutoPoolHistory = await AutoPool.find({})
      .populate({
        path: "userId",
        select: "username",
      })
      .populate({
        path: "contributors.userId",
        select: "username",
      });
    if (!allAutoPoolHistory) {
      return res.status(200).json({
        message: "No Auto Pool History Found",
        success: false,
      });
    }
    return res.status(200).json({
      message: "All Auto Pool History",
      success: true,
      data: allAutoPoolHistory,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Server Error",
      success: false,
    });
  }
};

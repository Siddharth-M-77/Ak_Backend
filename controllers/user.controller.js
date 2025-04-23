import Plan from "../models/Plan.model.js";
import UserModel from "../models/user.model.js";
import { handleLevelIncome } from "../utils/handleLevelIncome.js";
import { upgradeIncome } from "../utils/upgradeIncome.js";
import { generateReferralCode, randomUsername } from "../utils/random.js";
import jwt from "jsonwebtoken";
import MatrixModel from "../models/Matrix.model.js";
import InvestmentModel from "../models/investment.model.js";
import DirectReferral from "../models/directReferral.model.js";
import LevelIncome from "../models/levelIncome.model.js";
import Withdrawal from "../models/withdrwal.model.js";
import Support from "../models/support.model.js";
import AutopoolHistory from "../models/autopoolHistory.model.js";

const findAvailableMatrixPosition = async (sponsorId) => {
  const sponsor = await UserModel.findById(sponsorId).lean();
  if (!sponsor) return null;

  if ((sponsor.children || []).length < 4) {
    return { parentId: sponsor._id };
  }

  const directChildren = await UserModel.find({
    _id: { $in: sponsor.children },
  }).lean();

  for (const child of directChildren) {
    if ((child.children || []).length < 4) {
      return { parentId: child._id };
    }
  }

  const queue = [...directChildren];

  while (queue.length > 0) {
    const current = queue.shift();

    if ((current.children || []).length < 4) {
      return { parentId: current._id };
    }

    const nextLevelUsers = await UserModel.find({
      _id: { $in: current.children },
    }).lean();

    queue.push(...nextLevelUsers);
  }

  return null;
};
export const userRegister = async (req, res) => {
  try {
    const { walletAddress, referredBy } = req.body;

    // Check if user already exists
    const existingUser = await UserModel.findOne({ walletAddress });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Generate referral code and username
    const referralCode = generateReferralCode();
    const username = randomUsername();

    const userCount = await UserModel.countDocuments();
    let role = "user";
    let parentId = null;
    let sponsorId = null;

    // If first user, make admin
    if (userCount === 0) {
      role = "admin";
    } else {
      // For all other users, referral is mandatory
      if (!referredBy) {
        return res.status(400).json({
          success: false,
          message: "Referral ID is required",
        });
      }

      const sponsorUser = await UserModel.findOne({ referralCode: referredBy });
      if (!sponsorUser) {
        return res.status(400).json({
          success: false,
          message: "Invalid referral ID",
        });
      }

      sponsorId = sponsorUser._id;

      // Matrix placement logic
      const placement = await findAvailableMatrixPosition(sponsorUser._id);
      if (!placement) {
        return res.status(400).json({
          success: false,
          message: "No available position found",
        });
      }

      parentId = placement.parentId;
    }

    // Create new user
    const newUser = new UserModel({
      walletAddress,
      referralCode,
      sponsorId,
      parentId,
      role,
      username,
      parentReferedCode: referredBy,
    });

    const savedUser = await newUser.save();

    // Update sponsor with referred user (avoid duplicates)
    if (sponsorId) {
      await UserModel.findByIdAndUpdate(sponsorId, {
        $addToSet: { referedUsers: savedUser._id },
      });
    }

    // Update parent with children (avoid duplicates)
    if (parentId) {
      await UserModel.findByIdAndUpdate(parentId, {
        $addToSet: { children: savedUser._id },
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: savedUser._id, role: savedUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Send token in cookie
    res
      .cookie("token", token, {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        httpOnly: true,
        secure: false, // set to true in production with https
      })
      .status(201)
      .json({
        success: true,
        message: "User registered successfully",
        user: savedUser,
        token,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
export const userLogin = async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: "Wallet Address is required",
      });
    }

    const user = await UserModel.findOne({ walletAddress }).populate(
      "referedUsers"
    );
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { id: user._id, walletAddress: user.walletAddress },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res
      .cookie("token", token, {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: false,
        sameSite: "none",
      })
      .status(200)
      .json({
        success: true,
        token,
        data: user,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
export const joinOrUpgradePlan = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user._id;
    const validPlans = await Plan.find({}).distinct("amount");

    if (!validPlans.includes(amount)) {
      return res.status(400).json({ message: "Invalid plan amount" });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userCurrentPlan = user.currentPlanAmount || 0;

    if (userCurrentPlan === 0 && amount !== 15) {
      return res.status(400).json({
        message: "First time only 15$ plan can be purchased",
      });
    }

    const currentPlanIndex = validPlans.indexOf(userCurrentPlan);
    const nextAllowedPlan = validPlans[currentPlanIndex + 1];

    if (userCurrentPlan > 0) {
      if (amount <= userCurrentPlan) {
        return res.status(400).json({
          message: "Upgrade amount must be greater than current plan",
        });
      }

      if (amount !== nextAllowedPlan) {
        return res.status(400).json({
          message: `You can only upgrade to the next plan: $${nextAllowedPlan}`,
        });
      }
    }

    const plan = await Plan.findOne({ amount });
    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }
    if (userCurrentPlan === 0) {
      user.currentPlanAmount = amount;
      user.status = true;
      user.totalInvestment += amount;
      user.isVerified = true;
      user.activeDate = Date.now();
      user.planHistory.push({ amount, type: "JOIN" });
      await user.save();

      await InvestmentModel.create({
        userId: user._id,
        amount: amount,
        planId: plan._id,
        purchaseDate: Date.now(),
        type: "JOIN",
      });

      // await MatrixModel.create({
      //   userId: user._id,
      //   sponserId: user.sponsorId,
      //   planId: plan._id,
      //   planAmount: amount,
      //   joinedAt: Date.now(),
      //   parentId: user.parentId,
      // });

      await handleLevelIncome(userId, amount, "joining");

      return res.status(200).json({
        message: "User joined and level income distributed.",
        success: true,
      });
    }

    user.currentPlanAmount = amount;
    user.planHistory.push({ amount, type: "UPGRADE" });
    await user.save();

    await upgradeIncome(userId, amount);

    return res
      .status(200)
      .json({ message: "User upgraded and income distributed." });
  } catch (err) {
    console.error("Join/Upgrade Plan Error:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};
export const getUsersByLevel = async (req, res) => {
  try {
    const root = await UserModel.findOne({ role: "admin" });

    if (!root) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    }

    const queue = [{ userId: root._id, level: 0 }];
    const levelMap = {};

    while (queue.length > 0) {
      const { userId, level } = queue.shift();

      if (!levelMap[level]) levelMap[level] = 0;
      levelMap[level] += 1;

      const user = await UserModel.findById(userId).populate("referedUsers");

      if (user && user.referedUsers.length > 0) {
        for (let child of user.referedUsers) {
          queue.push({ userId: child._id, level: level + 1 });
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Users per level in 4-child structure",
      data: levelMap,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
export const createPlan = async (req, res) => {
  try {
    const { amount, name, levels } = req.body;

    if (!amount || !name || !levels) {
      return res.status(400).json({
        message: "Amount, Name, and Levels are required",
        success: false,
      });
    }

    // Make sure levels array is in the correct format (optional validation)
    if (!Array.isArray(levels) || levels.length === 0) {
      return res.status(400).json({
        message: "Levels should be a non-empty array",
        success: false,
      });
    }

    // Validate each level to match the expected structure
    for (let level of levels) {
      if (
        !level.level ||
        !level.requiredUsers ||
        !level.sharingIncome ||
        !level.autoPoolIncome
      ) {
        return res.status(400).json({
          message:
            "Each level must contain level, requiredUsers, sharingIncome, and autoPoolIncome",
          success: false,
        });
      }
    }

    // Create the plan with levels
    const plan = await Plan.create({
      amount,
      name,
      levels,
    });

    return res.status(200).json({
      message: "Plan Created Successfully",
      success: true, // success should be true on success
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Server Error",
      success: false,
    });
  }
};
export const getAllPlan = async (_, res) => {
  try {
    const plans = await Plan.find({}).sort({ amount: 1 });
    if (!plans || plans.length === 0) {
      return res.status(404).json({
        message: "No plans found",
        success: false,
      });
    }
    return res.status(200).json({
      message: "Plans fetched successfully",
      data: plans,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error", error });
  }
};
export const getProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.admin._id;
    const user = await UserModel.findById(userId).populate("referedUsers");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({
      message: "User profile fetched successfully",
      data: user,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error", error });
  }
};

export const getReferalIncomeHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const referalIncomeHistory = await DirectReferral.find({
      userId: userId,
    }).populate([
      { path: "fromUserId", select: "username" },
      { path: "userId", select: "username" },
    ]);

    if (!referalIncomeHistory || referalIncomeHistory.length === 0) {
      return res
        .status(200)
        .json({ message: "No referal History found", data: [] });
    }

    return res.status(200).json({
      message: "Referral income history fetched successfully",
      data: referalIncomeHistory,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message || "Server Error",
      success: false,
    });
  }
};
export const getLevelIncomeHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const levelIncomeHistory = await LevelIncome.find({
      userId: userId,
    }).populate([
      { path: "fromUserId", select: "username" },
      { path: "userId", select: "username" },
    ]);

    if (!levelIncomeHistory || levelIncomeHistory.length === 0) {
      return res.status(200).json({ message: "User not found", data: [] });
    }

    return res.status(200).json({
      message: "Level income history fetched successfully",
      data: levelIncomeHistory,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message || "Server Error",
      success: false,
    });
  }
};

export const getDirectUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await UserModel.findById(userId).populate("referedUsers");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Direct users fetched successfully",
      data: user.referedUsers,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message || "Server Error",
      success: false,
    });
  }
};

export const withdrawalHistory = async (req, res) => {
  try {
    const userId = req.user._id || req.admin._id;
    // console.log(userId);
    const allWithdrwal = await Withdrawal.find({ userId: userId });
    if (!allWithdrwal || allWithdrwal.length === 0) {
      return res.status(200).json({
        message: "No withdrwal History Found",
        data: [],
      });
    }

    return res.status(200).json({
      message: "Withdrwal History Fetched",
      success: false,
      data: allWithdrwal,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Server Error",
      success: false,
      F,
    });
  }
};

export const helpAndSupport = async (req, res) => {
  try {
    const userId = req.user._id;
    // console.log(userId);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { message, subject } = req.body;
    // console.log(req.body);
    if (!message || !subject) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }
    const support = await Support.create({
      userId,
      message,
      subject,
      createdAt: new Date(),
    });
    await support.save();
    res
      .status(201)
      .json({ success: true, message: "Support request sent Successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getAllHelpAndSupportHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const supportHistory = await Support.find({ userId }).sort({
      createdAt: -1,
    });
    res.json({ success: true, data: supportHistory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getUsersCountByLevel = async (req, res) => {
  try {
    const userId = req.user._id;

    let levelCounts = [];
    let currentLevelUsers = [userId];
    const visited = new Set();

    for (let level = 1; level <= 5; level++) {
      const users = await UserModel.find(
        { _id: { $in: currentLevelUsers } },
        { referedUsers: 1 }
      );

      let nextLevelUserIds = [];

      users.forEach((user) => {
        if (user.children && user.children.length > 0) {
          user.children.forEach((refId) => {
            const idStr = refId.toString();
            if (!visited.has(idStr)) {
              visited.add(idStr);
              nextLevelUserIds.push(refId);
            }
          });
        }
      });

      const nextLevelUsers = await UserModel.find(
        { _id: { $in: nextLevelUserIds } },
        {
          username: 1,
          referralCode: 1,
          walletAddress: 1,
          totalInvestment: 1,
        }
      );

      levelCounts.push({
        level,
        count: nextLevelUsers.length,
        users: nextLevelUsers,
      });

      currentLevelUsers = nextLevelUserIds;
    }

    res.status(200).json({
      success: true,
      data: levelCounts,
    });
  } catch (error) {
    console.error("Error in getUsersCountByLevel:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const autopoolIncomeHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const autopoolIncomeHistory = await AutopoolHistory.find({ userId: userId })
      .populate({
        path: "userId",
        select: "username",
      })
      .populate({
        path: "contributors.userId",
        select: "username",
      });

    if (!autopoolIncomeHistory || autopoolIncomeHistory.length === 0) {
      return res.status(200).json({ message: "User not found", data: [] });
    }

    return res.status(200).json({
      message: "Autopool income history fetched successfully",
      data: autopoolIncomeHistory,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message || "Server Error",
      success: false,
    });
  }
};

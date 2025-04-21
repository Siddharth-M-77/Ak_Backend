import Earning from "../models/earnings.model.js";
import UserModel from "../models/user.model.js";
import Investment from "../models/investment.model.js";
import { handleLevelIncome } from "./handleLevelIncome.js";
import Plan from "../models/Plan.model.js";
import MatrixModel from "../models/Matrix.model.js";
import UpgradeTableModel from "../models/upgradeTable.model.js";
import DirectReferral from "../models/directReferral.model.js";
import { placeUserInMatrix } from "./placeInMatrix.js";

const LEVEL_INCOME_PERCENT = 30;
const DIRECT_BONUS_PERCENT = 10;

export const upgradeIncome = async (userId, amount) => {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      console.error("User not found for upgrade income.");
      return;
    }

    const plan = await Plan.findOne({ amount });
    if (!plan) {
      console.error("Plan not found for upgrade income.");
      return;
    }

    const levelIncome = (amount * LEVEL_INCOME_PERCENT) / 100;
    const directBonus = (amount * DIRECT_BONUS_PERCENT) / 100;

    const levelsByAmount = await UpgradeTableModel.findOne({ amount });
    if (!levelsByAmount) {
      console.error("Upgrade table not found for amount:", amount);
      return;
    }

    const level = levelsByAmount.level || 1;
    const directReferrerId = user.sponsorId;

    if (directReferrerId) {
      await UserModel.findByIdAndUpdate(directReferrerId, {
        $inc: {
          directReferralAmount: directBonus,
          totalEarnings: directBonus,
          currentEarnings: directBonus,
        },
      });

      user.totalInvestment += amount;
      user.isUpgraded = true;
      await user.save();

      await Investment.create({
        userId: user._id,
        amount: amount,
        type: "UPGRADE",
        purchaseDate: new Date(),
      });

      await DirectReferral.create({
        userId: directReferrerId,
        fromUserId: userId,
        amount: directBonus,
        investment: amount,
        date: new Date(),
      });

      await Earning.create({
        userId: directReferrerId,
        fromUserId: userId,
        type: "DIRECT_BONUS",
        amount: directBonus,
        level,
      });
    }

    // ✅ Optional: If you need Matrix record creation here
    // await MatrixModel.create({
    //   userId: user._id,
    //   sponsorId: user.sponsorId,
    //   planId: plan._id,
    //   planAmount: amount,
    //   joinedAt: new Date(),
    //   parentId: user.parentId,
    // });

    await placeUserInMatrix(user, amount, plan._id);

    let current = user;
    let targetUpline = null;

    for (let i = 0; i < level; i++) {
      if (!current.parentId) break;
      current = await UserModel.findById(current.parentId);
      if (!current) break;
      if (i === level - 1) {
        targetUpline = current;
      }
    }

    if (targetUpline) {
      await UserModel.findByIdAndUpdate(targetUpline._id, {
        $inc: {
          levelIncome: levelIncome,
          totalEarnings: levelIncome,
        },
      });

      await handleLevelIncome(userId, amount, "UPGRADE");

      await DirectReferral.create({
        userId: targetUpline._id,
        fromUserId: userId,
        amount: levelIncome,
        investment: amount,
        date: new Date(),
      });

      await Earning.create({
        userId: targetUpline._id,
        fromUserId: userId,
        type: "UPGRADE",
        amount: levelIncome,
        level,
      });
    } else {
      console.warn(`No upline found at level ${level} for upgrade $${amount}`);
    }
  } catch (err) {
    console.error("Upgrade income error:", err.message);
  }
};

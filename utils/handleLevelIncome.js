import Earning from "../models/earnings.model.js";
import LevelIncome from "../models/levelIncome.model.js";
import UserModel from "../models/user.model.js";

const levelIncomeTable = {
  15: [
    5, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25,
    0.25, 0.25, 0.25,
  ],
  30: [
    0.5, 9, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
    0.5, 0.5, 0.5,
  ],
  50: [
    0.5, 0.5, 15, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
    0.5, 0.5, 0.5,
  ],
  100: [1, 1, 1, 30, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  200: [2, 2, 2, 2, 60, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  500: [5, 5, 5, 5, 5, 150, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  1000: [
    10, 10, 10, 10, 10, 10, 300, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10,
  ],
  2000: [
    20, 20, 20, 20, 20, 20, 20, 600, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20,
  ],
  5000: [
    40, 40, 40, 40, 40, 40, 40, 40, 1500, 40, 40, 40, 40, 40, 40, 40, 40, 40,
  ],
};

export const handleLevelIncome = async (joiningUserId, planAmount, source) => {
  try {
    const incomeArray = levelIncomeTable[planAmount];
    if (!incomeArray) {
      console.error("Invalid plan amount or income structure not defined.");
      return;
    }

    let currentUser = await UserModel.findById(joiningUserId);
    if (!currentUser) {
      console.error("Joining user not found.");
      return;
    }

    for (
      let level = 0;
      level < incomeArray.length && currentUser?.sponsorId;
      level++
    ) {
      const upline = await UserModel.findById(currentUser.sponsorId);
      if (!upline) break;

      const incomeAmount = Number(incomeArray[level] || 0);
      if (incomeAmount > 0) {
        upline.currentEarnings += incomeAmount;
        upline.levelIncome += incomeAmount;
        upline.totalEarnings += incomeAmount;
        await upline.save();

        await LevelIncome.create({
          userId: upline._id,
          fromUserId: joiningUserId,
          amount: incomeAmount,
          planAmount: planAmount,
          level: level + 1,
          source: source || "joining",
        });

        await Earning.create({
          userId: upline._id,
          fromUserId: joiningUserId,
          amount: incomeAmount,
          level: level + 1,
          source: "LEVEL_INCOME",
        });
      }

      currentUser = upline;
    }
  } catch (err) {
    console.log("Error in handleLevelIncome:", err.message);
  }
};

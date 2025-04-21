import UserModel from "../models/user.model.js";
import Earning from "../models/earnings.model.js";

const levelDetails = [
  { level: 1, users: 4, sharing: 0.1, bonus: 0.4 },
  { level: 2, users: 16, sharing: 0.5, bonus: 8 },
  { level: 3, users: 64, sharing: 0.25, bonus: 16 },
  { level: 4, users: 256, sharing: 0.25, bonus: 64 },
  { level: 5, users: 1024, sharing: 0.25, bonus: 256 },
  { level: 6, users: 4096, sharing: 0.25, bonus: 1024 },
];

export const handleAutoPool = async (userId) => {
  try {
    const user = await UserModel.findById(userId);
    if (!user) return console.log("User not found for AutoPool");

    const allDownlines = await getAllDownlines(userId, 6);

    for (const detail of levelDetails) {
      const { level, users: requiredUsers, sharing, bonus } = detail;

      const levelUsers = allDownlines.filter((dl) => dl.level === level);

      console.log(`Level ${level} - Found ${levelUsers.length} users`);

      if (levelUsers.length >= requiredUsers) {
        const alreadyEarned = await Earning.findOne({
          user: userId,
          type: "AUTO_POOL",
          level,
        });

        if (!alreadyEarned) {
          const totalIncome = sharing + bonus;

          await UserModel.findByIdAndUpdate(userId, {
            $inc: {
              "earnings.sharingIncome": sharing,
              "earnings.autoPoolBonus": bonus,
              "earnings.totalIncome": totalIncome,
            },
          });

          await Earning.create({
            user: userId,
            fromUser: userId,
            type: "AUTO_POOL",
            amount: totalIncome,
            level,
          });

          console.log(
            `AutoPool Income added for User ${userId} at level ${level}`
          );
        } else {
          console.log(`Already earned AutoPool income at level ${level}`);
        }
      }
    }
  } catch (err) {
    console.error("Auto Pool Error:", err.message);
  }
};

export const getAllDownlines = async (userId, maxLevel = 6) => {
  let queue = [{ id: userId, level: 0 }];
  let result = [];
  const visited = new Set();
  for (let currentLevel = 1; currentLevel <= maxLevel; currentLevel++) {
    let nextQueue = [];
    for (const u of queue) {
      const user = await UserModel.findById(u.id).select("referedUsers");
      if (user?.referedUsers?.length) {
        for (const referedUserId of user.referedUsers) {
          const idStr = referedUserId.toString();
          if (!visited.has(idStr)) {
            result.push({ id: referedUserId, level: currentLevel });
            nextQueue.push({ id: referedUserId, level: currentLevel });
            visited.add(idStr);
          }
        }
      }
    }

    queue = nextQueue;
  }

  return result;
};

import AutopoolHistory from "../models/autopoolHistory.model.js";
import MatrixModel from "../models/Matrix.model.js";
import UserModel from "../models/user.model.js";

const getIncomeStructure = (joiningAmount) => {
  const structures = {
    15: [
      { users: 4, sharing: 0.1, bonus: 0.4 },
      { users: 16, sharing: 0.5, bonus: 8 },
      { users: 64, sharing: 0.25, bonus: 16 },
      { users: 256, sharing: 0.25, bonus: 64 },
      { users: 1024, sharing: 0.25, bonus: 256 },
      { users: 4096, sharing: 0.25, bonus: 1024 },
    ],
    30: [
      { users: 4, sharing: 0.25, bonus: 1 },
      { users: 16, sharing: 1, bonus: 16 },
      { users: 64, sharing: 0.5, bonus: 32 },
      { users: 256, sharing: 0.5, bonus: 128 },
      { users: 1024, sharing: 0.5, bonus: 512 },
      { users: 4096, sharing: 0.5, bonus: 2048 },
    ],
    50: [
      { users: 4, sharing: 2, bonus: 8 },
      { users: 16, sharing: 1, bonus: 16 },
      { users: 64, sharing: 1, bonus: 64 },
      { users: 256, sharing: 1, bonus: 256 },
      { users: 1024, sharing: 4, bonus: 4096 },
      { users: 4096, sharing: 4, bonus: 16384 },
    ],
    100: [
      { users: 4, sharing: 4, bonus: 16 },
      { users: 16, sharing: 2, bonus: 32 },
      { users: 64, sharing: 2, bonus: 128 },
      { users: 256, sharing: 2, bonus: 512 },
      { users: 1024, sharing: 8, bonus: 8192 },
      { users: 4096, sharing: 8, bonus: 32768 },
    ],
    200: [
      { users: 4, sharing: 8, bonus: 16 },
      { users: 16, sharing: 4, bonus: 32 },
      { users: 64, sharing: 4, bonus: 128 },
      { users: 256, sharing: 4, bonus: 512 },
      { users: 1024, sharing: 16, bonus: 8192 },
      { users: 4096, sharing: 16, bonus: 32768 },
    ],
    500: [
      { users: 4, sharing: 20, bonus: 80 },
      { users: 16, sharing: 10, bonus: 160 },
      { users: 64, sharing: 10, bonus: 640 },
      { users: 256, sharing: 10, bonus: 2560 },
      { users: 1024, sharing: 40, bonus: 40960 },
      { users: 4096, sharing: 40, bonus: 163720 },
    ],
    1000: [
      { users: 4, sharing: 40, bonus: 160 },
      { users: 16, sharing: 20, bonus: 320 },
      { users: 64, sharing: 20, bonus: 1280 },
      { users: 256, sharing: 20, bonus: 5120 },
      { users: 1024, sharing: 80, bonus: 81920 },
      { users: 4096, sharing: 80, bonus: 327680 },
    ],
    2000: [
      { users: 4, sharing: 80, bonus: 320 },
      { users: 16, sharing: 40, bonus: 640 },
      { users: 64, sharing: 40, bonus: 2560 },
      { users: 256, sharing: 40, bonus: 10240 },
      { users: 1024, sharing: 160, bonus: 163840 },
      { users: 4096, sharing: 160, bonus: 655360 },
    ],
    5000: [
      { users: 4, sharing: 200, bonus: 800 },
      { users: 16, sharing: 100, bonus: 1600 },
      { users: 64, sharing: 100, bonus: 6400 },
      { users: 256, sharing: 100, bonus: 25600 },
      { users: 1024, sharing: 400, bonus: 409600 },
      { users: 4096, sharing: 400, bonus: 1638400 },
    ],
  };

  return structures[joiningAmount] || [];
};

export const distributeIncome = async () => {
  // console.log("🟡 Starting distributeIncome");

  const userList = await UserModel.find({});
  const matrixList = await MatrixModel.find({});
  const users = [...userList, ...matrixList];

  const processedUserIds = new Set();

  for (const user of users) {
    if (processedUserIds.has(user._id.toString())) {
      // console.log(`⏭️ Skipping already processed user: ${user._id}`);
      continue;
    }

    // console.log(
    //   `\n👉 Processing user: ${user._id} (${user.username || "no name"})`
    // );

    if (!user.children || user.children.length === 0) continue;

    const incomeStructure = getIncomeStructure(user.currentPlanAmount);
    if (!incomeStructure.length) continue;

    let queue = [...user.children];
    let level = 0;
    let stopProcessing = false;

    while (queue.length && level < incomeStructure.length && !stopProcessing) {
      const currentLevelUsers = [];
      const nextQueue = [];

      for (const userId of queue) {
        const child = await UserModel.findById(userId);
        if (child) {
          currentLevelUsers.push(child);
          if (child.children?.length) nextQueue.push(...child.children);
        }
      }

      const qualifiedUsers = currentLevelUsers.filter(
        (child) =>
          child.currentPlanAmount === user.currentPlanAmount &&
          child.currentPlanAmount > 0
      );

      const levelInfo = incomeStructure[level];
      if (qualifiedUsers.length >= levelInfo.users) {
        const alreadyGot = user.autoPoolIncome?.find(
          (l) =>
            l.level === level + 1 && l.planAmount === user.currentPlanAmount
        );

        if (!alreadyGot) {
          // Crediting bonus
          user.totalAutoPoolIncome =
            (user.totalAutoPoolIncome || 0) + levelInfo.bonus;
          user.totalEarnings = (user.totalEarnings || 0) + levelInfo.bonus;
          user.currentEarnings = (user.currentEarnings || 0) + levelInfo.bonus;

          user.autoPoolIncome = [
            ...(user.autoPoolIncome || []),
            {
              level: level + 1,
              amount: levelInfo.bonus,
              planAmount: user.currentPlanAmount,
              date: new Date(),
            },
          ];

          // Sharing
          const sharePerUser = levelInfo.sharing;
          const contributors = [];

          for (const child of qualifiedUsers) {
            user.totalSharingIncome =
              (user.totalSharingIncome || 0) + sharePerUser;
            user.totalEarnings += sharePerUser;
            user.currentEarnings += sharePerUser;

            user.sharingIncome = [
              ...(user.sharingIncome || []),
              {
                from: child._id,
                level: level + 1,
                amount: sharePerUser,
                planAmount: user.currentPlanAmount,
                date: new Date(),
              },
            ];

            contributors.push({ userId: child._id, amount: sharePerUser });
          }

          try {
            await new AutopoolHistory({
              userId: user._id,
              planAmount: user.currentPlanAmount,
              amount: levelInfo.bonus,
              creditedOn: new Date(),
              level: level + 1,
              incomeType: "autopool",
              contributors,
            }).save();

            await new AutopoolHistory({
              userId: user._id,
              planAmount: user.currentPlanAmount,
              amount: sharePerUser * qualifiedUsers.length,
              creditedOn: new Date(),
              level: level + 1,
              incomeType: "sharing",
              contributors,
            }).save();
          } catch (err) {
            // console.error(`❌ Error saving history:`, err.message);
          }
        } else {
          // console.log(`⏭️ Already got bonus for level ${level + 1}`);
        }
      } else {
        // console.log(`⚠️ Not enough users at level ${level + 1}, stopping...`);
        stopProcessing = true;
      }

      queue = nextQueue;
      level++;
    }

    // Mark user as processed
    processedUserIds.add(user._id.toString());

    user.markModified("autoPoolIncome");
    user.markModified("sharingIncome");
    await user.save();
    // console.log(`💾 User updated and saved: ${user._id}`);
  }

  // console.log("✅ Finished distributeIncome.");
};

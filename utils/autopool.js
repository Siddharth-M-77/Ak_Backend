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
  console.log("🟡 Starting distributeIncome");

  const userList = await UserModel.find({});
  const matrixList = await MatrixModel.find({});
  const users = [...userList, ...matrixList];

  console.log(`🔍 Total users fetched: ${users.length}`);

  for (const user of users) {
    console.log(
      `\n👉 Processing user: ${user._id} (${user.username || "no name"})`
    );

    if (!user.children || user.children.length < 1) {
      console.log("⛔ Skipping user: no children");
      continue;
    }

    const incomeStructure = getIncomeStructure(user.currentPlanAmount);
    console.log(
      `📊 Income Structure for ₹${user.currentPlanAmount}:`,
      incomeStructure
    );

    if (!incomeStructure.length) {
      console.log("⚠️ No income structure found for this plan. Skipping...");
      continue;
    }

    let levelsCompleted = 0;
    let allLevelUsers = [];
    let queue = [...user.children];

    while (queue.length && levelsCompleted < 6) {
      const levelUsers = [];

      for (const userId of queue) {
        const child = await UserModel.findById(userId);
        if (child) {
          levelUsers.push(child);
          if (child.children?.length) {
            queue.push(...child.children);
          }
        }
      }

      allLevelUsers.push(levelUsers);
      queue = queue.slice(levelUsers.length);
      levelsCompleted++;

      console.log(
        `✅ Level ${levelsCompleted} - users found: ${levelUsers.length}`
      );
    }

    for (let i = 0; i < allLevelUsers.length; i++) {
      const levelInfo = incomeStructure[i];
      if (!levelInfo) {
        console.log(`⚠️ No level info for level ${i + 1}`);
        continue;
      }

      const usersAtLevel = allLevelUsers[i].filter(
        (child) =>
          child.currentPlanAmount === user.currentPlanAmount &&
          child.currentPlanAmount > 0
      );

      console.log(
        `📍 Level ${i + 1} - Qualified users: ${usersAtLevel.length}`
      );

      if (usersAtLevel.length >= levelInfo.users) {
        const alreadyGot = user.autoPoolIncome?.find(
          (l) => l.level === i + 1 && l.planAmount === user.currentPlanAmount
        );

        if (!alreadyGot) {
          console.log(
            `💸 Crediting bonus ₹${levelInfo.bonus} for level ${i + 1}`
          );

          user.totalAutoPoolIncome =
            (user.totalAutoPoolIncome || 0) + levelInfo.bonus;
          user.totalEarnings = (user.totalEarnings || 0) + levelInfo.bonus;
          user.currentEarnings = (user.currentEarnings || 0) + levelInfo.bonus;

          user.autoPoolIncome = [
            ...(user.autoPoolIncome || []),
            {
              level: i + 1,
              amount: levelInfo.bonus,
              planAmount: user.currentPlanAmount,
              date: new Date(),
            },
          ];
        } else {
          console.log(
            `⏭️ Already got bonus for level ${i + 1}, skipping bonus...`
          );
        }

        const sharePerChild = levelInfo.sharing;
        const contributors = [];

        for (const child of usersAtLevel) {
          user.totalSharingIncome =
            (user.totalSharingIncome || 0) + sharePerChild;
          user.totalEarnings += sharePerChild;
          user.currentEarnings += sharePerChild;

          user.sharingIncome = [
            ...(user.sharingIncome || []),
            {
              from: child._id,
              level: i + 1,
              amount: sharePerChild,
              planAmount: user.currentPlanAmount,
              date: new Date(),
            },
          ];

          contributors.push({
            userId: child._id,
            amount: sharePerChild,
          });
        }

        try {
          const autopoolHistory = new AutopoolHistory({
            userId: user._id,
            planAmount: user.currentPlanAmount,
            amount: levelInfo.bonus,
            creditedOn: new Date(),
            level: i + 1,
            incomeType: "autopool",
            contributors,
          });
          await autopoolHistory.save();
          console.log(`📝 Saved autopool history for level ${i + 1}`);

          const sharingHistory = new AutopoolHistory({
            userId: user._id,
            planAmount: user.currentPlanAmount,
            amount: sharePerChild * usersAtLevel.length,
            creditedOn: new Date(),
            level: i + 1,
            incomeType: "sharing",
            contributors,
          });
          await sharingHistory.save();
          console.log(`📝 Saved sharing history for level ${i + 1}`);
        } catch (err) {
          console.error(
            `❌ Error saving history for level ${i + 1}:`,
            err.message
          );
        }
      } else {
        console.log(
          `⚠️ Not enough users at level ${i + 1}. Required: ${levelInfo.users}`
        );
      }
    }

    user.markModified("autoPoolIncome");
    user.markModified("sharingIncome");
    await user.save();
    console.log(`💾 User updated and saved: ${user._id}`);
  }

  console.log("✅ Finished distributeIncome. All histories processed.");
};

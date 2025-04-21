import MatrixModel from "../models/Matrix.model.js";
import UserModel from "../models/user.model.js";

const getMatrixForPackage = async (pkgAmount) => {
  const matrix = await MatrixModel.findOne({ packageAmount: pkgAmount });
  return matrix;
};

// Helper: Insert into matrix for new user
const insertIntoMatrix = async (user, pkgAmount) => {
  const matrix = await getMatrixForPackage(pkgAmount);
  const position = await matrix.findPosition();
  user.matrices.push({ packageAmount: pkgAmount, position });
  await user.save();
  await matrix.addUser(user.id, position);
};

// Helper: Upgrade logic for matrix (add to new package tree but retain old)
const upgradeUserMatrix = async (user, pkgAmount) => {
  const existing = user.matrices.find((m) => m.packageAmount === pkgAmount);
  if (!existing) {
    const matrix = await getMatrixForPackage(pkgAmount);
    const position = await matrix.findPosition();
    user.matrices.push({ packageAmount: pkgAmount, position });
    await matrix.addUser(user.id, position);
    await user.save();
  }
};

// Helper: Distribute income on joining
const distributeJoiningIncome = async (user, pkgAmount) => {
  let currentRef = user.referrerId;
  for (let level = 1; level <= 18; level++) {
    if (!currentRef) break;

    const refUser = await UserModel.findById(currentRef);
    const income = getLevelIncome(pkgAmount, level); // e.g., flat or % based
    if (income > 0)
      await creditIncome(refUser._id, income, `Joining Level ${level}`);

    currentRef = refUser.referrerId;
  }
};

// Helper: Distribute upgrade income
const distributeUpgradeIncome = async (user, referrer, pkgAmount) => {
  const uplineLevel = getUpgradeLevel(pkgAmount); // e.g., 2nd level for $30, 3rd for $50
  let currentRef = user.referrerId;

  for (let i = 1; i <= uplineLevel; i++) {
    if (!currentRef) break;
    currentRef = (await UserModel.findById(currentRef)).referrerId;
  }

  if (currentRef) {
    const uplineIncome = pkgAmount * 0.3;
    await creditIncome(
      currentRef,
      uplineIncome,
      `Upgrade Upline Income for ${pkgAmount}`
    );
  }

  if (referrer) {
    const directBonus = pkgAmount * 0.1;
    await creditIncome(
      referrer._id,
      directBonus,
      `Upgrade Direct Referral for ${pkgAmount}`
    );
  }
};

// Helper: Get level-wise autopool matrix
const getUserMatrixLevels = async (userId) => {
  const user = await UserModel.findById(userId);
  let result = {};

  for (let entry of user.matrices) {
    const matrix = await MatrixModel.findOne({
      packageAmount: entry.packageAmount,
    });
    const tree = await matrix.getUserTree(userId);
    result[entry.packageAmount] = tree; // levels mapped to array of users
  }
  return result;
};

const getAutopoolIncomePerLevel = (level) => {
  const incomeMap = {
    1: 0.1,
    2: 0.5,
    3: 2,
    4: 5,
    5: 10,
    6: 20,
    7: 40,
    8: 100,
    9: 200,
    10: 500,
  };
  return incomeMap[level] || 0;
};

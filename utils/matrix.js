// import MatrixModel from "../models/Matrix.model.js";

// const findAvailableMatrixPosition = async (sponsorId, planAmount) => {
//   const sponsorMatrix = await MatrixModel.findOne({
//     userId: sponsorId,
//     planAmount,
//   }).lean();

//   if (!sponsorMatrix) return null;

//   const children = await MatrixModel.find({
//     parentId: sponsorMatrix.userId,
//     planAmount,
//   }).lean();

//   if (children.length < 3) {
//     return { parentId: sponsorMatrix.userId };
//   }

//   const queue = [...children];

//   while (queue.length > 0) {
//     const current = queue.shift();

//     const currentChildren = await MatrixModel.find({
//       parentId: current.userId,
//       planAmount,
//     }).lean();

//     if (currentChildren.length < 3) {
//       return { parentId: current.userId };
//     }

//     queue.push(...currentChildren);
//   }

//   return null;
// };

import MatrixModel from "../models/Matrix.model.js";

export const placeUserInMatrix = async (user, planAmount, planId) => {
  const alreadyInMatrix = await MatrixModel.findOne({
    userId: user._id,
    planAmount,
  });

  if (alreadyInMatrix) return;

  const position = await findAvailableMatrixPosition(
    user.sponsorId,
    planAmount
  );

  // Create user in matrix
  await MatrixModel.create({
    userId: user._id,
    sponserId: user.sponsorId,
    planId,
    planAmount,
    joinedAt: Date.now(),
    parentId: position ? position.parentId : null,
  });
};

import MatrixModel from "../models/Matrix.model.js";

const findParentForMatrix = async (planAmount) => {
  const root = await MatrixModel.findOne({ planAmount, parent: null });

  if (!root) return null;

  const queue = [{ node: root, level: 0 }];

  while (queue.length > 0) {
    const { node, level } = queue.shift();

    const children = await MatrixModel.find({ parent: node._id });

    if (children.length < 4) {
      return { parentId: node._id, level: level + 1 };
    }

    for (let child of children) {
      queue.push({ node: child, level: level + 1 });
    }
  }

  return null;
};

export const placeUserInMatrix = async (user, planAmount, planId) => {
  const alreadyExists = await MatrixModel.findOne({
    userId: user._id,
    planAmount,
  });

  if (alreadyExists) return;

  let root = await MatrixModel.findOne({ planAmount, parent: null });

  if (!root) {
    await MatrixModel.create({
      userId: user._id,
      sponserId: user.sponsorId,
      planId,
      planAmount,
      parent: null,
      level: 0,
      children: [],
    });

    return;
  }

  const parentInfo = await findParentForMatrix(planAmount);

  const newEntry = await MatrixModel.create({
    userId: user._id,
    sponserId: user.sponsorId,
    planId,
    planAmount,
    parent: parentInfo.parentId,
    level: parentInfo.level,
    children: [],
  });

  await MatrixModel.findByIdAndUpdate(parentInfo.parentId, {
    $push: { children: newEntry._id },
  });
};

export const placeUserInMatrix = async (user, planAmount, planId) => {
  const alreadyExists = await MatrixModel.findOne({
    planAmount,
  });

  if (alreadyExists) return;

  const candidates = await MatrixModel.find({ planAmount });

  let parentToSet = null;
  for (let candidate of candidates) {
    const children = await MatrixModel.find({ parentId: candidate.userId });
    if (children.length < 3) {
      parentToSet = candidate.userId;
      break;
    }
  }

  await MatrixModel.create({
    userId: user._id,
    sponserId: user.sponsorId,
    planId,
    planAmount,
    joinedAt: Date.now(),
    parentId: parentToSet,
  });
};

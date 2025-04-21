const findUserLevel = async (userId) => {
  let level = 0;
  let currentUser = await UserModel.findById(userId);

  while (currentUser && currentUser.parentId) {
    level++;
    currentUser = await UserModel.findById(currentUser.parentId);
  }

  return level;
};
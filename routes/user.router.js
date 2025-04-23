import express from "express";

import {
  autopoolIncomeHistory,
  createPlan,
  getAllHelpAndSupportHistory,
  getAllPlan,
  getDirectUsers,
  getLevelIncomeHistory,
  getProfile,
  getReferalIncomeHistory,
  getUsersByLevel,
  getUsersCountByLevel,
  helpAndSupport,
  joinOrUpgradePlan,
  userLogin,
  userRegister,
  withdrawalHistory,
} from "../controllers/user.controller.js";
import { deleteBanner, getBanners } from "../controllers/admin.controller.js";
import { IsAuthenticated } from "../middlewares/IsAuthenticated.js";

const router = express.Router();
router.route("/register").post(userRegister);
router.route("/login").post(userLogin);
router.route("/getLevel").post(IsAuthenticated, getUsersByLevel);
router.route("/plan-create").post(IsAuthenticated, createPlan);
router.route("/get-Profile").get(IsAuthenticated, getProfile);
router.route("/plan-buy").post(IsAuthenticated, joinOrUpgradePlan);
router.route("/all-packages").get(IsAuthenticated, getAllPlan);
router.route("/getAll-packages").get(IsAuthenticated, getDirectUsers);
router.route("/withdrawals-history").get(IsAuthenticated, withdrawalHistory);
router
  .route("/getLevelIncome-history")
  .get(IsAuthenticated, getLevelIncomeHistory);
router
  .route("/getreferal-history")
  .get(IsAuthenticated, getReferalIncomeHistory);
router.route("/support/create").post(IsAuthenticated, helpAndSupport);
router
  .route("/support/messages")
  .get(IsAuthenticated, getAllHelpAndSupportHistory);

router.route("/get-banners").get(getBanners);
router.route("/getLevelUsers").get(IsAuthenticated, getUsersCountByLevel);
router.get("/delete-banner/:id", deleteBanner);
// router.route("/get-binary").get(IsAuthenticated, getBinaryTree);
router.route("/autopool-history").get(IsAuthenticated, autopoolIncomeHistory);

export default router;

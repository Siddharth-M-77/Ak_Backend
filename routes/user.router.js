import express from "express";

import IsAuthenticated from "../middlewares/IsAuthenticated.js";
import {
  createPlan,
  getAllPlan,
  getDirectUsers,
  getLevelIncomeHistory,
  getProfile,
  getReferalIncomeHistory,
  getUsersByLevel,
  joinOrUpgradePlan,
  userLogin,
  userRegister,
} from "../controllers/user.controller.js";

const router = express.Router();
router.route("/register").post(userRegister);
router.route("/login").post(userLogin);
router.route("/getLevel").post(IsAuthenticated, getUsersByLevel);
router.route("/plan-create").post(IsAuthenticated, createPlan);
router.route("/get-Profile").get(IsAuthenticated, getProfile);
router.route("/plan-buy").post(IsAuthenticated, joinOrUpgradePlan);
router.route("/all-packages").get(IsAuthenticated, getAllPlan);
router.route("/getAll-packages").get(IsAuthenticated, getDirectUsers);
router
  .route("/getLevelIncome-history")
  .get(IsAuthenticated, getLevelIncomeHistory);
router
  .route("/getreferal-history")
  .get(IsAuthenticated, getReferalIncomeHistory);

export default router;

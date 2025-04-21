import express from "express";
import {
  adminLogin,
  adminRegister,
  allPurchaseHistory,
  allUsers,
  getAllLevelIncome,
  getAllReferalBonus,
  getProfile,
  upgradeIncome,
} from "../controllers/admin.controller.js";
import { isAdminAuthenticated } from "../middlewares/admin.js";

const router = express.Router();

router.route("/register").post(adminRegister);
router.route("/login").post(adminLogin);
router.route("/upgrade").post(isAdminAuthenticated, upgradeIncome);
router.route("/getProfile").get(isAdminAuthenticated, getProfile);
router.route("/getAllUsers").get(isAdminAuthenticated, allUsers);
router
  .route("/getAllInvestedUsers")
  .get(isAdminAuthenticated, allPurchaseHistory);
router
  .route("/getAllReferalBonus-history")
  .get(isAdminAuthenticated, getAllReferalBonus);
router
  .route("/getAllLevelIncome-history")
  .get(isAdminAuthenticated, getAllLevelIncome);

export default router;

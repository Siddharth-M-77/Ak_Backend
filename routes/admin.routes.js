import express from "express";
import {
  adminLogin,
  adminRegister,
  allPurchaseHistory,
  allUsers,
  allWithdrwal,
  deleteBanner,
  getAllLevelIncome,
  getAllReferalBonus,
  getBanners,
  getProfile,
  ticketApprove,
  ticketReject,
  updateGlobalLimit,
  upgradeIncome,
  uploadBanner,
  getAllMessage,
  getLevelIncomeHistory,
  getTotalInvestedUsers,
  getAllAutoPoolHistory,
} from "../controllers/admin.controller.js";
import { isAdminAuthenticated } from "../middlewares/admin.js";
import bannerUpload from "../utils/multer.js";

const router = express.Router();

router.route("/register").post(adminRegister);
router.route("/login").post(adminLogin);

router.route("/upgrade").post(isAdminAuthenticated, upgradeIncome);
router.route("/getProfile").get(isAdminAuthenticated, getProfile);
router.route("/getAllUsers").get(isAdminAuthenticated, allUsers);
router
  .route("/getAllInvestedUsers")
  .get(isAdminAuthenticated, getTotalInvestedUsers);
router
  .route("/getAllReferalBonus-history")
  .get(isAdminAuthenticated, getAllReferalBonus);
router
  .route("/getAllLevelIncome-history")
  .get(isAdminAuthenticated, getLevelIncomeHistory);
router.route("/support-in-process").get(isAdminAuthenticated, getAllMessage);

router.route("/get-banners").get(isAdminAuthenticated, getBanners);
router.route("/delete-banner/:id").delete(deleteBanner);
router
  .route("/upload-banner")
  .post(bannerUpload.single("banner"), uploadBanner);

router.route("/withdrwal-limit").post(isAdminAuthenticated, updateGlobalLimit);
router.route("/all-users").get(isAdminAuthenticated, allUsers);
router.route("/withdrawal-reports").get(isAdminAuthenticated, allWithdrwal);
router
  .route("/autopool-history")
  .get(isAdminAuthenticated, getAllAutoPoolHistory);

// Support ticket actions
router
  .route("/support/status/approve/:ticketId")
  .post(isAdminAuthenticated, ticketApprove);
router
  .route("/support/status/reject/:ticketId")
  .post(isAdminAuthenticated, ticketReject);
router.route("/support-in-process").get(isAdminAuthenticated, getAllMessage);

export default router;

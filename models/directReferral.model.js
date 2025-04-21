import mongoose from "mongoose";

const directReferralSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
    },
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
    },
    amount: { type: Number, required: true },
    investment: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["joining", "UPGRADE"],
    },

    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const DirectReferral = mongoose.model("ReferralBonus", directReferralSchema);
export default DirectReferral;

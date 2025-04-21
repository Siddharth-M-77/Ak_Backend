import mongoose from "mongoose";

const planPurchaseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
    },
    planAmount: {
      type: Number,
      required: true,
      min: [1, "Plan amount should be greater than 0"],
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
    },
  },
  {
    timestamps: true,
  }
);

planPurchaseSchema.index({ userId: 1 });
planPurchaseSchema.index({ purchaseDate: 1 });

const PlanPurchase = mongoose.model("PlanPurchase", planPurchaseSchema);

export default PlanPurchase;

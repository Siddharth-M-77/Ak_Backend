import mongoose from "mongoose";

const earningSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ["AUTO_POOL", "LEVEL_INCOME", "UPGRADE", "MATRIX", "DIRECT_BONUS"],
    },
    amount: {
      type: Number,
      required: true,
    },
    level: {
      type: Number,
      required: true,
    },
    // planId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Plan",
    // },
    creditedOn: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Earning = mongoose.model("Earning", earningSchema);

export default Earning;

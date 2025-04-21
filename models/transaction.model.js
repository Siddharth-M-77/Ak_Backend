import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
    },
    level: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["sharing", "autoPoolBonus"],
      required: true,
    },
    sharing: {
      type: Number,
      required: true,
    },
    autoPoolBonus: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    planAmount: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const transactionModel = mongoose.model("transactionModel", transactionSchema);
export default transactionModel;

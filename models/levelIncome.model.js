import mongoose from "mongoose";

const levelIncomeSchema = new mongoose.Schema(
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
    amount: {
      type: Number,
      required: true,
    },
    planAmount: {
      type: Number,
      required: true,
    },
    
    level: {
      type: Number,
      required: true,
    },
    creditedOn: {
      type: Date,
      default: Date.now,
    },

    source: {
      type: String,
      enum: ["joining", "UPGRADE"],
      required: true,
    },
  },
  { timestamps: true }
);

const LevelIncome = mongoose.model("LevelIncome", levelIncomeSchema);
export default LevelIncome;

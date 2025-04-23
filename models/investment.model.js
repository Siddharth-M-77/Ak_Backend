import mongoose from "mongoose";

const investmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    txResponse: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

const InvestmentModel = mongoose.model("InvestmentModel", investmentSchema);
export default InvestmentModel;

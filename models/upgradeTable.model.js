import mongoose from "mongoose";

const upgradeTableSchema = new mongoose.Schema(
  {
    amount: {
      type: String,
      required: true,
    },
    level: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);
const UpgradeTableModel = mongoose.model(
  "UpgradeTableModel",
  upgradeTableSchema
);
export default UpgradeTableModel;

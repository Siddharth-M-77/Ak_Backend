import mongoose from "mongoose";

const autopoolHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  creditedOn: {
    type: Date,
    default: Date.now,
  },
});

const AutopoolHistory = mongoose.model(
  "AutopoolHistory",
  autopoolHistorySchema
);
export default AutopoolHistory;

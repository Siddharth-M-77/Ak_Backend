import mongoose from "mongoose";

const autopoolHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  planAmount: {
    type: Number,
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
  level: {
    type: Number,
    required: true,
  },
  incomeType: {
    type: String,
    enum: ["sharing", "autopool"],
    required: true,
  },
  contributors: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
    },
  ],
});

autopoolHistorySchema.index(
  { userId: 1, level: 1, planAmount: 1, incomeType: 1 },
  { unique: true }
);

const AutopoolHistory = mongoose.model(
  "AutopoolHistory",
  autopoolHistorySchema
);

export default AutopoolHistory;

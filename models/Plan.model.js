import mongoose from "mongoose";

// Level ka embedded schema (jitna data har level mein hoga)
const levelSchema = new mongoose.Schema(
  {
    level: {
      type: Number,
      required: true,
    },
    requiredUsers: {
      type: Number,
      required: true,
    },
    sharingIncome: {
      type: Number,
      required: true,
    },
    autoPoolIncome: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
); 

const planSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    levels: {
      type: [levelSchema],
      required: true,
    },
  },
  { timestamps: true }
);

// Plan model
const Plan = mongoose.model("Plan", planSchema);
export default Plan;

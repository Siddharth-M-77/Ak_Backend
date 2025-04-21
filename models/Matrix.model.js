import mongoose from "mongoose";

const matrixSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserModel",
    required: true,
  },
  planAmount: {
    type: Number,
    required: true,
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Plan",
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserModel",
    default: null,
  },
  children: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MatrixModel",
    },
  ],

  level: {
    type: Number,
    default: 1,
  },
  sponserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserModel",
    required: true,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

matrixSchema.index({ planAmount: 1, level: 1 });

const MatrixModel = mongoose.model("MatrixModel", matrixSchema);
export default MatrixModel;

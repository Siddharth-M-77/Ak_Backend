import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    referralCode: {
      type: String,
      required: true,
      unique: true,
    },

    sponsorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      default: null,
    },

    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      default: null,
    },

    parentReferedCode: {
      type: String,
      default: null,
    },

    left: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      default: null,
    },

    right: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      default: null,
    },

    position: {
      type: String,
      default: null,
    },

    referedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserModel",
      },
    ],

    directRefs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserModel",
      },
    ],

    walletAddress: {
      type: String,
      required: true,
      unique: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
    },

    status: {
      type: Boolean,
      default: false,
    },

    activeDate: {
      type: Date,
      default: null,
    },

    totalEarnings: {
      type: Number,
      default: 0,
    },

    currentEarnings: {
      type: Number,
      default: 0,
    },

    totalPayouts: {
      type: Number,
      default: 0,
    },
    isAutopool: {
      type: Boolean,
      default: false,
    },

    totalInvestment: {
      type: Number,
      default: 0,
    },

    levelIncome: {
      type: Number,
      default: 0,
    },

    directReferalAmount: {
      type: Number,
      default: 0,
    },

    levels: [
      {
        level: Number,
        users: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserModel",
          },
        ],
      },
    ],

    currentPlanAmount: {
      type: Number,
      default: 0,
    },

    planHistory: [
      {
        amount: Number,
        purchasedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    levelCounts: {
      type: Map,
      of: Number,
      default: {},
    },
    children: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserModel",
      },
    ],

    isUpgraded: {
      type: Boolean,
      default: false,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },

    upgradeCount: {
      type: Number,
      default: 0,
    },

    // ✅ Sharing Income (per level)
    sharingIncome: [
      {
        level: Number,
        amount: {
          type: Number,
          default: 0,
        },
      },
    ],

    autoPoolIncome: [
      {
        level: Number,
        amount: {
          type: Number,
          default: 0,
        },
      },
    ],

    totalSharingIncome: {
      type: Number,
      default: 0,
    },

    totalAutoPoolIncome: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const UserModel = mongoose.model("UserModel", userSchema);
export default UserModel;

console.log("✅ NEW User.js LOADED");

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true, // optional but good practice
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    skills: [String],

    ideasCreatedCount: {
      type: Number,
      default: 0,
    },

    ideasJoinedCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// ✅ CORRECT pre-save hook (NO arrow function)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ✅ Password comparison
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

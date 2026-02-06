const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
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

// 🔥 FIXED PRE-SAVE HOOK
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next(); // ✅ MUST return
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next(); // ✅ MUST call next
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

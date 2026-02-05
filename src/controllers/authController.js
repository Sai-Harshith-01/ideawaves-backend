const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
 const { name, email, password, skills } = req.body;

 try {
  const userExists = await User.findOne({ email });

  if (userExists) {
   return res.status(400).json({ message: 'User already exists' });
  }

  const user = await User.create({
   name,
   email,
   password,

   skills,
  });

  if (user) {
   res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,

    token: generateToken(user._id),
   });
  } else {
   res.status(400).json({ message: 'Invalid user data' });
  }
 } catch (error) {
  res.status(500).json({ message: error.message });
 }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
 const { email, password } = req.body;

 try {
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
   res.json({
    _id: user._id,
    name: user.name,
    email: user.email,

    token: generateToken(user._id),
   });
  } else {
   res.status(401).json({ message: 'Invalid email or password' });
  }
 } catch (error) {
  res.status(500).json({ message: error.message });
 }
};

const updateUserProfile = async (req, res) => {
 const user = await User.findById(req.user._id);

 if (user) {
  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;
  if (req.body.password) {
   user.password = req.body.password;
  }
  if (req.body.skills) {
   user.skills = Array.isArray(req.body.skills) ? req.body.skills : req.body.skills.split(',').map(s => s.trim());
  }

  const updatedUser = await user.save();

  res.json({
   _id: updatedUser._id,
   name: updatedUser.name,
   email: updatedUser.email,
   skills: updatedUser.skills,
   token: generateToken(updatedUser._id),
  });
 } else {
  res.status(404).json({ message: 'User not found' });
 }
};

module.exports = { registerUser, loginUser, updateUserProfile };

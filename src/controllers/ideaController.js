const Idea = require('../models/Idea');

// @desc    Create a new idea
// @route   POST /api/ideas
// @access  Private
const createIdea = async (req, res) => {
 const { title, description, category, requiredSkills, contactEmail } = req.body;
 let image = '';

 if (req.file) {
  // Construct URL for the uploaded file
  // Assumes server runs on localhost:5000 and has specific static folder setup
  image = `http://localhost:5000/uploads/${req.file.filename}`;
 } else if (req.body.image) {
  // Fallback if they sent a URL string instead of file (legacy support)
  image = req.body.image;
 }

 try {
  const idea = new Idea({
   title,
   description,
   category,
   requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : requiredSkills.split(',').map(s => s.trim()), // Handle multipart/form-data parsing quirks
   contactEmail: contactEmail || req.user.email,
   image,
   ownerId: req.user._id,
   ownerEmail: req.user.email,
  });

  const createdIdea = await idea.save();

  // Increment user's ideas created count
  await require('../models/User').findByIdAndUpdate(req.user._id, {
   $inc: { ideasCreatedCount: 1 }
  });

  res.status(201).json(createdIdea);
 } catch (error) {
  res.status(500).json({ message: error.message });
 }
};

// @desc    Get all ideas
// @route   GET /api/ideas
// @access  Private
const getIdeas = async (req, res) => {
 try {
  const ideas = await Idea.find({}).populate('ownerId', 'name email').populate('contributors', 'name');
  res.json(ideas);
 } catch (error) {
  res.status(500).json({ message: error.message });
 }
};

const JoinRequest = require('../models/JoinRequest');

// @desc    Get idea by ID
// @route   GET /api/ideas/:id
// @access  Private
const getIdeaById = async (req, res) => {
 try {
  const idea = await Idea.findById(req.params.id).populate('ownerId', 'name email').populate('contributors', 'name email');

  if (idea) {
   let ideaData = idea.toObject();

   // Check if the current user has sent a join request
   if (req.user) {
    const request = await JoinRequest.findOne({
     ideaId: idea._id,
     requesterId: req.user._id
    });

    if (request) {
     ideaData.myRequestStatus = request.status;
    }
   }

   res.json(ideaData);
  } else {
   res.status(404).json({ message: 'Idea not found' });
  }
 } catch (error) {
  res.status(500).json({ message: error.message });
 }
};

// @desc    Mark idea as completed
// @route   PUT /api/ideas/:id/complete
// @access  Private (Owner only)
const markAsCompleted = async (req, res) => {
 try {
  const idea = await Idea.findById(req.params.id);

  if (!idea) {
   return res.status(404).json({ message: 'Idea not found' });
  }

  // Check if user is the owner
  if (idea.ownerId.toString() !== req.user._id.toString()) {
   return res.status(403).json({ message: 'Not authorized to complete this idea' });
  }

  // Check if idea is in progress
  if (idea.status !== 'In Progress') {
   return res.status(400).json({ message: 'Only ideas in progress can be marked as completed' });
  }

  idea.status = 'Completed';
  idea.completedAt = new Date();
  await idea.save();

  // Notify contributors
  const Notification = require('../models/Notification');
  const notifications = idea.contributors.map(contributorId => ({
   userId: contributorId,
   message: `Mission Accomplished! The project "${idea.title}" has been marked as completed. Your contribution is locked in the archives.`,
  }));

  if (notifications.length > 0) {
   await Notification.insertMany(notifications);
  }

  res.json({ message: 'Idea marked as completed', idea });
 } catch (error) {
  res.status(500).json({ message: error.message });
 }
};

// @desc    Get leaderboard
// @route   GET /api/ideas/leaderboard
// @access  Private
const getLeaderboard = async (req, res) => {
 try {
  const User = require('../models/User');
  const users = await User.find({})
   .select('name email ideasCreatedCount ideasJoinedCount')
   .sort({ ideasCreatedCount: -1, ideasJoinedCount: -1 });

  // Calculate engagement score and sort
  const leaderboard = users.map(user => ({
   _id: user._id,
   name: user.name,
   email: user.email,
   ideasCreated: user.ideasCreatedCount,
   ideasJoined: user.ideasJoinedCount,
   engagementScore: user.ideasCreatedCount + user.ideasJoinedCount,
  })).sort((a, b) => b.engagementScore - a.engagementScore);

  res.json(leaderboard);
 } catch (error) {
  res.status(500).json({ message: error.message });
 }
};

// @desc    Delete idea
// @route   DELETE /api/ideas/:id
// @access  Private (Owner only)
const deleteIdea = async (req, res) => {
 try {
  const idea = await Idea.findById(req.params.id);

  if (!idea) {
   return res.status(404).json({ message: 'Idea not found' });
  }

  // Check if user is the owner
  if (idea.ownerId.toString() !== req.user._id.toString()) {
   return res.status(403).json({ message: 'Not authorized to delete this idea' });
  }

  await idea.deleteOne();

  // Decrement user's ideas created count
  await require('../models/User').findByIdAndUpdate(req.user._id, {
   $inc: { ideasCreatedCount: -1 }
  });

  res.json({ message: 'Idea removed' });
 } catch (error) {
  res.status(500).json({ message: error.message });
 }
};

module.exports = { createIdea, getIdeas, getIdeaById, markAsCompleted, getLeaderboard, deleteIdea };

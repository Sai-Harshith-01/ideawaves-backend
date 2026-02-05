const JoinRequest = require('../models/JoinRequest');
const Idea = require('../models/Idea');
const Notification = require('../models/Notification');
const Chat = require('../models/Chat');

// @desc    Send a join request
// @route   POST /api/requests/send
// @access  Private
const sendJoinRequest = async (req, res) => {
 const { ideaId } = req.body;

 try {
  const idea = await Idea.findById(ideaId);

  if (!idea) {
   return res.status(404).json({ message: 'Idea not found' });
  }

  // Check if user is the owner
  if (idea.ownerId.toString() === req.user._id.toString()) {
   return res.status(400).json({ message: 'You cannot request to join your own idea' });
  }

  // Check for duplicate request
  const existingRequest = await JoinRequest.findOne({
   ideaId,
   requesterId: req.user._id,
  });

  if (existingRequest) {
   return res.status(400).json({ message: 'Join request already sent' });
  }

  const request = new JoinRequest({
   ideaId,
   requesterId: req.user._id,
   ownerId: idea.ownerId,
  });

  const createdRequest = await request.save();

  // Create notification for owner
  await Notification.create({
   userId: idea.ownerId,
   message: `${req.user.name} has requested to join your idea: "${idea.title}"`
  });

  res.status(201).json(createdRequest);
 } catch (error) {
  res.status(500).json({ message: error.message });
 }
};

// @desc    Get join requests for an owner
// @route   GET /api/requests/received
// @access  Private
const getReceivedRequests = async (req, res) => {
 try {
  const requests = await JoinRequest.find({ ownerId: req.user._id })
   .populate('ideaId', 'title')
   .populate('requesterId', 'name email skills');
  res.json(requests);
 } catch (error) {
  res.status(500).json({ message: error.message });
 }
};

// @desc    Approve a join request
// @route   POST /api/requests/approve
// @access  Private
const approveRequest = async (req, res) => {
 const { requestId } = req.body;

 try {
  const request = await JoinRequest.findById(requestId).populate('ideaId', 'title');

  if (!request) {
   return res.status(404).json({ message: 'Request not found' });
  }

  if (request.ownerId.toString() !== req.user._id.toString()) {
   return res.status(403).json({ message: 'Not authorized to approve this request' });
  }

  request.status = 'Approved';
  await request.save();

  // Update idea: change status to In Progress and add contributor
  const idea = await Idea.findById(request.ideaId._id);
  if (idea) {
   idea.status = 'In Progress';
   if (!idea.contributors.includes(request.requesterId)) {
    idea.contributors.push(request.requesterId);
   }
   await idea.save();
  }

  // Update requester's ideasJoinedCount
  const User = require('../models/User');
  const student = await User.findByIdAndUpdate(request.requesterId, {
   $inc: { ideasJoinedCount: 1 }
  });

  // Create notification for requester
  await Notification.create({
   userId: request.requesterId,
   message: `Your request to join "${request.ideaId.title}" has been approved!`,
  });

  // Group Chat Management
  let chat = await Chat.findOne({ ideaId: request.ideaId._id });

  if (!chat) {
   // Create group chat if it doesn't exist, including owner and first contributor
   chat = await Chat.create({
    ideaId: request.ideaId._id,
    participants: [request.ownerId, request.requesterId],
    messages: [
     {
      senderId: request.ownerId,
      senderName: 'System',
      text: `${student.name} has joined the idea!`,
      isSystemMessage: true,
     }
    ],
   });
  } else {
   // Add to existing group chat participants
   if (!chat.participants.includes(request.requesterId)) {
    chat.participants.push(request.requesterId);
    chat.messages.push({
     senderId: request.ownerId,
     senderName: 'System',
     text: `${student.name} has joined the idea!`,
     isSystemMessage: true,
    });
    await chat.save();
   }
  }

  res.json({ message: 'Request approved, notification sent, and chat access granted' });
 } catch (error) {
  res.status(500).json({ message: error.message });
 }
};

// @desc    Reject a join request
// @route   POST /api/requests/reject
// @access  Private
const rejectRequest = async (req, res) => {
 const { requestId } = req.body;

 try {
  const request = await JoinRequest.findById(requestId).populate('ideaId', 'title');

  if (!request) {
   return res.status(404).json({ message: 'Request not found' });
  }

  if (request.ownerId.toString() !== req.user._id.toString()) {
   return res.status(403).json({ message: 'Not authorized to reject this request' });
  }

  request.status = 'Rejected';
  await request.save();

  // Create notification for requester
  await Notification.create({
   userId: request.requesterId,
   message: `Your request to join "${request.ideaId.title}" has been rejected.`,
  });

  res.json({ message: 'Request rejected' });
 } catch (error) {
  res.status(500).json({ message: error.message });
 }
};

const getSentRequests = async (req, res) => {
 try {
  const requests = await JoinRequest.find({ requesterId: req.user._id })
   .populate('ideaId')
   .populate('ownerId', 'name email');
  res.json(requests);
 } catch (error) {
  res.status(500).json({ message: error.message });
 }
};

module.exports = { sendJoinRequest, getReceivedRequests, getSentRequests, approveRequest, rejectRequest };

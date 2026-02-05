const Chat = require('../models/Chat');
const Idea = require('../models/Idea');

// @desc    Get chat for an idea (Group Chat)
// @route   GET /api/chat/:ideaId
// @access  Private
const getChat = async (req, res) => {
 const { ideaId } = req.params;

 try {
  const chat = await Chat.findOne({ ideaId }).populate('participants', 'name email');

  if (chat) {
   // Verify the logged-in user is a participant
   if (!chat.participants.some(p => p._id.toString() === req.user._id.toString())) {
    return res.status(403).json({ message: 'Access denied: You are not part of this idea team' });
   }

   // Attach idea status to check for read-only mode in frontend
   const idea = await Idea.findById(ideaId).select('title status');
   const chatData = chat.toObject();
   chatData.idea = idea;

   res.json(chatData);
  } else {
   res.status(404).json({ message: 'Chat will be enabled once your request is approved.' });
  }
 } catch (error) {
  res.status(500).json({ message: error.message });
 }
};

// @desc    Send a message in group chat
// @route   POST /api/chat/send
// @access  Private
const sendMessage = async (req, res) => {
 const { ideaId, text } = req.body;

 try {
  const chat = await Chat.findOne({ ideaId });

  if (!chat) {
   return res.status(404).json({ message: 'Chat not found' });
  }

  // Verify access
  if (!chat.participants.includes(req.user._id)) {
   return res.status(403).json({ message: 'Access denied: You are not an approved contributor' });
  }

  // Check if idea is completed
  const idea = await Idea.findById(ideaId);
  if (!idea) {
   return res.status(404).json({ message: 'Idea not found' });
  }

  if (idea.status === 'Completed') {
   return res.status(400).json({ message: 'Chat is read-only for completed ideas' });
  }

  const newMessage = {
   senderId: req.user._id,
   senderName: req.user.name,
   text,
   timestamp: new Date(),
  };

  chat.messages.push(newMessage);
  await chat.save();

  res.status(201).json(newMessage);
 } catch (error) {
  res.status(500).json({ message: error.message });
 }
};

module.exports = { getChat, sendMessage };

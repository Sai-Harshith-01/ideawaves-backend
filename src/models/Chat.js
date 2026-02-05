const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
 ideaId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Idea',
  required: true,
  unique: true, // One group chat per idea
 },
 participants: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
 }],
 messages: [
  {
   senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
   },
   senderName: String,
   text: {
    type: String,
    required: true,
   },
   isSystemMessage: {
    type: Boolean,
    default: false,
   },
   timestamp: {
    type: Date,
    default: Date.now,
   },
  },
 ],
});

const Chat = mongoose.model('Chat', chatSchema);
module.exports = Chat;

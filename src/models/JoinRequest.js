const mongoose = require('mongoose');

const joinRequestSchema = new mongoose.Schema({
 ideaId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Idea',
  required: true,
 },
 requesterId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: true,
 },
 ownerId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: true,
 },
 status: {
  type: String,
  enum: ['Pending', 'Approved', 'Rejected'],
  default: 'Pending',
 },
 createdAt: {
  type: Date,
  default: Date.now,
 },
});

const JoinRequest = mongoose.model('JoinRequest', joinRequestSchema);
module.exports = JoinRequest;

const mongoose = require('mongoose');

const ideaSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  image: {
    type: String, // URL of the image
    required: false,
  },
  requiredSkills: [String],
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  ownerEmail: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Requested', 'In Progress', 'Completed'],
    default: 'Requested',
  },
  contributors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  completedAt: {
    type: Date,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Idea = mongoose.model('Idea', ideaSchema);
module.exports = Idea;

const mongoose = require('mongoose');

const endpointSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,//removes whitespace from both ends of the string
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }//adds createdAt and updatedAt
);

module.exports = mongoose.model('Endpoint', endpointSchema);
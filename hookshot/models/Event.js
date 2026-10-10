const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    data: {
      type: Object,
      default: {},
    },
    idempotencyKey: {
      type: String,
      required: true,
    },
    endpointIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Endpoint',
      },
    ],
  },
  { timestamps: true }
);

eventSchema.index(
  { userId: 1, idempotencyKey: 1 },
  { unique: true }
);

module.exports = mongoose.model('Event', eventSchema);
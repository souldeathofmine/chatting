import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    isGlobal: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: '',
    },
    lastMessage: {
      type: String,
      default: '',
    },
    lastMessageTime: {
      type: Date,
      default: null,
    },
    lastSender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

chatSchema.index({ participants: 1 });

export default mongoose.model('Chat', chatSchema);

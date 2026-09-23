import mongoose, {
  Document,
  Schema,
} from "mongoose";

export interface IMessage extends Document {
  conversation: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  text: string;
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema =
  new Schema<IMessage>(
    {
      conversation: {
        type: Schema.Types.ObjectId,
        ref: "Conversation",
        required: true,
      },

      sender: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      text: {
        type: String,
        required: [true, "Message text is required"],
        trim: true,
        maxlength: [
          2000,
          "Message cannot exceed 2000 characters",
        ],
      },

      readBy: [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },
    {
      timestamps: true,
    }
  );

messageSchema.index({
  conversation: 1,
  createdAt: 1,
});

const Message =
  mongoose.model<IMessage>(
    "Message",
    messageSchema
  );

export default Message;
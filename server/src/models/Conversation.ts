import mongoose, {
  Document,
  Schema,
} from "mongoose";

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  product?: mongoose.Types.ObjectId;
  lastMessage?: string;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema =
  new Schema<IConversation>(
    {
      participants: [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
      ],

      product: {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },

      lastMessage: {
        type: String,
        default: "",
        maxlength: 2000,
      },

      lastMessageAt: {
        type: Date,
      },
    },
    {
      timestamps: true,
    }
  );

conversationSchema.index({
  participants: 1,
});

conversationSchema.index({
  lastMessageAt: -1,
});

const Conversation =
  mongoose.model<IConversation>(
    "Conversation",
    conversationSchema
  );

export default Conversation;
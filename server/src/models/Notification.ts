import mongoose, { Document, Schema } from "mongoose";

export type NotificationType =
  | "price_drop"
  | "listing_sold"
  | "review"
  | "message"
  | "system";

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  product?: mongoose.Types.ObjectId;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "price_drop",
        "listing_sold",
        "review",
        "message",
        "system",
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
    },

    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({
  user: 1,
  createdAt: -1,
});

notificationSchema.index({
  user: 1,
  read: 1,
});

const Notification = mongoose.model<INotification>(
  "Notification",
  notificationSchema
);

export default Notification;
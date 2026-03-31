import mongoose, { mongo } from "mongoose";

const ChatSchema = mongoose.Schema({
  threadId: {
    type: String,
    require: true,
  },
});

const UserSchema = mongoose.Schema({
  userName: {
    type: String,
  },
  email: {
    type: String,
    require: true,
  },
  password: {
    type: String,
    require: true,
  },
  chats: [ChatSchema],
  refreshTokens: [String],
});

const User = mongoose.model("User", UserSchema);

export default User;
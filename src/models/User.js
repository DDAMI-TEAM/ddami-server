import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, trim: true, unique: true },
  userPassword: { type: String, required: true },
  salt: { type: String, required: true },
  userName: { type: String },
  userPhone: { type: String },
  follow: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  follower: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  followerCount: { type: Number, default: 0 },
  state: { type: Boolean, default: false },
  myPieces: [{ type: mongoose.Schema.Types.ObjectId, ref: "Piece" }],
  like: [{ type: mongoose.Schema.Types.ObjectId, ref: "Piece" }],
  likeProduct: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  likeMaterial: [{ type: mongoose.Schema.Types.ObjectId, ref: "Material" }],
  socialId: {type: String, enum: ["kakao", "google", "naver"]},
  socialType: String,
  imageUrl: {
    type: String,
    default: "https://ddami.s3.ap-northeast-2.amazonaws.com/default.jpg",
  },
  created: {
    type: Date,
    default: Date.now,
  },
  deviceToken: { type: String },
  id: mongoose.Schema.Types.ObjectId,
});

const model = mongoose.model("User", UserSchema);

export default model;

//  created: {
// type: String,
// default: moment().format("YYYY년 MM월 DD일 HH:mm:ss")
//}

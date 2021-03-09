import mongoose from "mongoose";

const StudentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  university: { type: String },
  department: { type: String },
  likeField: [{ type: String }],
  number: { type: Number },
  authImage: { type: String },
  stateMessage: {
    type: String,
    default: `안녕하세요 만나서 반가워요`,
  },
  id: mongoose.Schema.Types.ObjectId,
});

const model = mongoose.model("Student", StudentSchema);

export default model;

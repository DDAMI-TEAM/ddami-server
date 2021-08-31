import mongoose from "mongoose";

const dbConfig = require('./config/db')

mongoose.connect(dbConfig.mongo_url, {
  useNewUrlParser: true,
  useFindAndModify: false,
});

const db = mongoose.connection;
const handleOpen = () => console.log("Connected to DB");
const handleError = (error) => console.log(`Error on DB Connection: ${error}`);
db.once("open", handleOpen);
db.on("error", handleError);
export default db;
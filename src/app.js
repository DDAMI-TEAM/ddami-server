import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import dotenv from "dotenv";
import router from './routers';
import { jwtMiddleware } from "./jwtMiddleware";
import cors from "cors";
import path from "path";

dotenv.config();

const app = express();

app.use(helmet());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Methods", "POST, GET");
  next();
});
app.use(cors());
app.use("/uploads", express.static("./uploads/images/"));

app.set("/", path.join(__dirname, "/"));

app.use(morgan("dev"));
app.set("jwt-secret", process.env.SECRET);

app.use(jwtMiddleware);
app.use('/', router);



export default app;

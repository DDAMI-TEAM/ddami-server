import multer from "multer";
import multerS3 from "multer-s3";
import aws from "aws-sdk";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// aws.config.loadFromPath(__dirname + '/../config/s3.json');

const s3 = new aws.S3();
export const multerImage = multer({
  storage: multerS3({
    s3,
    bucket: 'ddami',
    acl: 'public-read',
    key: function (req, file, cb) {
      cb(null, 'uploads/stuAuth/' + Date.now() + '.' + file.originalname.split('.').pop());
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

import multer from 'multer';
import multerS3 from 'multer-s3';
import aws from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

aws.config.loadFromPath(__dirname + '/../config/s3.json');

const s3 = new aws.S3();
export const s3Module = {
  upload: (destPath) =>
    multer({
      storage: multerS3({
        s3,
        bucket: 'ddami',
        acl: 'public-read',
        key: function (req, file, cb) {
          cb(null, 'uploads/' + destPath + Date.now() + '.' + file.originalname.split('.').pop());
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  deleteObject: (key) => {
    return new Promise((resolve, reject) => {
      s3.deleteObject(
        {
          Bucket: 'ddami',
          Key: key,
        },
        (error, data) => {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        },
      );
    });
  },
  deleteObjects: (destPaths) => {
    return new Promise((resolve, reject) => {
      s3.deleteObjects(
        {
          Bucket: 'ddami',
          Delete: {
            Object: destPaths.map((e) => {
              return { Key: e };
            }),
          },
        },
        (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        },
      );
    });
  },
};

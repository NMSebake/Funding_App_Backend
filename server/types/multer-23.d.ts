declare module "multer-s3" {
  import { StorageEngine } from "multer";
  interface Options {
    s3: any;
    bucket: string;
    acl?: string;
    key?: (req: any, file: Express.Multer.File, cb: (error: any, key: string) => void) => void;
  }
  function multerS3(options: Options): StorageEngine;
  export = multerS3;
}

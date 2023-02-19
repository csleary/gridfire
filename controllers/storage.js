import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsCommand,
  S3Client
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

const { S3_ENDPOINT } = process.env;
const client = new S3Client({ endpoint: S3_ENDPOINT, region: "us-east-1" });

const streamFromBucket = async (bucketName, objectKey) => {
  const getObjectCommand = new GetObjectCommand({ Bucket: bucketName, Key: objectKey });
  const { Body } = await client.send(getObjectCommand);
  return Body;
};

const streamToBucket = (bucketName, objectKey, readableStream) => {
  const params = { Bucket: bucketName, Key: objectKey, Body: readableStream };
  const upload = new Upload({ client, params });
  return upload.done();
};

const deleteObject = (bucketName, objectKey) => {
  const deleteObjectCommand = new DeleteObjectCommand({ Bucket: bucketName, Key: objectKey });
  return client.send(deleteObjectCommand);
};

const listObjects = async (bucketName, objectPrefix) => {
  const listObjectsCommand = new ListObjectsCommand({ Bucket: bucketName, Prefix: objectPrefix });
  const { Contents } = await client.send(listObjectsCommand);
  return Contents;
};

const deleteObjects = async (bucketName, objectPrefix) => {
  const Objects = await listObjects(bucketName, objectPrefix);
  const deleteObjectsCommand = new DeleteObjectsCommand({ Bucket: bucketName, Delete: { Objects } });
  return client.send(deleteObjectsCommand);
};

export { deleteObject, deleteObjects, listObjects, streamFromBucket, streamToBucket };

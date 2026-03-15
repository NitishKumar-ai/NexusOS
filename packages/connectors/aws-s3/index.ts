import type { MCPConnector, ConnectorConfig, ConnectorResult } from '../types';
import { randomUUID } from 'crypto';

export class AWSS3Connector implements MCPConnector {
  name = 'aws-s3';
  version = '1.0.0';
  private accessKeyId = '';
  private secretAccessKey = '';
  private region = 'us-east-1';

  async connect(config: ConnectorConfig) {
    this.accessKeyId = config.accessKeyId ?? '';
    this.secretAccessKey = config.secretAccessKey ?? '';
    this.region = config.region ?? 'us-east-1';
  }

  async execute(action: string, params: Record<string, unknown>): Promise<ConnectorResult> {
    try {
      const { S3Client, PutObjectCommand, GetObjectCommand,
              ListObjectsV2Command, DeleteObjectCommand } = await import('@aws-sdk/client-s3');

      const client = new S3Client({
        region: this.region,
        credentials: { accessKeyId: this.accessKeyId, secretAccessKey: this.secretAccessKey },
      });

      let data: unknown;
      switch (action) {
        case 'object.upload':
          await client.send(new PutObjectCommand({
            Bucket: params.bucket as string,
            Key: params.key as string,
            Body: params.body as string,
            ContentType: params.contentType as string || 'text/plain',
          }));
          data = { uploaded: true, bucket: params.bucket, key: params.key };
          break;

        case 'object.get':
          const res = await client.send(new GetObjectCommand({
            Bucket: params.bucket as string,
            Key: params.key as string,
          }));
          data = { key: params.key, contentType: res.ContentType, size: res.ContentLength };
          break;

        case 'bucket.list':
          const list = await client.send(new ListObjectsV2Command({
            Bucket: params.bucket as string,
            Prefix: params.prefix as string || '',
            MaxKeys: params.limit as number || 20,
          }));
          data = list.Contents?.map(o => ({ key: o.Key, size: o.Size, lastModified: o.LastModified }));
          break;

        case 'object.delete':
          await client.send(new DeleteObjectCommand({
            Bucket: params.bucket as string,
            Key: params.key as string,
          }));
          data = { deleted: true };
          break;

        default:
          return { success: false, error: `Unknown: ${action}`, action_id: randomUUID(), timestamp: new Date().toISOString() };
      }
      return { success: true, data, action_id: randomUUID(), timestamp: new Date().toISOString() };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'AWS S3 error', action_id: randomUUID(), timestamp: new Date().toISOString() };
    }
  }

  async disconnect() {}
}

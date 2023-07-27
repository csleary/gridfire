enum ErrorCodes {
  REPLY_SUCCESS = 200,
  CONNECTION_FORCED = 320
}

interface MessageTuple extends Array<string | Buffer> {
  0: string;
  1: string;
  2: Buffer;
}

interface ReleaseContext extends TrackContext {
  releaseId: string;
  trackName?: string;
}

interface TrackContext {
  trackId: string;
  userId: string;
}

export { ErrorCodes, MessageTuple, ReleaseContext, TrackContext };

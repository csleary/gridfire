import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';

const useApi = (initialUrl, initialMethod = 'get', initialData) => {
  const [isLoading, setLoading] = useState(true);
  const [isFetching, setFetching] = useState(false);
  const [error, setError] = useState();
  const [resData, setResData] = useState();
  const [isCancelled, setCancelled] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const call = useRef();
  call.current = axios.CancelToken.source();

  const percentComplete = (loaded, total) => {
    return Math.floor((loaded / total) * 100);
  };

  const fetch = useCallback(
    async (url = initialUrl, method = initialMethod, data = initialData) => {
      setFetching(true);
      if (!url) {
        setLoading(true);
      }

      try {
        const res = await axios({
          method,
          url,
          data,
          cancelToken: call.current.token,
          onUploadProgress: e =>
            setUploadProgress(percentComplete(e.loaded / e.total)),
          onDownloadProgress: e =>
            setDownloadProgress(percentComplete(e.loaded / e.total))
        });

        setResData(res.data);
        setError(undefined);
      } catch (e) {
        if (axios.isCancel(e)) {
          setCancelled(true);
        } else {
          setCancelled(false);
          setError(e.response.data.error);
        }
      } finally {
        setFetching(false);
        setLoading(false);
      }
    },
    [initialUrl, initialMethod, initialData]
  );

  useEffect(() => {
    fetch();
    return () => call.current.cancel();
  }, [fetch]);

  return {
    fetch,
    cancel: call.current.cancel,
    data: resData,
    error,
    isCancelled,
    isFetching,
    isLoading,
    uploadProgress,
    downloadProgress
  };
};

export { useApi };

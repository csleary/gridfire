import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";

const percentComplete = (loaded, total) => Math.floor((loaded / total) * 100);

const useApi = (initUrl, options = {}) => {
  const { method: initMethod = "get", data: initData, shouldFetch = true } = options;
  const [isLoading, setLoading] = useState(true);
  const [isFetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [resData, setResData] = useState();
  const [isCancelled, setCancelled] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const call = useRef();
  const isMounted = useRef(true);

  const handleCancel = () => {
    if (call.current) {
      call.current.cancel();
    }
  };

  const fetch = useCallback(
    async (url = initUrl, method = initMethod, data = initData) => {
      if (!url) {
        return void setLoading(false);
      }

      handleCancel();

      try {
        call.current = axios.CancelToken.source();
        setFetching(true);

        const res = await axios({
          method,
          url,
          data,
          cancelToken: call.current.token,
          onUploadProgress: e => setUploadProgress(percentComplete(e.loaded / e.total)),
          onDownloadProgress: e => setDownloadProgress(percentComplete(e.loaded / e.total))
        });

        setResData(res.data);
        setError("");
      } catch (requestError) {
        if (axios.isCancel(requestError)) {
          if (isMounted.current) setCancelled(true);
        } else {
          setCancelled(false);
          setError(requestError.response.data.error || requestError.message || requestError);
        }
      } finally {
        setFetching(false);
        setLoading(false);
        call.current = null;
      }
    },
    [initData, initMethod, initUrl]
  );

  useEffect(() => {
    if (shouldFetch) {
      fetch();
    }

    return () => {
      if (call.current) call.current.cancel();
      isMounted.current = false;
    };
  }, [fetch, shouldFetch]);

  return {
    fetch,
    cancel: handleCancel,
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

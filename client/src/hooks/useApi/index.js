import { useEffect, useCallback, useRef, useState } from "react";
import axios from "axios";
import settings from "sdx.client.settings.json";

// Hook for API requests, either on initial render using initial values, or via event handlers using the returned 'fetch' function.
// Note: Calling the 'fetch' function on render will lead to a render cascade.
// e.g. usage:
// const { data, fetch, isLoading } = useApi("/api/my/bots");
// fetch("/api/upload", "post", { form: data })

const useApi = (initialUrl, initialMethod = "get", initialData) => {
  const [isLoading, setLoading] = useState(false);
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
    async (url, method, data) => {
      setLoading(true);
      if (url) setResData(undefined);

      try {
        const res = await axios({
          method: method || initialMethod,
          url: `${settings.api}${url || initialUrl}`,
          data: data || initialData,
          cancelToken: call.current.token,
          onUploadProgress: e =>
            setUploadProgress(percentComplete(e.loaded / e.total)),
          onDownloadProgress: e =>
            setDownloadProgress(percentComplete(e.loaded / e.total))
        });

        setResData(res.data);
        setError(undefined);
      } catch (error) {
        if (axios.isCancel(error)) {
          setCancelled(true);
        } else {
          setCancelled(false);
          setError(error);
        }
      } finally {
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
    isLoading,
    uploadProgress,
    downloadProgress
  };
};

export { useApi };

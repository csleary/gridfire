import { checkFormatMp3, fetchDownloadToken } from 'utils';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { toastError, toastInfo } from 'features/toast';
import { useEffect, useRef, useState } from 'react';
import { setFormatExists } from 'features/releases';

const useDownload = ({ artistName, format, releaseId, releaseTitle }) => {
  const dispatch = useDispatch();
  const anchorRef = useRef();
  const formatExists = useSelector(state => state.releases.formatExists[releaseId]?.[format], shallowEqual);
  const [downloadUrl, setDownloadUrl] = useState();
  const [isPreparingDownload, setIsPreparingDownload] = useState(false);

  useEffect(() => {
    if (formatExists && isPreparingDownload) {
      fetchDownloadToken(releaseId).then(downloadToken => {
        setDownloadUrl(`/api/download/${downloadToken}/${format}`);
        anchorRef.current.click();
        setIsPreparingDownload(false);
      });
    }
  }, [format, formatExists, isPreparingDownload, releaseId]);

  const handleDownload = async () => {
    try {
      const downloadToken = await fetchDownloadToken(releaseId);
      if (!downloadToken) return;
      dispatch(toastInfo(`Fetching download: ${artistName} - '${releaseTitle}' (${format.toUpperCase()})`));

      switch (format) {
        case 'mp3': {
          const res = await checkFormatMp3(downloadToken);

          if (!res.data.exists) {
            dispatch(setFormatExists({ releaseId, format, exists: false }));
            dispatch(toastInfo(`Preparing download: ${artistName} - '${releaseTitle}' (${format.toUpperCase()})`));
            setIsPreparingDownload(true);
            break;
          }

          setDownloadUrl(`/api/download/${downloadToken}`);
          anchorRef.current.click();
          break;
        }

        case 'flac': {
          setDownloadUrl(`/api/download/${downloadToken}/flac`);
          anchorRef.current.click();
          break;
        }
        default:
          break;
      }
    } catch (error) {
      if (error.response.data.error) {
        return void dispatch(toastError(error.response.data.error));
      }

      setIsPreparingDownload(false);
      return void dispatch(toastError(error.message || error.toString()));
    }
  };

  return { anchorRef, downloadUrl, formatExists, handleDownload, isPreparingDownload, releaseTitle };
};

export { useDownload };

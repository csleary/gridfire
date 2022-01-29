import { checkFormatMp3, fetchDownloadToken } from "utils";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { toastError, toastInfo } from "features/toast";
import { useEffect, useRef, useState } from "react";
import { setFormatExists } from "features/releases";

const useDownload = ({ artistName, releaseId, releaseTitle }) => {
  const dispatch = useDispatch();
  const anchorRef = useRef();
  const [currentFormat, setCurrentFormat] = useState("mp3");
  const [downloadUrl, setDownloadUrl] = useState();
  const [isPreparingDownload, setIsPreparingDownload] = useState(false);
  const formatExists = useSelector(state => state.releases.formatExists[releaseId]?.[currentFormat], shallowEqual);

  useEffect(() => {
    if (formatExists && isPreparingDownload) {
      fetchDownloadToken(releaseId).then(downloadToken => {
        setDownloadUrl(`/api/download/${downloadToken}/${currentFormat}`);
        anchorRef.current.click();
        setIsPreparingDownload(false);
      });
    }
  }, [currentFormat, formatExists, isPreparingDownload, releaseId]);

  const handleDownload = async (format = "mp3") => {
    try {
      setCurrentFormat(format);
      const downloadToken = await fetchDownloadToken(releaseId);
      if (!downloadToken) return;
      dispatch(toastInfo({ message: `${artistName} - '${releaseTitle}'`, title: "Fetching download" }));

      switch (format) {
        case "mp3": {
          const res = await checkFormatMp3(downloadToken);

          if (!res.data.exists) {
            dispatch(setFormatExists({ releaseId, format, exists: false }));
            dispatch(toastInfo({ message: `${artistName} - '${releaseTitle}'`, title: "Preparing download" }));
            setIsPreparingDownload(true);
            break;
          }

          setDownloadUrl(`/api/download/${downloadToken}`);
          anchorRef.current.click();
          break;
        }

        case "flac": {
          setDownloadUrl(`/api/download/${downloadToken}/flac`);
          anchorRef.current.click();
          break;
        }
        default:
          break;
      }
    } catch (error) {
      console.log(error);
      if (error.response.data.error) {
        return void dispatch(toastError({ message: error.response.data.error, title: "Error" }));
      }

      setIsPreparingDownload(false);
      return void dispatch(toastError({ message: error.message || error.toString(), title: "Error" }));
    }
  };

  return { anchorRef, downloadUrl, formatExists, handleDownload, isPreparingDownload, releaseTitle };
};

export { useDownload };

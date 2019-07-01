import React, { Fragment } from 'react';
import FontAwesome from 'react-fontawesome';
import classNames from 'classnames';
import { useDropzone } from 'react-dropzone';
import ProgressBar from './ProgressBar';

const ArtworkDropzone = props => {
  const { artworkUploading, onDrop, percentComplete } = props;

  const {
    acceptedFiles,
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject
  } = useDropzone({
    accept: 'image/png, image/jpeg',
    disabled: artworkUploading,
    maxSize: 1024 * 1024 * 10,
    multiple: false,
    noDragEventsBubbling: true,
    noKeyboard: true,
    onDrop
  });

  const dropzoneClassNames = classNames('dropzone-art', {
    uploading: artworkUploading,
    active: isDragActive && !isDragReject,
    disabled: artworkUploading,
    rejected: isDragReject
  });

  const Status = () => {
    if (artworkUploading) {
      return (
        <Fragment>
          <FontAwesome name="upload" className="mr-2" />
          Uploading &lsquo;{acceptedFiles[0].path}&rsquo;: {percentComplete}%
        </Fragment>
      );
    }

    if (isDragReject) {
      return (
        <Fragment>
          <FontAwesome name="times-circle" className="mr-2" />
          Sorry, we don&lsquo;t accept that file type. Please ensure it is a png
          or jpg image file.
        </Fragment>
      );
    }

    if (isDragActive) {
      return (
        <Fragment>
          <FontAwesome name="thumbs-o-up" className="mr-2" />
          Drop to upload!
        </Fragment>
      );
    }

    return (
      <Fragment>
        <FontAwesome name="upload" className="mr-2" />
        Drop artwork here, or click to select. Must be under 10MB in size and
        have a minimum dimension of 1000px (will be resized and cropped square).
      </Fragment>
    );
  };

  const RenderStatus = ({ children }) => <p className="status">{children}</p>;

  return (
    <div
      {...getRootProps({
        className: dropzoneClassNames
      })}
    >
      <input {...getInputProps()} />
      <RenderStatus>
        <Status />
      </RenderStatus>
      <ProgressBar
        percentComplete={percentComplete}
        willDisplay={artworkUploading}
      />
    </div>
  );
};

export default ArtworkDropzone;

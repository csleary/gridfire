import classNames from 'classnames';
import React from 'react';
import Dropzone from 'react-dropzone';
import FontAwesome from 'react-fontawesome';
import ProgressBar from './ProgressBar';

const RenderArtwork = props => {
  const coverArtClasses = classNames('img-fluid', {
    lazyloaded: props.coverArtLoaded,
    lazyload: !props.coverArtLoaded
  });

  return (
    <div className="col-md">
      <h3 className="text-center">Artwork</h3>
      {props.coverArtPreview && (
        <div className="cover-art">
          <img
            alt=""
            className={coverArtClasses}
            onLoad={() => props.onArtworkLoad()}
            src={props.coverArtPreview}
          />
          <div className="d-flex flex-row justify-content-end cover-art-overlay">
            <div className="delete">
              <a
                role="button"
                tabIndex={-1}
                onClick={() => {
                  const { release } = props;
                  let prevPublished = '';

                  if (release.published) {
                    props.publishStatus(release._id, () => {
                      prevPublished =
                        ' As your release was previously published, it has also been taken offline.';
                    });
                  }
                  props.toastWarning('Deleting artwork…');

                  props.deleteArtwork(release._id).then(() => {
                    props.handleDeletePreview();
                    props.toastSuccess(`Artwork deleted.${prevPublished}`);
                  });
                }}
              >
                <FontAwesome name="trash" />
              </a>
            </div>
          </div>
        </div>
      )}
      <Dropzone
        accept=".png, .jpg, .jpeg"
        activeClassName="dropzone-art-active"
        className="dropzone-art"
        maxSize={1024 * 1024 * 10}
        multiple={false}
        onDrop={props.onDropArt}
      >
        <FontAwesome name="upload" className="mr-2" />
        {props.artworkUploading
          ? `Uploading: ${props.artworkUploadProgress}%`
          : 'Drop artwork here, or click to select. Must be under 10MB in size and have a minimum dimension of 1000px (will be resized and cropped square).'}
        <ProgressBar
          percentComplete={props.artworkUploadProgress}
          willDisplay={
            props.artworkUploadProgress && props.artworkUploadProgress < 100
          }
        />
      </Dropzone>
    </div>
  );
};
export default RenderArtwork;

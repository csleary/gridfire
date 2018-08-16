import classNames from 'classnames';
import React, { Fragment } from 'react';
import Dropzone from 'react-dropzone';
import FontAwesome from 'react-fontawesome';
import ProgressBar from './ProgressBar';

const RenderArtwork = props => {
  const { coverArtLoaded, coverArtPreview, release } = props;
  const { _id, releaseTitle } = release;
  const releaseId = _id;

  const isUploading =
    props.artworkUploadProgress && props.artworkUploadProgress < 100;

  const dropzoneClassNames = classNames('dropzone-art', {
    uploading: isUploading
  });

  const artworkClassNames = classNames('img-fluid', {
    lazyloaded: coverArtLoaded,
    lazyload: !coverArtLoaded
  });

  return (
    <Fragment>
      <h3 className="text-center">Artwork</h3>
      {coverArtPreview && (
        <div className="cover-art">
          <img
            alt={`The cover art for ${(releaseTitle && `'${releaseTitle}'`) ||
              'this release.'}`}
            className={artworkClassNames}
            onLoad={() => props.onArtworkLoad()}
            src={coverArtPreview}
          />
          <div className="d-flex flex-row justify-content-end cover-art-overlay">
            <div className="delete">
              <a
                role="button"
                tabIndex="-1"
                onClick={() => {
                  let prevPublished = '';

                  if (release.published) {
                    props.publishStatus(releaseId).then(() => {
                      prevPublished =
                        ' As your release was previously published, it has also been taken offline.';
                    });
                  }
                  props.toastWarning('Deleting artwork…');

                  props.deleteArtwork(releaseId, () => {
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
        className={dropzoneClassNames}
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
          willDisplay={isUploading}
        />
      </Dropzone>
    </Fragment>
  );
};
export default RenderArtwork;

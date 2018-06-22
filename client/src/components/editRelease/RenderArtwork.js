import React from 'react';
import Dropzone from 'react-dropzone';
import FontAwesome from 'react-fontawesome';
import ProgressBar from './ProgressBar';

const RenderArtwork = props => (
  <div className="col-md">
    <h3 className="text-center">Artwork</h3>
    {(props.coverArtPreview || props.release.artwork) && (
      <div className="cover-art">
        <img
          className="img-fluid"
          alt=""
          src={
            props.coverArtPreview
              ? props.coverArtPreview
              : props.release.artwork
          }
        />
        <div className="d-flex flex-row justify-content-end cover-art-overlay">
          <div className="delete">
            <a
              role="button"
              tabIndex={-1}
              onClick={() => {
                const { release } = props;
                if (release.published) {
                  props.publishStatus(release._id);
                }
                props.deleteArtwork(release._id).then(() => {
                  if (props.artworkFile) {
                    window.URL.revokeObjectURL(props.artworkFile.preview);
                  }
                  props.handleDeletePreview();
                  props.toastMessage({
                    alertClass: 'alert-success',
                    message:
                      'Artwork deleted. If your release was previously published, it has also been taken offline.'
                  });
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
      <FontAwesome name="upload" className="icon-left" />
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

export default RenderArtwork;

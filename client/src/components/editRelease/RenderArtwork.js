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
      maxSize={1024 * 1024 * 2}
      multiple={false}
      onDrop={props.onDropArt}
    >
      <FontAwesome name="upload" className="icon-left" />
      {props.uploadingArt && props.uploadingArt < 100
        ? `Uploading: ${props.uploadingArt}%`
        : 'Drop artwork here, or click to select. Must be square and under 2MB in size.'}
      <ProgressBar
        percentComplete={props.uploadingArt}
        willDisplay={props.uploadingArt && props.uploadingArt < 100}
      />
    </Dropzone>
  </div>
);

export default RenderArtwork;

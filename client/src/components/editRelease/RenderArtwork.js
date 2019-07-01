import classNames from 'classnames';
import React, { Fragment } from 'react';
import FontAwesome from 'react-fontawesome';
import ArtworkDropzone from './ArtworkDropzone';

const RenderArtwork = props => {
  const { coverArtLoaded, coverArtPreview, release } = props;
  const { _id, releaseTitle } = release;
  const releaseId = _id;

  const artworkClassNames = classNames('img-fluid', {
    lazyloaded: coverArtLoaded,
    lazyload: !coverArtLoaded
  });

  const handleDeleteArtwork = event => {
    event.preventDefault();
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
  };

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
              <button
                className="btn btn-link"
                onClick={handleDeleteArtwork}
                type="button"
              >
                <FontAwesome name="trash" />
              </button>
            </div>
          </div>
        </div>
      )}
      <ArtworkDropzone
        artworkUploading={props.artworkUploading}
        onDrop={props.onDropArt}
        percentComplete={props.artworkUploadProgress}
      />
    </Fragment>
  );
};
export default RenderArtwork;

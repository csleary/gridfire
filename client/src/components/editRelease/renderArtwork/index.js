import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { toastSuccess, toastWarning } from 'features/toast';
import ArtworkDropzone from './artworkDropzone';
import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import { deleteArtwork } from 'features/artwork';

const RenderArtwork = props => {
  const { coverArtLoaded, coverArtPreview, handleDeletePreview } = props;
  const { _id: releaseId, published, releaseTitle } = useSelector(state => state.releases.activeRelease, shallowEqual);
  const dispatch = useDispatch();

  const artworkClassNames = classNames('img-fluid', {
    lazyloaded: coverArtLoaded,
    lazyload: !coverArtLoaded
  });

  const handleDeleteArtwork = async event => {
    event.preventDefault();
    let prevPublished = '';
    if (published) prevPublished = ' As your release was previously published, it has also been taken offline.';
    dispatch(toastWarning('Deleting artwork…'));
    await dispatch(deleteArtwork(releaseId));
    handleDeletePreview();
    dispatch(toastSuccess(`Artwork deleted.${prevPublished}`));
  };

  return (
    <>
      <h3 className="text-center">Artwork</h3>
      {coverArtPreview && (
        <div className="cover-art">
          <img
            alt={`The cover art for ${(releaseTitle && `\u2018${releaseTitle}\u2019`) || 'this release.'}`}
            className={artworkClassNames}
            onLoad={() => props.onArtworkLoad()}
            src={coverArtPreview}
          />
          <div className="d-flex flex-row justify-content-end cover-art-overlay">
            <div className="delete">
              <button className="btn btn-link" onClick={handleDeleteArtwork} type="button">
                <FontAwesome name="trash" />
              </button>
            </div>
          </div>
        </div>
      )}
      <ArtworkDropzone onDrop={props.onDropArt} />
    </>
  );
};

RenderArtwork.propTypes = {
  coverArtLoaded: PropTypes.bool,
  coverArtPreview: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  handleDeletePreview: PropTypes.func,
  onArtworkLoad: PropTypes.func,
  onDropArt: PropTypes.func
};

export default RenderArtwork;

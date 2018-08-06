import React, { Component, Fragment } from 'react';
import { Link } from 'react-router-dom';
import FontAwesome from 'react-fontawesome';
import moment from 'moment';
import CLOUD_URL from '../../index';

class UserRelease extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isDeletingRelease: false,
      isPublishingRelease: false
    };
  }

  handleDeleteRelease = () => {
    const { deleteRelease, release, toastWarning, toastSuccess } = this.props;
    const { releaseTitle } = release;
    this.setState({ isDeletingRelease: true });

    this.pleaseConfirm(releaseTitle, () => {
      const releaseName =
        (releaseTitle && `'${releaseTitle}'`) || 'untitled release';

      toastWarning(`Deleting ${releaseName}…`);

      deleteRelease(release._id, () => {
        toastSuccess(`Successfully deleted ${releaseName}.`);
      });
    });
  };

  handlePublishStatus = () => {
    const { release, publishStatus, toastSuccess, toastWarning } = this.props;

    this.setState({ isPublishingRelease: true });
    publishStatus(release._id).then(success => {
      if (success) {
        release.published
          ? toastWarning(`'${release.releaseTitle}' has been taken offline.`)
          : toastSuccess(`'${release.releaseTitle}' is now live and on sale.`);
      }
      this.setState({ isPublishingRelease: false });
    });
  };

  pleaseConfirm = (title, callback) => {
    const confirmation = window.confirm(
      `Are you sure you want to delete ${(title && `'${title}'`) ||
        'this release'}?`
    );
    if (confirmation) callback();
    else this.setState({ isDeletingRelease: false });
  };

  renderTitle = ({ _id, artist, artistName, releaseTitle }) => {
    if (artistName) {
      return (
        <Fragment>
          <Link to={`/artist/${artist}`}>{artistName}</Link> &bull;{' '}
          <Link to={`/release/${_id}`}>
            <span className="ibm-type-italic">{releaseTitle}</span>
          </Link>
        </Fragment>
      );
    }
    return <Fragment>Untitled Release</Fragment>;
  };

  render() {
    const {
      history,
      release,
      release: {
        _id,
        artwork,
        price,
        published,
        releaseDate,
        releaseTitle,
        trackList
      }
    } = this.props;
    const releaseId = _id;

    const numSold = this.props.numSold ? (
      <h6>
        <FontAwesome
          name="line-chart"
          className="mr-2 red"
          title="Number of copies sold."
        />
        {this.props.numSold}
      </h6>
    ) : null;

    const statusIcon = published ? (
      <FontAwesome
        name="check-circle"
        className="cyan status-icon"
        title={`'${releaseTitle}' is live and available for purchase.`}
      />
    ) : (
      <FontAwesome
        name="exclamation-circle"
        className="yellow status-icon"
        title={`'${releaseTitle}' is currently offline.`}
      />
    );

    return (
      <li className="no-gutters d-flex flex-column release" key={releaseId}>
        {artwork ? (
          <div className="artwork">
            <Link to={`/release/${releaseId}`}>
              <img
                alt={artwork && `'${releaseTitle}' Artwork`}
                className="lazyload img-fluid"
                data-sizes="auto"
                data-src={artwork ? `${CLOUD_URL}/${releaseId}.jpg` : null}
                src="data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="
              />
            </Link>
          </div>
        ) : (
          <h6 className="m-3">
            <FontAwesome name="file-image-o" className="mr-2 red" />
            No artwork uploaded.
          </h6>
        )}
        <div className="status-icon-bg d-flex align-items-center justify-content-center">
          {statusIcon}
        </div>
        <div className="d-flex flex-column flex-grow-1 p-3">
          <div className="release-details mb-3">
            <h6>{this.renderTitle(release)}</h6>
            <h6>
              <FontAwesome name="tag" className="mr-2 red" />
              ${price} USD
            </h6>
            <h6>
              <FontAwesome name="calendar-o" className="mr-2 red" />
              {moment(new Date(releaseDate)).format('Do of MMM, YYYY')}
            </h6>
            <h6>
              <FontAwesome name="file-audio-o" className="mr-2 red" />
              {trackList.length} Tracks
            </h6>
            {numSold}
          </div>
          <div className="d-flex mt-auto">
            <button
              onClick={() => history.push(`/release/edit/${releaseId}`)}
              className="btn btn-outline-primary btn-sm flex-grow-1"
            >
              <FontAwesome name="pencil" className="mr-2" />
              Edit
            </button>
            <button
              disabled={this.state.isPublishingRelease}
              onClick={() => this.handlePublishStatus()}
              className="btn btn-outline-warning btn-sm flex-grow-1"
            >
              {release.published ? (
                <Fragment>
                  <FontAwesome name="eye-slash" className="mr-2" />
                  Unpublish
                </Fragment>
              ) : (
                <Fragment>
                  <FontAwesome name="eye" className="mr-2" />
                  Publish
                </Fragment>
              )}
            </button>
            <button
              className="btn btn-outline-danger btn-sm flex-grow-1"
              disabled={this.state.isDeletingRelease}
              onClick={() => this.handleDeleteRelease()}
            >
              <FontAwesome name="trash" className="mr-2" />
              Delete
            </button>
          </div>
        </div>
      </li>
    );
  }
}

export default UserRelease;

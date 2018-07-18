import React, { Component, Fragment } from 'react';
import { Link } from 'react-router-dom';
import FontAwesome from 'react-fontawesome';
import moment from 'moment';

class UserRelease extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isDeletingRelease: false,
      isPublishingRelease: false
    };
  }

  copiesSold = () => {
    const { salesData } = this.props;
    const releaseId = this.props.release._id;

    const releaseSales =
      salesData &&
      salesData.filter(release => release.releaseId === releaseId)[0];

    const salesArray =
      releaseSales && releaseSales.purchases.map(sale => sale.numSold);

    const numSold = salesArray && salesArray.reduce((acc, el) => acc + el);
    if (numSold) {
      return (
        <h6>
          <FontAwesome
            name="line-chart"
            className="icon-left red"
            title="Number of copies sold."
          />
          {numSold}
        </h6>
      );
    }
  };

  handleDeleteRelease = () => {
    const { deleteRelease, release, toastMessage } = this.props;
    const { releaseTitle } = release;
    this.setState({ isDeletingRelease: true });

    this.pleaseConfirm(releaseTitle, () => {
      const releaseName =
        (releaseTitle && `'${releaseTitle}'`) || 'untitled release';

      toastMessage({
        alertClass: 'alert-warning',
        message: `Deleting ${releaseName}…`
      });

      deleteRelease(release._id, () => {
        toastMessage({
          alertClass: 'alert-success',
          message: `Successfully deleted ${releaseName}.`
        });
      });
    });
  };

  handlePublishStatus = () => {
    const { release, publishStatus, toastMessage } = this.props;

    if (
      release.artwork &&
      release.trackList.length &&
      release.trackList.filter(track => track.hasAudio === false).length === 0
    ) {
      this.setState({ isPublishingRelease: true });
      publishStatus(release._id, () => {
        this.setState({ isPublishingRelease: false });
        let message;
        release.published
          ? (message = `'${release.releaseTitle}' has been taken offline.`)
          : (message = `'${release.releaseTitle}' is now live and on sale.`);
        toastMessage({
          alertClass: 'alert-success',
          message
        });
      });
    } else {
      toastMessage({
        alertClass: 'alert-danger',
        message:
          'Please ensure your release has artwork, and that all tracks have audio uploaded, before publishing.'
      });
    }
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
    const { history, release } = this.props;

    return (
      <li
        className={`no-gutters d-flex flex-column release ${
          release.published ? 'published' : 'unpublished'
        }`}
        key={release._id}
      >
        {release.artwork ? (
          <div className="artwork">
            <Link to={`/release/${release._id}`}>
              <img
                className="lazyload img-fluid"
                data-src={release.artwork ? release.artwork : null}
                alt={release.artwork && `'${release.releaseTitle}' Artwork`}
              />
            </Link>
          </div>
        ) : (
          <h6>
            <FontAwesome name="file-image-o" className="icon-left red" />
            No artwork uploaded.
          </h6>
        )}
        <div className="d-flex flex-column flex-grow-1">
          <div className="release-details">
            <h6>{this.renderTitle(release)}</h6>
            <h6>
              <FontAwesome name="tag" className="icon-left red" />
              ${release.price} USD
            </h6>
            <h6>
              <FontAwesome name="calendar-o" className="icon-left red" />
              {moment(new Date(release.releaseDate)).format('Do of MMM, YYYY')}
            </h6>
            <h6>
              <FontAwesome name="file-audio-o" className="icon-left red" />
              {release.trackList.length} Tracks
            </h6>
            {this.copiesSold()}
          </div>
          <div className="d-flex mt-auto">
            <button
              onClick={() => history.push(`/release/edit/${release._id}`)}
              className="btn btn-outline-primary btn-sm flex-grow-1"
            >
              <FontAwesome name="pencil" className="icon-left" />
              Edit
            </button>
            <button
              disabled={this.state.isPublishingRelease}
              onClick={() => this.handlePublishStatus()}
              className="btn btn-outline-warning btn-sm flex-grow-1"
            >
              {release.published ? (
                <Fragment>
                  <FontAwesome name="eye-slash" className="icon-left" />
                  Unpublish
                </Fragment>
              ) : (
                <Fragment>
                  <FontAwesome name="eye" className="icon-left" />
                  Publish
                </Fragment>
              )}
            </button>
            <button
              className="btn btn-outline-danger btn-sm flex-grow-1"
              disabled={this.state.isDeletingRelease}
              onClick={() => this.handleDeleteRelease()}
            >
              <FontAwesome name="trash" className="icon-left" />
              Delete
            </button>
          </div>
        </div>
      </li>
    );
  }
}

export default UserRelease;

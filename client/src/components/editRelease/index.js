import './editRelease.css';
import {
  Field,
  FieldArray,
  formValueSelector,
  getFormValues,
  reduxForm
} from 'redux-form';
import React, { Component } from 'react';
import {
  addRelease,
  addTrack,
  deleteArtwork,
  deleteRelease,
  deleteTrack,
  fetchRelease,
  fetchUserRelease,
  fetchXemPrice,
  moveTrack,
  publishStatus,
  toastError,
  toastInfo,
  toastSuccess,
  toastWarning,
  transcodeAudio,
  updateRelease,
  uploadArtwork,
  uploadAudio
} from 'actions';
import { CLOUD_URL } from 'index';
import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import RenderArtwork from './renderArtwork';
import RenderReleaseField from './renderReleaseField';
import RenderTrackList from './renderTrackList';
import Spinner from 'components/spinner';
import { connect } from 'react-redux';
import uuidv4 from 'uuid/v4';
import { withRouter } from 'react-router-dom';

class EditRelease extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isEditing: false,
      isLoading: true,
      coverArtLoaded: false,
      coverArtPreview: false,
      showAdditionalInfo: false,
      tagsInput: '',
      tagsError: null
    };
    this.artworkFile = null;
  }

  componentDidMount() {
    window.scrollTo(0, 0);
    this.props.fetchXemPrice();
    const { releaseId } = this.props.match.params;

    if (releaseId) {
      this.setEditing();
      this.props.fetchRelease(releaseId).then(() => {
        this.setArtwork();
        const { release } = this.props;

        if (release.releaseDate) {
          release.releaseDate = release.releaseDate.substring(0, 10);
        }
        this.props.initialize(release);
        this.setState({ isLoading: false });
      });
    } else {
      this.props.addRelease().then(res => {
        if (res.warning) {
          this.props.toastWarning(res.warning);
          this.props.history.push('/dashboard/nem-address');
          return;
        }

        const { release } = this.props;
        this.props.initialize(release);
        this.setState({ isLoading: false });
      });
    }
  }

  componentWillUnmount() {
    const isInvalid = !this.props.valid;
    const hasNoTracks = !this.props.release.trackList.length;
    const hasNoArtwork = !this.props.release.artwork;

    if (isInvalid && hasNoTracks && hasNoArtwork) {
      this.props.deleteRelease(this.props.release._id, () => {
        this.props.toastWarning(
          'Invalid or incomplete release discarded (automated housekeeping).'
        );
      });
    }
    if (this.artworkFile) {
      window.URL.revokeObjectURL(this.artworkFile.preview);
    }
  }

  onDropArt = (accepted, rejected) => {
    if (rejected.length) {
      this.props.toastError(
        'Upload rejected. Might be too large or formatted incorrectly. Needs to be a jpg or png under 10MB in size.'
      );
      return;
    }
    this.artworkFile = accepted[0];
    const releaseId = this.props.release._id;
    const image = new Image();
    image.src = window.URL.createObjectURL(this.artworkFile);
    let height;
    let width;

    image.onload = () => {
      height = image.height;
      width = image.width;

      if (height < 1000 || width < 1000) {
        this.props.toastError(
          `Sorry, but your image must be at least 1000 pixels high and wide (this seems to be ${width}px by ${height}px). Please edit and re-upload.`
        );
        return;
      }

      this.setState({ coverArtPreview: image.src });
      this.props.uploadArtwork(
        releaseId,
        this.artworkFile,
        this.artworkFile.type
      );
    };
  };

  onArtworkLoad = () => {
    this.setState({ coverArtLoaded: true });
  };

  onDropAudio = (accepted, rejected, index, trackId) => {
    if (rejected && rejected.length) {
      this.props.toastError(
        'This does not seem to be an audio file. Please select a wav or aiff audio file.'
      );
      return;
    }
    const audioFile = accepted[0];
    const { release } = this.props;
    const releaseId = release._id;
    const { trackTitle } = release.trackList[index];

    const trackName =
      (trackTitle && `'${trackTitle}'`) || `track ${parseInt(index, 10) + 1}`;

    this.props.toastInfo(
      `Uploading file '${audioFile.name}' for ${trackName}.`
    );
    this.props
      .uploadAudio(releaseId, trackId, audioFile, audioFile.type)
      .then(() => {
        this.props.toastSuccess(`Upload complete for ${trackName}!`);
        return this.props.transcodeAudio(releaseId, trackId, trackName);
      })
      .then(() => {
        const { hasAudio } = this.props.release.trackList[index];
        this.props.change(`trackList[${index}].hasAudio`, hasAudio);
      })
      .catch(error => this.props.toastError(`Upload failed! ${error.message}`));
  };

  onSubmit = values =>
    new Promise(resolve => {
      this.props.updateRelease(values).then(() => {
        const {
          release: { releaseTitle }
        } = this.props;

        this.props.toastSuccess(
          `${(releaseTitle && `'${releaseTitle}'`) || 'Release'} saved!`
        );

        this.props.history.push('/dashboard');
        resolve();
      });
    });

  setEditing() {
    this.setState({ isEditing: true });
  }

  setArtwork() {
    const { _id, artwork } = this.props.release;
    const releaseId = _id;

    if (artwork) {
      this.setState({ coverArtPreview: `${CLOUD_URL}/${releaseId}.jpg` });
    }
  }

  handleDeletePreview = () => {
    this.setState({ coverArtPreview: undefined });
  };

  handleTagsInput = event => {
    const { value } = event.target;
    let { tagsError } = this.state;
    const { tags } = this.props.formValues;
    tagsError = null;

    if (tags.length >= 20) {
      tagsError = 'Tag limit reached!';
      this.setState({ tagsError });
      return;
    }

    if (event.key === 'Enter') {
      const tag = value
        .replace(/[^0-9a-z\s]/gi, '')
        .trim()
        .toLowerCase();

      if (!tag.length) return;
      const update = [...tags, tag];
      this.props.change('tags', update);
      this.setState({ tagsInput: '' });
      return;
    }
    this.setState({ tagsInput: value });
  };

  handleRemoveTag = indexToDelete => {
    const { tags } = this.props.formValues;
    const update = tags.filter((tag, index) => index !== indexToDelete);
    this.props.change('tags', update);

    if (tags.length <= 20) {
      this.setState({ tagsError: '' });
    }
  };

  handleClearTags = () => {
    this.props.change('tags', []);
    this.setState({ tagsError: '' });
  };

  renderHeader() {
    const { isEditing } = this.state;
    const { releaseTitle } = this.props.release;

    if (isEditing && releaseTitle) {
      return `Editing '${releaseTitle}'`;
    } else if (isEditing) {
      return 'Editing Release';
    }
    return 'Add Release';
  }

  renderPriceFormText() {
    const { price, xemPriceUsd } = this.props;
    if (!xemPriceUsd) return;
    const convertedPrice = (price / xemPriceUsd).toFixed(2);

    if (price === '0') {
      return 'Name Your Price! Or \u2018free\u2019. Fans will still be able to donate.';
    }

    if (price) return `Approximately ${convertedPrice} XEM.`;
    return 'Set your price in USD (enter \u20180\u2019 for a \u2018Name Your Price\u2019 release).';
  }

  render() {
    const { formValues, invalid, pristine, submitting } = this.props;
    const { isEditing, isLoading, tagsError } = this.state;

    const submitButton = (
      <div className="d-flex justify-content-end">
        <button
          type="button"
          className="btn btn-outline-primary btn-lg"
          disabled={invalid || pristine || submitting}
          onClick={this.props.handleSubmit(this.onSubmit)}
        >
          {isEditing ? 'Update Release' : 'Add Release'}
        </button>
      </div>
    );

    if (isLoading) return <Spinner />;

    const tags =
      formValues &&
      formValues.tags.map((tag, index) => (
        <div
          className="tag mr-2 mb-2"
          key={uuidv4()}
          onClick={() => this.handleRemoveTag(index)}
          role="button"
          tabIndex="-1"
          title={`Click to delete '${tag}'.`}
        >
          {tag}
          <FontAwesome className="ml-2 remove-tag" name="times" />
        </div>
      ));

    return (
      <main className="container">
        <div className="row">
          <div className="col mb-5">
            <form>
              <h2 className="text-center mt-4">{this.renderHeader()}</h2>
              {!isEditing && (
                <p>
                  Please enter your release info below. Artwork and audio will
                  be saved instantly after uploading.
                </p>
              )}
              <div className="row p-0">
                <div className="col-md mb-4">
                  <Field
                    component={RenderReleaseField}
                    label="Artist Name"
                    name="artistName"
                    required
                    type="text"
                  />
                  <Field
                    component={RenderReleaseField}
                    label="Release Title"
                    name="releaseTitle"
                    required
                    type="text"
                  />
                  <Field
                    component={RenderReleaseField}
                    formText="This won't affect the visibility of your release."
                    label="Release Date"
                    name="releaseDate"
                    required
                    type="date"
                  />
                  <Field
                    component={RenderReleaseField}
                    formText={this.renderPriceFormText()}
                    label="Price (USD)"
                    name="price"
                    required
                    type="number"
                  />
                  <button
                    className="btn btn-outline-primary btn-sm mb-3"
                    onClick={() =>
                      this.setState(
                        this.state.showAdditionalInfo
                          ? { showAdditionalInfo: false }
                          : { showAdditionalInfo: true }
                      )
                    }
                    title="Show more release details."
                    type="button"
                  >
                    {this.state.showAdditionalInfo ? (
                      <>
                        <FontAwesome
                          name="chevron-circle-up"
                          className="mr-2"
                        />
                        Basic
                      </>
                    ) : (
                      <>
                        <FontAwesome
                          name="chevron-circle-down"
                          className="mr-2"
                        />
                        Advanced
                      </>
                    )}
                  </button>
                  {this.state.showAdditionalInfo && (
                    <>
                      <Field
                        component={RenderReleaseField}
                        label="Record Label"
                        name="recordLabel"
                        type="text"
                      />
                      <Field
                        component={RenderReleaseField}
                        formText="Your own identifier, if you have one."
                        label="Catalogue Number"
                        name="catNumber"
                        type="text"
                      />
                      <Field
                        component={RenderReleaseField}
                        formText="Notable release information, e.g. press release copy, review pull quotes, notable equipment or concepts."
                        label="Release Info"
                        name="info"
                        type="textarea"
                      />
                      <Field
                        component={RenderReleaseField}
                        formText="Please credit any writers, performers, producers, designers and engineers involved."
                        label="Credits"
                        name="credits"
                        type="textarea"
                      />
                      <div className="row p-0">
                        <div className="col">
                          <Field
                            component={RenderReleaseField}
                            label="Copyright Year"
                            name="cLine.year"
                            type="number"
                          />
                        </div>
                        <div className="col">
                          <Field
                            component={RenderReleaseField}
                            formText="i.e. Label, publisher or artist/individual."
                            label="Copyright Owner"
                            name="cLine.owner"
                            type="text"
                          />
                        </div>
                      </div>
                      <div className="row p-0">
                        <div className="col">
                          <Field
                            component={RenderReleaseField}
                            formText="Year first released as a recording."
                            label="Recording Copyright Year"
                            name="pLine.year"
                            type="number"
                          />
                        </div>
                        <div className="col">
                          <Field
                            component={RenderReleaseField}
                            formText="i.e. Label or artist/individual."
                            label="Recording Copyright Owner"
                            name="pLine.owner"
                            type="text"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="col-md mb-4">
                  <RenderArtwork
                    artworkFile={this.artworkFile}
                    artworkUploading={this.props.artworkUploading}
                    artworkUploadProgress={this.props.artworkUploadProgress}
                    onArtworkLoad={this.onArtworkLoad}
                    coverArtLoaded={this.state.coverArtLoaded}
                    coverArtPreview={this.state.coverArtPreview}
                    deleteArtwork={this.props.deleteArtwork}
                    handleDeletePreview={this.handleDeletePreview}
                    onDropArt={this.onDropArt}
                    publishStatus={this.props.publishStatus}
                    release={this.props.release}
                    toastSuccess={this.props.toastSuccess}
                    toastWarning={this.props.toastWarning}
                  />
                  {this.state.showAdditionalInfo && (
                    <div className="tags mb-4">
                      <div className="form-group">
                        <label htmlFor="tagsInput">
                          Tags
                          <button
                            className="btn btn-outline-primary btn-sm clear-tags px-1 ml-2"
                            onClick={this.handleClearTags}
                            title="Remove all currently set tags."
                            type="button"
                          >
                            Clear
                          </button>
                        </label>
                        <input
                          className="form-control"
                          id="tagsInput"
                          disabled={this.state.tagsError}
                          onChange={this.handleTagsInput}
                          onKeyPress={this.handleTagsInput}
                          type="text"
                          value={this.state.tagsInput}
                        />
                        <small className="form-text text-muted">
                          e.g. Genres, styles, prominent instruments, or guest
                          artists, remixers, conductors etc. 20 tag max.
                        </small>
                        <div className="invalid-feedback">
                          {tagsError && tagsError}
                        </div>
                      </div>
                      {tags && tags.length ? (
                        <p>Tags set so far…</p>
                      ) : (
                        <p>
                          No tags currently set for this release. We strongly
                          recommend setting some tags as they are indexed for
                          searching.
                        </p>
                      )}
                      {tags && tags.length ? tags : null}
                    </div>
                  )}
                  {submitButton}
                </div>
              </div>
              <h3 className="track-list-title text-center">Track List</h3>
              <p>
                Upload formats supported: flac, aiff, wav (bit-depths greater
                than 24 will be truncated to 24-bit). All formats will be stored
                in flac format.
              </p>
              <p>You can drag and drop to reorder tracks.</p>
              <FieldArray
                addTrack={this.props.addTrack}
                audioUploadProgress={this.props.audioUploadProgress}
                change={this.props.change}
                component={RenderTrackList}
                deleteTrack={this.props.deleteTrack}
                initialize={this.props.initialize}
                isDeleting={this.props.isDeleting}
                isTranscoding={this.props.isTranscoding}
                moveTrack={this.props.moveTrack}
                name="trackList"
                onDropAudio={this.onDropAudio}
                release={this.props.release}
                toastSuccess={this.props.toastSuccess}
              />
              {submitButton}
            </form>
          </div>
        </div>
      </main>
    );
  }
}

const validate = ({
  artistName,
  price,
  releaseDate,
  releaseTitle,
  trackList
}) => {
  const errors = {};
  if (!artistName) {
    errors.artistName = 'Please enter an artist name.';
  }
  if (!releaseTitle) {
    errors.releaseTitle = 'Please enter a release title.';
  }
  if (!releaseDate) {
    errors.releaseDate = 'Please enter a release date.';
  }
  if (!price && price !== 0) {
    errors.price = 'Please enter a price.';
  }
  if (price && price < 0) {
    errors.price = 'Price must be a positive number.';
  }
  if (trackList) {
    const trackListErrors = [];
    trackList.forEach((track, trackIndex) => {
      const trackErrors = {};
      if (!track.trackTitle || !track.trackTitle.trim()) {
        trackErrors.trackTitle =
          'Please either enter a track title, or remove it from the list.';
        trackListErrors[trackIndex] = trackErrors;
      }
    });
    if (trackListErrors.length) {
      errors.trackList = trackListErrors;
    }
  }
  return errors;
};

const fieldSelector = formValueSelector('releaseForm');

const mapStateToProps = state => ({
  artworkUploading: state.releases.artworkUploading,
  artworkUploadProgress: state.releases.artworkUploadProgress,
  artworkUploadUrl: state.releases.artworkUploadUrl,
  audioUploadProgress: state.releases.audioUploadProgress,
  audioUploadUrl: state.releases.audioUploadUrl,
  formValues: getFormValues('releaseForm')(state),
  isDeleting: state.releases.isDeleting,
  isTranscoding: state.releases.isTranscoding,
  price: fieldSelector(state, 'price'),
  release: state.releases.selectedRelease,
  xemPriceUsd: state.nem.xemPriceUsd
});

EditRelease.propTypes = {
  addRelease: PropTypes.func,
  addTrack: PropTypes.func,
  artworkUploading: PropTypes.bool,
  artworkUploadProgress: PropTypes.number,
  audioUploadProgress: PropTypes.array,
  change: PropTypes.func,
  deleteArtwork: PropTypes.func,
  deleteRelease: PropTypes.func,
  deleteTrack: PropTypes.func,
  fetchRelease: PropTypes.func,
  fetchXemPrice: PropTypes.func,
  formValues: PropTypes.object,
  handleSubmit: PropTypes.func,
  history: PropTypes.object,
  initialize: PropTypes.func,
  invalid: PropTypes.bool,
  isDeleting: PropTypes.array,
  isTranscoding: PropTypes.array,
  match: PropTypes.object,
  moveTrack: PropTypes.func,
  price: PropTypes.number,
  pristine: PropTypes.bool,
  publishStatus: PropTypes.func,
  release: PropTypes.object,
  submitting: PropTypes.bool,
  toastError: PropTypes.func,
  toastInfo: PropTypes.func,
  toastWarning: PropTypes.func,
  toastSuccess: PropTypes.func,
  transcodeAudio: PropTypes.func,
  updateRelease: PropTypes.func,
  uploadArtwork: PropTypes.func,
  uploadDate: PropTypes.func,
  uploadRelease: PropTypes.func,
  uploadAudio: PropTypes.func,
  valid: PropTypes.bool,
  xemPriceUsd: PropTypes.number
};

export default reduxForm({
  validate,
  form: 'releaseForm'
})(
  connect(mapStateToProps, {
    addRelease,
    addTrack,
    deleteArtwork,
    deleteRelease,
    deleteTrack,
    fetchRelease,
    fetchUserRelease,
    fetchXemPrice,
    moveTrack,
    publishStatus,
    toastError,
    toastInfo,
    toastSuccess,
    toastWarning,
    transcodeAudio,
    updateRelease,
    uploadArtwork,
    uploadAudio
  })(withRouter(EditRelease))
);

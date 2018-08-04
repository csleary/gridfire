import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import FontAwesome from 'react-fontawesome';
import {
  Field,
  FieldArray,
  formValueSelector,
  getFormValues,
  reduxForm
} from 'redux-form';
import axios from 'axios';
import RenderArtwork from './editRelease/RenderArtwork';
import RenderReleaseField from './editRelease/RenderReleaseField';
import RenderTrackList from './editRelease/RenderTrackList';
import Spinner from './Spinner';
import {
  addRelease,
  addTrack,
  deleteArtwork,
  deleteRelease,
  deleteTrack,
  fetchAudioUploadUrl,
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
  uploadAudioProgress
} from '../actions';
import '../style/editRelease.css';

class EditRelease extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isEditing: false,
      isLoading: false,
      audioUploading: {},
      coverArtLoaded: false,
      coverArtPreview: false,
      tagsInput: '',
      tagsError: null
    };
    this.artworkFile = null;
  }

  componentDidMount() {
    this.setLoading(true);
    window.scrollTo(0, 0);
    this.props.fetchXemPrice();
    const { releaseId } = this.props.match.params;

    if (releaseId) {
      this.setEditing();
      this.props.fetchRelease(releaseId).then(() => {
        const { release } = this.props;

        if (release.releaseDate) {
          release.releaseDate = release.releaseDate.substring(0, 10);
        }
        this.setArtwork();
        this.props.initialize(release);
        this.setLoading(false);
      });
    } else {
      this.props.addRelease().then(() => {
        const release = this.props.release;
        this.props.initialize(release);
        this.setLoading(false);
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

      this.setState({ coverArtPreview: this.artworkFile.preview });
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
    if (rejected.length) {
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
    this.props
      .fetchAudioUploadUrl(releaseId, trackId, audioFile.type)
      .then(res => {
        const audioUploadUrl = res.data;

        this.props.toastInfo(
          `Uploading file '${audioFile.name}' for ${trackName}.`
        );

        const config = {
          headers: {
            'Content-Type': audioFile.type
          },
          onUploadProgress: event => {
            const progress = (event.loaded / event.total) * 100;
            this.props.uploadAudioProgress(trackId, Math.floor(progress));
          }
        };

        axios
          .put(audioUploadUrl, audioFile, config)
          .then(() => {
            this.props.toastSuccess(`Upload complete for ${trackName}!`);
            return this.props.transcodeAudio(releaseId, trackId, trackName);
          })
          .then(() => {
            const { hasAudio } = this.props.release.trackList[index];
            this.props.change(`trackList[${index}].hasAudio`, hasAudio);
          })
          .catch(error =>
            this.props.toastError(`Upload failed! ${error.message}`)
          );
      });
  };

  onSubmit = values =>
    new Promise(resolve => {
      this.props.updateRelease(values).then(() => {
        const { release } = this.props;
        const { releaseTitle } = release;
        this.props.toastSuccess(
          `${(releaseTitle && `'${releaseTitle}'`) || 'Release'} saved!`
        );
        if (release.releaseDate) {
          release.releaseDate = release.releaseDate.substring(0, 10);
        }
        this.props.initialize(release);
        this.props.history.push('/dashboard');
        resolve();
      });
    });

  setLoading(boolean) {
    this.setState({
      isLoading: boolean
    });
  }

  setEditing() {
    this.setState({ isEditing: true });
  }

  setArtwork() {
    const { artwork } = this.props.release;
    if (artwork) {
      this.setState({ coverArtPreview: this.props.release.artwork });
    }
  }

  handleDeletePreview = () => {
    this.setState({ coverArtPreview: false });
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
      return 'Editing Untitled Release';
    }
    return 'Add Release';
  }

  renderPriceformText() {
    const { price, xemPriceUsd } = this.props;
    if (!xemPriceUsd) return;
    const convertedPrice = (price / xemPriceUsd).toFixed(2);

    if (price === '0') {
      return "Name Your Price! Or 'free'. Fans will still be able to donate.";
    }
    if (price) return `Approximately ${convertedPrice} XEM.`;
    return "Set your price in USD (enter '0' for a 'Name Your Price' release).";
  }

  render() {
    const { formValues } = this.props;
    const { isLoading, tagsError } = this.state;

    if (isLoading) return <Spinner />;

    const tags =
      formValues &&
      formValues.tags.map((tag, index) => (
        <div
          className="tag mr-2 mb-2"
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
          <div className="col">
            <form>
              <h2 className="text-center">{this.renderHeader()}</h2>
              {!this.state.isEditing && (
                <p>
                  Please enter your release info below. Artwork and audio will
                  be saved instantly after uploading.
                </p>
              )}
              <div className="row p-0">
                <div className="col-md">
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
                    formText={this.renderPriceformText()}
                    label="Price (USD)"
                    name="price"
                    required
                    type="number"
                  />
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
                </div>
                <div className="col-md">
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
                  <div className="tags mb-5">
                    <div className="form-group">
                      <label htmlFor="tagsInput">
                        Tags [
                        <a
                          onClick={this.handleClearTags}
                          role="button"
                          style={{ cursor: 'pointer' }}
                          tabIndex="-1"
                        >
                          clear
                        </a>]
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
                    <Field component="input" name="tags" type="hidden" />
                    {tags && tags.length ? (
                      <p>Tags set so far…</p>
                    ) : (
                      <p>
                        No tags currently set for this release. We strongly
                        recommend setting some tags as they are indexed for the
                        search engine.
                      </p>
                    )}
                    {tags && tags.length ? tags : null}
                  </div>
                  <div className="d-flex justify-content-end">
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-lg"
                      disabled={
                        this.props.invalid ||
                        this.props.pristine ||
                        this.props.submitting
                      }
                      onClick={this.props.handleSubmit(this.onSubmit)}
                    >
                      {this.state.isEditing ? 'Update Release' : 'Add Release'}
                    </button>
                  </div>
                </div>
              </div>
              <h3 className="track-list-title text-center">Track List</h3>
              <p>You can drag and drop to reorder tracks.</p>
              <FieldArray
                addTrack={this.props.addTrack}
                audioUploadProgress={this.props.audioUploadProgress}
                component={RenderTrackList}
                deleteTrack={this.props.deleteTrack}
                initialize={this.props.initialize}
                isAddingTrack={this.props.isAddingTrack}
                isTranscoding={this.props.isTranscoding}
                moveTrack={this.props.moveTrack}
                name="trackList"
                onDropAudio={this.onDropAudio}
                release={this.props.release}
                toastSuccess={this.props.toastSuccess}
              />
              <div className="d-flex justify-content-end">
                <button
                  type="button"
                  className="btn btn-outline-primary btn-lg"
                  disabled={
                    this.props.invalid ||
                    this.props.pristine ||
                    this.props.submitting
                  }
                  onClick={this.props.handleSubmit(this.onSubmit)}
                >
                  {this.state.isEditing ? 'Update Release' : 'Add Release'}
                </button>
              </div>
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
      if (!track || !track.trackTitle) {
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

const mapStateToProps = (state, ownProps) => ({
  formValues: getFormValues('releaseForm')(state),
  artworkUploading: state.releases.artworkUploading,
  artworkUploadProgress: state.releases.artworkUploadProgress,
  artworkUploadUrl: state.releases.artworkUploadUrl,
  audioUploadProgress: state.releases.audioUploadProgress,
  audioUploadUrl: state.releases.audioUploadUrl,
  initialValues: ownProps.release,
  isAddingTrack: state.releases.isAddingTrack,
  isDeletingTrack: state.releases.isDeletingTrack,
  isTranscoding: state.releases.isTranscoding,
  price: fieldSelector(state, 'price'),
  release: state.releases.selectedRelease,
  xemPriceUsd: state.nem.xemPriceUsd
});

export default reduxForm({
  validate,
  form: 'releaseForm',
  enableReinitialize: true,
  keepDirtyOnReinitialize: true
})(
  connect(
    mapStateToProps,
    {
      addRelease,
      addTrack,
      deleteArtwork,
      deleteRelease,
      deleteTrack,
      fetchAudioUploadUrl,
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
      uploadAudioProgress
    }
  )(withRouter(EditRelease))
);

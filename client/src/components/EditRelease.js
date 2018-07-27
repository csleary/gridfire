import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { Field, FieldArray, formValueSelector, reduxForm } from 'redux-form';
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
  uploadArtwork
} from '../actions';
import '../style/editRelease.css';

class EditRelease extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isEditing: false,
      isLoading: false,
      coverArtPreview: '',
      audioUploading: {}
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
    if (!this.props.valid && !this.props.release.trackList.length) {
      this.props.deleteRelease(this.props.release._id, () => {
        this.props.toastWarning(
          'Invalid or incomplete release discarded (automated housekeeping).'
        );
      });
    }
    if (this.artworkFile) window.URL.revokeObjectURL(this.artworkFile.preview);
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
      this.props.uploadArtwork(
        releaseId,
        this.artworkFile,
        this.artworkFile.type
      );
      this.setState({
        coverArtPreview: this.artworkFile.preview
      });
    };
  };

  onDropAudio = (accepted, rejected, index, trackId) => {
    if (rejected.length) {
      this.props.toastError(
        'This does not seem to be an audio file. Please select a wav or aiff audio file.'
      );
      return;
    }
    const audioFile = accepted[0];
    const releaseId = this.props.release._id;
    const { trackTitle } = this.props.release.trackList[index];
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
            this.setState({
              audioUploading: {
                ...this.state.audioUploading,
                [trackId]: Math.floor(progress)
              }
            });
          }
        };

        axios
          .put(audioUploadUrl, audioFile, config)
          .then(() => {
            this.props.toastSuccess(`Upload complete for ${trackName}!`);
            return this.props.transcodeAudio(releaseId, trackId, trackName);
          })
          .then(this.props.fetchUserRelease(releaseId))
          .catch(error =>
            this.props.toastError(
              `Upload failed! Here's the message we received: ${error.message}`
            )
          );
      });
  };

  onSubmit = values =>
    new Promise(resolve => {
      this.props.updateRelease(values, () => {
        const { releaseTitle } = this.props.release;
        this.props.history.push('/dashboard');
        this.props.toastSuccess(
          `${(releaseTitle && `'${releaseTitle}'`) || 'Release'} saved!`
        );
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

  handleDeletePreview = () => {
    this.setState({ coverArtPreview: '' });
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
    if (this.state.isLoading) return <Spinner />;

    return (
      <main className="container">
        <div className="row">
          <div className="col">
            <form onSubmit={this.props.handleSubmit(this.onSubmit)}>
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
                <RenderArtwork
                  artworkFile={this.artworkFile}
                  artworkUploading={this.props.artworkUploading}
                  artworkUploadProgress={this.props.artworkUploadProgress}
                  coverArtPreview={this.state.coverArtPreview}
                  deleteArtwork={this.props.deleteArtwork}
                  handleDeletePreview={this.handleDeletePreview}
                  onDropArt={this.onDropArt}
                  publishStatus={this.props.publishStatus}
                  release={this.props.release}
                  toastSuccess={this.props.toastSuccess}
                  toastWarning={this.props.toastWarning}
                />
              </div>
              <h3 className="track-list-title text-center">Track List</h3>
              <p>You can drag and drop to reorder tracks.</p>
              <FieldArray
                addTrack={this.props.addTrack}
                audioUploading={this.state.audioUploading}
                component={RenderTrackList}
                deleteTrack={this.props.deleteTrack}
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
                  type="submit"
                  className="btn btn-outline-primary btn-lg"
                  disabled={
                    this.props.invalid ||
                    this.props.pristine ||
                    this.props.submitting
                  }
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
          'Please either enter a track title or remove it from the list.';
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
  audioUploadUrl: state.releases.audioUploadUrl,
  isAddingTrack: state.releases.isAddingTrack,
  isDeletingTrack: state.releases.isDeletingTrack,
  isTranscoding: state.releases.isTranscoding,
  price: fieldSelector(state, 'price'),
  release: state.releases.selectedRelease,
  xemPriceUsd: state.nem.xemPriceUsd
});

export default reduxForm({
  validate,
  form: 'releaseForm'
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
      uploadArtwork
    }
  )(withRouter(EditRelease))
);

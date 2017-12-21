import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { Field, FieldArray, formValueSelector, reduxForm } from 'redux-form';
import Dropzone from 'react-dropzone';
import axios from 'axios';
import FontAwesome from 'react-fontawesome';
import ProgressBar from './ProgressBar';
import Spinner from './Spinner';
import {
  addRelease,
  addTrack,
  deleteArtwork,
  deleteTrack,
  fetchArtworkUploadUrl,
  fetchAudioUploadUrl,
  fetchRelease,
  fetchUserRelease,
  fetchXemPrice,
  moveTrack,
  publishStatus,
  toastMessage,
  transcodeAudio,
  updateRelease
} from '../actions';
import '../style/editRelease.css';

let artworkFile;

class EditRelease extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isEditing: false,
      isLoading: false,
      coverArtPreview: '',
      uploadingArt: '',
      uploadingAudio: ''
    };
  }

  componentDidMount = () => {
    this.setLoading(true);
    window.scrollTo(0, 0);
    this.props.fetchXemPrice();
    const { id } = this.props.match.params;
    if (id) {
      this.setEditing();
      this.props.fetchRelease(id).then(() => {
        const release = this.props.release;
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
  };

  componentWillUnmount() {
    if (artworkFile) window.URL.revokeObjectURL(artworkFile.preview);
  }

  onDropArt = (accepted, rejected) => {
    if (rejected.length > 0) {
      this.props.toastMessage({
        alertClass: 'alert-danger',
        message:
          'Upload rejected. Might be too large or formatted incorrectly. Needs to be a jpg or png under 10MB in size.'
      });
    } else {
      artworkFile = accepted[0];
      const { _id } = this.props.release;
      const image = new Image();
      image.src = window.URL.createObjectURL(artworkFile);
      let height;
      let width;

      image.onload = () => {
        height = image.height;
        width = image.width;
        if (height !== width) {
          this.props.toastMessage({
            alertClass: 'alert-danger',
            message: `Sorry, but your image must be square (this seems to be ${width}px by ${height}px). Please edit and re-upload.`
          });
        } else {
          this.props.fetchArtworkUploadUrl(_id, artworkFile.type).then(() => {
            const { artworkUploadUrl } = this.props;
            const config = {
              headers: {
                'Content-Type': artworkFile.type
              },
              onUploadProgress: (event) => {
                const progress = event.loaded / event.total * 100;
                this.setState({
                  uploadingArt: Math.floor(progress)
                });
              }
            };

            axios
              .put(artworkUploadUrl, artworkFile, config)
              .then(() => {
                this.props.toastMessage({
                  alertClass: 'alert-success',
                  message: 'Artwork uploaded!'
                });
              })
              .catch(error =>
                this.props.toastMessage({
                  alertClass: 'alert-danger',
                  message: `Upload failed. Here's the message we received: ${
                    error.message
                  }`
                })
              );
          });
          this.setState({
            coverArtPreview: artworkFile.preview
          });
        }
      };
    }
  };

  onDropAudio = (accepted, rejected, index) => {
    if (rejected.length > 0) {
      this.props.toastMessage({
        alertClass: 'alert-danger',
        message:
          'This does not seem to be an audio file. Please select a wav or aiff audio file.'
      });
    } else {
      const audioFile = accepted[0];
      const id = this.props.release._id;
      this.props.fetchAudioUploadUrl(id, index, audioFile.type).then(() => {
        this.props.toastMessage({
          alertClass: 'alert-info',
          message: `Uploading '${audioFile.name}' for track ${parseInt(
            index,
            10
          ) + 1}.`
        });
        const { audioUploadUrl } = this.props;
        const config = {
          headers: {
            'Content-Type': audioFile.type
          },
          onUploadProgress: (event) => {
            const progress = event.loaded / event.total * 100;
            this.setState({
              uploadingAudio: {
                ...this.state.uploadingAudio,
                [index]: Math.floor(progress)
              }
            });
          }
        };
        axios
          .put(audioUploadUrl, audioFile, config)
          .then(() => {
            this.props.transcodeAudio(id, index);
            this.props.fetchUserRelease(id);
            this.props.toastMessage({
              alertClass: 'alert-success',
              message: `Track ${parseInt(index, 10) + 1} uploaded!`
            });
          })
          .catch(error =>
            this.props.toastMessage({
              alertClass: 'alert-danger',
              message: `Upload failed. Here's the message we received: ${
                error.message
              }`
            })
          );
      });
    }
  };

  onSubmit = (values) => {
    this.props.updateRelease(values, () => {
      this.props.history.push('/dashboard');
      this.props.toastMessage({
        alertClass: 'alert-success',
        message: `${this.props.release.releaseTitle || 'Release'} saved!`
      });
    });
  };

  setLoading(boolean) {
    this.setState({
      isLoading: boolean
    });
  }

  setEditing = () => {
    this.setState({ isEditing: true });
  };

  pleaseConfirm(title, callback) {
    const confirmation = window.confirm(
      `Are you sure you want to delete ${title || 'this track'}?`
    );
    if (confirmation) callback();
  }

  hasAudio(index) {
    if (
      (this.props.release.trackList[index] &&
        this.props.release.trackList[index].hasAudio) ||
      this.state.uploadingAudio[index] === 100
    ) {
      return 'audio-true';
    } else if (this.state.uploadingAudio[index] < 100) {
      return 'audio-uploading';
    }
    return 'audio-false';
  }

  renderReleaseField = ({
    formText,
    input,
    label,
    meta: { error, touched },
    name,
    type
  }) => {
    const className = `form-group ${touched && error ? 'invalid' : ''}`;
    return (
      <div className={className}>
        <label htmlFor={name}>{label}</label>
        <input className="form-control" id={name} type={type} {...input} />
        <small className="form-text text-muted">{formText}</small>
        <div className="invalid-feedback">{touched && error}</div>
      </div>
    );
  };

  renderTrack({ input, label, meta: { touched, error }, name, type }) {
    const className = `form-control ${touched && error ? 'invalid' : ''}`;
    return (
      <div>
        <div className="d-flex align-items-center">
          <label htmlFor={name}>{label}</label>
          <input
            className={className}
            id={name}
            name="trackTitle"
            placeholder={`Track ${label} Title`}
            required
            type={type}
            {...input}
          />
        </div>
        <div className="invalid-feedback">{touched && error}</div>
      </div>
    );
  }

  renderTrackList = ({ fields, uploadingAudio }) => (
    <ul className="list-group track-list">
      {fields.map((track, index) => (
        <li
          className={`list-group-item ${this.hasAudio(index)}`}
          key={`${track}._id`}
        >
          <Field
            component={this.renderTrack}
            label={index + 1}
            name={`${track}.trackTitle`}
            type="text"
          />
          <div className="d-flex">
            {index < fields.length - 1 && (
              <button
                type="button"
                title="Move Down"
                onClick={() => {
                  const { _id } = this.props.release;
                  this.props
                    .moveTrack(_id, index, index + 1)
                    .then(fields.swap(index, index + 1));
                }}
                className="btn btn-outline-secondary btn-sm"
              >
                <FontAwesome name="arrow-down" className="icon-left" />
                Down
              </button>
            )}
            {index > 0 && (
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => {
                  const { _id } = this.props.release;
                  this.props
                    .moveTrack(_id, index, index - 1)
                    .then(fields.swap(index, index - 1));
                }}
                title="Move Up"
                type="button"
              >
                <FontAwesome name="arrow-up" className="icon-left" />
                Up
              </button>
            )}
            <Dropzone
              accept=".wav, .aif, .aiff"
              activeClassName="dropzone-audio-active"
              className="btn btn-outline-primary btn-sm dropzone-audio"
              disablePreview
              multiple={false}
              onDrop={(accepted, rejected) =>
                this.onDropAudio(accepted, rejected, index)
              }
            >
              {uploadingAudio[index] && uploadingAudio[index] < 100 ? (
                <FontAwesome name="cog" spin className="icon-left" />
              ) : (
                <FontAwesome name="plus-circle" className="icon-left" />
              )}
              {this.state.uploadingAudio[index] < 100 &&
              this.state.uploadingAudio[index] > 0
                ? `${this.state.uploadingAudio[index]
                  .toString(10)
                  .padStart(2, '0')}%`
                : 'Audio'}
            </Dropzone>
            <button
              className="btn btn-outline-danger btn-sm ml-auto"
              onClick={() =>
                this.pleaseConfirm(
                  this.props.release.trackList[index].trackTitle,
                  () => {
                    this.props
                      .deleteTrack(
                        this.props.release._id,
                        this.props.release.trackList[index]._id
                      )
                      .then(fields.remove(index));
                  }
                )
              }
              title="Remove Track"
              type="button"
            >
              <FontAwesome name="trash" className="icon-left" />
              Remove
            </button>
          </div>
          <ProgressBar
            percentComplete={uploadingAudio[index]}
            willDisplay={uploadingAudio[index] && uploadingAudio[index] < 100}
          />
        </li>
      ))}
      <li className="list-group-item">
        <button
          className="btn btn-outline-primary btn-sm add-track"
          onClick={() => {
            this.props.addTrack(this.props.release._id).then(fields.push());
          }}
          title="Add Track"
          type="button"
        >
          <FontAwesome name="plus-circle" className="icon-left" />
          Add
        </button>
      </li>
    </ul>
  );

  renderHeader() {
    if (this.state.isEditing && this.props.release.releaseTitle) {
      return `Editing '${this.props.release.releaseTitle}'`;
    } else if (this.state.isEditing) {
      return 'Editing Untitled Release';
    }
    return 'Add Release';
  }

  render() {
    if (this.state.isLoading) {
      return <Spinner />;
    }
    return (
      <form onSubmit={this.props.handleSubmit(this.onSubmit)}>
        <h2 className="text-center">{this.renderHeader()}</h2>
        {!this.state.isEditing && (
          <p>
            Please enter your release info below. Artwork and audio will be
            saved instantly after uploading.
          </p>
        )}
        <div>
          {(this.state.coverArtPreview || this.props.release.artwork) && (
            <div className="cover-art">
              <img
                className="img-fluid"
                alt=""
                src={
                  this.state.coverArtPreview
                    ? this.state.coverArtPreview
                    : this.props.release.artwork
                }
              />
              <div className="d-flex flex-row justify-content-end cover-art-overlay">
                <div className="delete">
                  <a
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      const { release } = this.props;
                      if (release.published) {
                        this.props.publishStatus(release._id);
                      }
                      this.props.deleteArtwork(release._id).then(() => {
                        if (artworkFile) {
                          window.URL.revokeObjectURL(artworkFile.preview);
                        }
                        this.props.toastMessage({
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
            onDrop={this.onDropArt}
          >
            <FontAwesome name="upload" className="icon-left" />
            {this.state.uploadingArt && this.state.uploadingArt < 100
              ? `Uploading: ${this.state.uploadingArt}%`
              : 'Drop artwork here, or click to select.'}
            <ProgressBar
              percentComplete={this.state.uploadingArt}
              willDisplay={
                this.state.uploadingArt && this.state.uploadingArt < 100
              }
            />
          </Dropzone>
        </div>
        <div className="row p-0">
          <div className="col-lg">
            <Field
              component={this.renderReleaseField}
              label="Artist Name"
              name="artistName"
              required
              type="text"
            />
            <Field
              component={this.renderReleaseField}
              formText="This won't affect the visibility of your release."
              label="Release Date"
              name="releaseDate"
              required
              type="date"
            />
            <Field
              component={this.renderReleaseField}
              label="Record Label"
              name="recordLabel"
              type="text"
            />
          </div>
          <div className="col-lg">
            <Field
              component={this.renderReleaseField}
              label="Release Title"
              name="releaseTitle"
              required
              type="text"
            />
            <Field
              component={this.renderReleaseField}
              formText={
                this.props.price
                  ? `Approximately $${(
                    this.props.price * this.props.xemPriceUsd
                  ).toFixed(2)} USD. (Enter '0' for free.)`
                  : "Set your price in XEM (enter '0' for free)."
              }
              label="Price"
              name="price"
              required
              type="number"
            />
            <Field
              component={this.renderReleaseField}
              formText="Your own identifier, if you have one."
              label="Catalogue Number"
              name="catNumber"
              type="text"
            />
          </div>
        </div>
        <h3 className="track-list-title text-center">Track List</h3>
        <FieldArray
          name="trackList"
          component={this.renderTrackList}
          uploadingAudio={this.state.uploadingAudio}
        />
        <div className="d-flex justify-content-end">
          <button
            type="submit"
            className="btn btn-outline-primary btn-lg"
            disabled={this.props.pristine || this.props.submitting}
          >
            {this.state.isEditing ? 'Update Release' : 'Add Release'}
          </button>
        </div>
      </form>
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
  artworkUploadUrl: state.releases.artworkUploadUrl,
  audioUploadUrl: state.releases.audioUploadUrl,
  price: fieldSelector(state, 'price'),
  release: state.releases.selectedRelease,
  transcoding: state.releases.transcoding,
  xemPriceUsd: state.nem.xemPriceUsd
});

export default reduxForm({
  validate,
  form: 'releaseForm'
})(
  connect(mapStateToProps, {
    addRelease,
    addTrack,
    deleteArtwork,
    deleteTrack,
    fetchArtworkUploadUrl,
    fetchAudioUploadUrl,
    fetchRelease,
    fetchUserRelease,
    fetchXemPrice,
    moveTrack,
    publishStatus,
    toastMessage,
    transcodeAudio,
    updateRelease
  })(withRouter(EditRelease))
);

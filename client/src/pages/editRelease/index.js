import './editRelease.css';
import { Field, FieldArray, formValueSelector, getFormValues, propTypes, reduxForm } from 'redux-form';
import React, { Component } from 'react';
import { addNewRelease, deleteRelease, publishStatus, updateRelease } from 'features/releases';
import { deleteArtwork, uploadArtwork } from 'features/artwork';
import { toastError, toastInfo, toastSuccess, toastWarning } from 'features/toast';
import AdvancedFields from './advancedFields';
import Button from 'components/button';
import { CLOUD_URL } from 'index';
import PropTypes from 'prop-types';
import RenderArtwork from './renderArtwork';
import RenderReleaseField from './renderReleaseField';
import RenderTrackList from './renderTrackList';
import Spinner from 'components/spinner';
import Tags from './tags';
import { connect } from 'react-redux';
import { fetchRelease } from 'features/releases';
import { fetchXemPrice } from 'features/nem';
import { uploadAudio } from 'features/tracks';
import validate from './validate';
import { withRouter } from 'react-router-dom';

class EditRelease extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isEditing: false,
      isLoading: true,
      coverArtLoaded: false,
      coverArtPreview: false,
      showAdditionalInfo: false
    };

    this.artworkFile = null;
  }

  async componentDidMount() {
    window.scrollTo(0, 0);
    this.props.fetchXemPrice();
    const { releaseId } = this.props.match.params;

    if (releaseId) {
      this.setState({ isEditing: true });
      const { artwork } = this.props.release;
      await this.props.fetchRelease(releaseId);
      if (artwork?.status === 'stored') this.setState({ coverArtPreview: `${CLOUD_URL}/${releaseId}.jpg` });
      this.setState({ isLoading: false });
    } else {
      const res = await this.props.addNewRelease();

      // Check for address or credit issues.
      if (res?.warning) {
        this.props.toastWarning(res.warning);
        return this.props.history.push('/dashboard/nem-address');
      }

      this.setState({ isLoading: false });
    }
  }

  componentDidUpdate(prevProps) {
    const { _id: releaseId, artwork } = this.props.release;
    if (prevProps.release._id !== releaseId) {
      if (artwork?.status === 'stored') this.setState({ coverArtPreview: `${CLOUD_URL}/${releaseId}.jpg` });
      this.setState({ isLoading: false });
    }
  }

  async componentWillUnmount() {
    if (this.artworkFile) window.URL.revokeObjectURL(this.artworkFile.preview);
  }

  onDropArt = (accepted, rejected) => {
    if (rejected.length) {
      return this.props.toastError(
        'Upload rejected. Might be too large or formatted incorrectly. Needs to be a jpg or png under 20MB in size.'
      );
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
        return this.props.toastError(
          `Sorry, but your image must be at least 1000 pixels high and wide (this seems to be ${width}px by ${height}px). Please edit and re-upload.`
        );
      }

      this.setState({ coverArtPreview: image.src });
      this.props.uploadArtwork(releaseId, this.artworkFile, this.artworkFile.type);
    };
  };

  onSubmit = async values => {
    await this.props.updateRelease(values);
    const releaseTitle = this.props.release.releaseTitle;
    this.props.toastSuccess(`${releaseTitle ? `\u2018${releaseTitle}\u2019` : 'Release'} saved!`);
    this.props.history.push('/dashboard');
  };

  renderHeader() {
    const { isEditing } = this.state;
    const { releaseTitle } = this.props.release;
    if (isEditing && releaseTitle) return `Editing \u2018${releaseTitle}\u2019`;
    else if (isEditing) return 'Editing Release';
    return 'Add Release';
  }

  renderPriceFormText() {
    const { price, xemPriceUsd } = this.props;
    if (!xemPriceUsd) return;
    if (Number(price) === 0) return 'Name Your Price! Or \u2018free\u2019. Fans will still be able to donate.';
    if (price) return `Approximately ${(price / xemPriceUsd).toFixed(2)} XEM.`;
    return 'Set your price in USD (enter \u20180\u2019 for a \u2018Name Your Price\u2019 release).';
  }

  render() {
    const { formValues, invalid, pristine, submitting } = this.props;
    const { isEditing, isLoading } = this.state;

    const submitButton = (
      <div className="d-flex justify-content-end">
        <Button
          icon="check"
          type="button"
          disabled={invalid || pristine || submitting}
          onClick={this.props.handleSubmit(this.onSubmit)}
        >
          {isEditing ? 'Update Release' : 'Add Release'}
        </Button>
      </div>
    );

    if (isLoading) return <Spinner />;

    return (
      <main className="container">
        <div className="row">
          <div className="col mb-5">
            <form>
              <h2 className="text-center mt-4">{this.renderHeader()}</h2>
              {!isEditing ? (
                <p>Please enter your release info below. Artwork and audio will be saved instantly after uploading.</p>
              ) : null}
              <div className="row p-0">
                <div className="col-md mb-4">
                  <Field component={RenderReleaseField} label="Artist Name" name="artistName" required type="text" />
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
                    format={date => date?.split('T')[0]}
                    required
                    type="date"
                  />
                  <Field
                    component={RenderReleaseField}
                    formText={this.renderPriceFormText()}
                    label="Price (USD)"
                    name="price"
                    required
                    min={0}
                    type="number"
                  />
                  <Button
                    icon={this.state.showAdditionalInfo ? 'chevron-circle-up' : 'chevron-circle-down'}
                    onClick={() => this.setState({ showAdditionalInfo: !this.state.showAdditionalInfo })}
                    title="Show more release details."
                    size="small"
                    style={{ marginBottom: '1rem' }}
                    type="button"
                  >
                    {this.state.showAdditionalInfo ? 'Basic' : 'Advanced'}
                  </Button>
                  {this.state.showAdditionalInfo ? <AdvancedFields /> : null}
                </div>
                <div className="col-md mb-4">
                  <RenderArtwork
                    artworkFile={this.artworkFile}
                    onArtworkLoad={() => this.setState({ coverArtLoaded: true })}
                    coverArtLoaded={this.state.coverArtLoaded}
                    coverArtPreview={this.state.coverArtPreview}
                    handleDeletePreview={() => this.setState({ coverArtPreview: undefined })}
                    onDropArt={this.onDropArt}
                  />
                  {this.state.showAdditionalInfo ? <Tags change={this.props.change} tags={formValues.tags} /> : null}
                  {submitButton}
                </div>
              </div>
              <h3 className="track-list-title text-center">Track List</h3>
              <p>
                Upload formats supported: flac, aiff, wav (bit-depths greater than 24 will be truncated to 24-bit). All
                formats will be stored in flac format.
              </p>
              <p>You can drag and drop to reorder tracks.</p>
              <FieldArray
                change={this.props.change}
                component={RenderTrackList}
                name="trackList"
                onDropAudio={this.onDropAudio}
              />
              {submitButton}
            </form>
          </div>
        </div>
      </main>
    );
  }
}

const fieldSelector = formValueSelector('releaseForm');

const mapStateToProps = state => ({
  artworkUploading: state.artwork.artworkUploading,
  artworkUploadProgress: state.artwork.artworkUploadProgress,
  formValues: getFormValues('releaseForm')(state),
  initialValues: state.releases.activeRelease,
  price: Number(fieldSelector(state, 'price')),
  release: state.releases.activeRelease,
  xemPriceUsd: state.nem.xemPriceUsd
});

EditRelease.propTypes = {
  ...propTypes,
  addNewRelease: PropTypes.func,
  artworkUploading: PropTypes.bool,
  artworkUploadProgress: PropTypes.number,
  deleteArtwork: PropTypes.func,
  deleteRelease: PropTypes.func,
  fetchRelease: PropTypes.func,
  fetchXemPrice: PropTypes.func,
  history: PropTypes.object,
  match: PropTypes.object,
  price: PropTypes.number,
  publishStatus: PropTypes.func,
  release: PropTypes.object,
  toastError: PropTypes.func,
  toastInfo: PropTypes.func,
  toastWarning: PropTypes.func,
  toastSuccess: PropTypes.func,
  updateRelease: PropTypes.func,
  uploadArtwork: PropTypes.func,
  uploadAudio: PropTypes.func,
  xemPriceUsd: PropTypes.number
};

const WithForm = reduxForm({
  enableReinitialize: true,
  form: 'releaseForm',
  keepDirtyOnReinitialize: true,
  validate
})(EditRelease);

export default connect(mapStateToProps, {
  addNewRelease,
  deleteArtwork,
  deleteRelease,
  fetchRelease,
  fetchXemPrice,
  publishStatus,
  toastError,
  toastInfo,
  toastSuccess,
  toastWarning,
  updateRelease,
  uploadArtwork,
  uploadAudio
})(withRouter(WithForm));

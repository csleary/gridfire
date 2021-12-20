import React, { useEffect, useRef, useState } from 'react';
import { addNewRelease, updateRelease } from 'features/releases';
import { faCheck, faChevronDown, faChevronUp, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { toastError, toastSuccess, toastWarning } from 'features/toast';
import { useNavigate, useParams } from 'react-router-dom';
import AdvancedFields from './advancedFields';
import ArtistMenu from './artistMenu';
import Artwork from './artwork';
import Button from 'components/button';
import { CLOUD_URL } from 'index';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Helmet } from 'react-helmet';
import Input from 'components/input';
import Spinner from 'components/spinner';
import Tags from './tags';
import TrackList from './trackList';
import { fetchRelease } from 'features/releases';
import { fetchXemPrice } from 'features/nem';
import styles from './editRelease.module.css';
import { uploadArtwork } from 'features/artwork';
import validate from './validate';

const EditRelease = () => {
  const artworkFile = useRef();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { releaseId: releaseIdParam } = useParams();
  const { activeRelease: release, versions } = useSelector(state => state.releases, shallowEqual);
  const { xemPriceUsd } = useSelector(state => state.nem, shallowEqual);
  const [errors, setErrors] = useState({});
  const [coverArtPreview, setCoverArtPreview] = useState('');
  const [artworkIsLoaded, setArtworkIsLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPristine, setIsPristine] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showNewArtistName, setShowNewArtistName] = useState(false);
  const [values, setValues] = useState({ tags: [], trackList: [] });
  const { _id: releaseId, artistName, artwork, price, trackList, releaseTitle } = release;
  const hasErrors = Object.values(errors).some(error => Boolean(error));
  const artworkStatus = artwork?.status;

  useEffect(() => {
    if (releaseIdParam) {
      setIsEditing(true);
      dispatch(fetchRelease(releaseIdParam)).then(() => setIsLoading(false));
    } else {
      setIsEditing(false);
      dispatch(addNewRelease()).then(res => {
        if (res?.warning) {
          dispatch(toastWarning(res.warning));
          return navigate('/dashboard/nem-address');
        }
        setIsLoading(false);
      });
    }
  }, [releaseIdParam]);

  useEffect(() => {
    if (releaseId) setValues(release);
    if (artworkStatus === 'stored') return setCoverArtPreview(`${CLOUD_URL}/${releaseId}.jpg`);
    setCoverArtPreview();
  }, [artworkStatus, releaseId, releaseIdParam]);

  useEffect(() => {
    for (const updatedTrack of release.trackList) {
      setValues(current => ({
        ...current,
        trackList: current.trackList.map(currentTrack => {
          if (currentTrack._id === updatedTrack._id) return { ...currentTrack, status: updatedTrack.status };
          return currentTrack;
        })
      }));
    }
  }, [versions[releaseId]]);

  useEffect(() => {
    dispatch(fetchXemPrice());
    window.scrollTo(0, 0);

    return () => {
      if (artworkFile.current) window.URL.revokeObjectURL(artworkFile.current.preview);
    };
  }, []);

  const onDropArt = (accepted, rejected) => {
    if (rejected.length) {
      return dispatch(
        toastError(
          'Upload rejected. Might be too large or formatted incorrectly. Needs to be a jpg or png under 20MB in size.'
        )
      );
    }

    artworkFile.current = accepted[0];
    const image = new Image();
    image.src = window.URL.createObjectURL(artworkFile.current);
    let height;
    let width;

    image.onload = () => {
      height = image.height;
      width = image.width;

      if (height < 1000 || width < 1000) {
        return dispatch(
          toastError(
            `Sorry, but your image must be at least 1000 pixels high and wide (this seems to be ${width}px by ${height}px). Please edit and re-upload.`
          )
        );
      }

      setCoverArtPreview(image.src);
      dispatch(uploadArtwork(releaseId, artworkFile.current, artworkFile.current.type));
    };
  };

  const handleChange = (e, trackId) => {
    const { name, value } = e.target;
    setIsPristine(false);

    if (trackId) {
      const trackIndex = trackList.findIndex(({ _id }) => _id === trackId);
      const trackFieldName = `trackList.${trackIndex}.${name}`;
      setErrors(({ [trackFieldName]: excludedField, ...rest }) => rest); // eslint-disable-line

      return setValues(current => ({
        ...current,
        trackList: current.trackList.map(track => (track._id === trackId ? { ...track, [name]: value } : track))
      }));
    }

    setErrors(({ [name]: excludedField, ...rest }) => rest); // eslint-disable-line
    setValues(current => ({ ...current, [name]: value }));
  };

  const handleSubmit = async () => {
    const validationErrors = validate(values);
    if (Object.values(validationErrors).length) return setErrors(validationErrors);
    setIsSubmitting(true);
    dispatch(updateRelease({ releaseId, ...values })).then(() => {
      setIsSubmitting(false);
      setIsPristine(true);
      dispatch(toastSuccess(`${releaseTitle ? `\u2018${releaseTitle}\u2019` : 'Release'} saved!`));
      navigate('/dashboard');
    });
  };

  const submitButton = (
    <div className={styles.submit}>
      <Button icon={faCheck} type="button" disabled={hasErrors || isPristine || isSubmitting} onClick={handleSubmit}>
        {isEditing ? 'Update Release' : 'Add Release'}
      </Button>
    </div>
  );

  if (isLoading) return <Spinner />;

  return (
    <main className="container">
      <Helmet>
        <title>{isEditing ? 'Update Release' : 'Add Release'}</title>
        <meta
          name="description"
          content={isEditing ? 'Update your releases on nemp3.' : 'Add a new release to your nemp3 account.'}
        />
      </Helmet>
      <div className="row">
        <div className="col mb-5">
          <form>
            <h2 className={styles.heading}>
              {isEditing && releaseTitle
                ? `Editing \u2018${releaseTitle}\u2019`
                : isEditing
                ? 'Editing Release'
                : 'Add Release'}
            </h2>
            {!isEditing ? (
              <p>
                Please enter your release info below. Artwork and audio will be saved automatically after uploading.
              </p>
            ) : null}
            <div className="row p-0">
              <div className="col-md mb-4">
                {isEditing && artistName ? (
                  <h3>{artistName}</h3>
                ) : (
                  <ArtistMenu
                    error={errors.artist}
                    label="Artist Name"
                    name="artist"
                    onChange={e => {
                      setErrors(({ artist, artistName: excludedField, ...rest }) => rest); // eslint-disable-line
                      handleChange(e);
                    }}
                    setShowNewArtist={setShowNewArtistName}
                    showNewArtistName={showNewArtistName}
                    value={values.artist || ''}
                  />
                )}
                {showNewArtistName ? (
                  <Input
                    error={errors.artistName}
                    label="New artist name"
                    name="artistName"
                    onChange={e => {
                      setErrors(({ artist, artistName: excludedField, ...rest }) => rest); // eslint-disable-line
                      handleChange(e);
                    }}
                    required
                    type="text"
                    value={values.artistName || ''}
                  />
                ) : null}
                <Input
                  error={errors.releaseTitle}
                  label="Release Title"
                  name="releaseTitle"
                  onChange={handleChange}
                  required
                  type="text"
                  value={values.releaseTitle || ''}
                />
                <Input
                  error={errors.releaseDate}
                  hint="This won't affect the visibility of your release."
                  label="Release Date"
                  name="releaseDate"
                  onChange={handleChange}
                  required
                  type="date"
                  value={(values.releaseDate || new Date(Date.now()).toISOString()).split('T')[0]}
                />
                <Input
                  error={errors.price}
                  hint={
                    !xemPriceUsd
                      ? null
                      : Number(price) === 0
                      ? 'Name Your Price! Or \u2018free\u2019. Fans will still be able to donate.'
                      : price
                      ? `Approximately ${(price / xemPriceUsd).toFixed(2)} XEM.`
                      : 'Set your price in USD (enter \u20180\u2019 for a \u2018Name Your Price\u2019 release).'
                  }
                  label="Price (USD)"
                  name="price"
                  onChange={handleChange}
                  required
                  min={0}
                  type="number"
                  value={values.price || ''}
                />
                <Button
                  className={styles.showAdvanced}
                  icon={showAdvanced ? faChevronUp : faChevronDown}
                  onClick={() => setShowAdvanced(prev => !prev)}
                  title="Show more release details."
                  size="small"
                  type="button"
                >
                  {showAdvanced ? 'Basic' : 'Advanced'}
                </Button>
                {showAdvanced ? <AdvancedFields errors={errors} handleChange={handleChange} values={values} /> : null}
              </div>
              <div className="col-md mb-4">
                <Artwork
                  artworkFile={artworkFile.current}
                  onArtworkLoad={() => setArtworkIsLoaded(true)}
                  coverArtLoaded={artworkIsLoaded}
                  coverArtPreview={coverArtPreview}
                  handleDeletePreview={() => setCoverArtPreview()}
                  onDropArt={onDropArt}
                />
                {showAdvanced ? <Tags handleChange={handleChange} tags={values.tags || []} /> : null}
                {trackList.length > 5 ? submitButton : null}
              </div>
            </div>
            <h3 className={styles.trackListTitle}>Track List</h3>
            <p>Upload formats supported: flac, aiff, wav.</p>
            <TrackList errors={errors} handleChange={handleChange} setValues={setValues} values={values} />
            {submitButton}
            {hasErrors ? (
              <div className={styles.error}>
                <FontAwesomeIcon className={styles.icon} icon={faExclamationTriangle} />
                Please address the errors before saving.
              </div>
            ) : null}
          </form>
        </div>
      </div>
    </main>
  );
};

export default EditRelease;

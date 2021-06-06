import React, { useEffect } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import Dropdown from 'components/dropdown';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PropTypes from 'prop-types';
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import { fetchArtists } from 'features/artists';
import styles from './artistMenu.module.css';

const ArtistMenu = ({ error, label, name, onChange, setShowNewArtist, showNewArtistName, value }) => {
  const dispatch = useDispatch();
  const { artists, isLoading } = useSelector(state => state.artists, shallowEqual);
  const artistCount = artists?.length;
  const selectedArtist = artists?.find(({ _id: artistId }) => value === artistId);
  const defaultLabel = showNewArtistName ? 'New artist' : 'Select an artist…';

  useEffect(() => {
    dispatch(fetchArtists());
  }, [dispatch]);

  useEffect(() => {
    if (!isLoading && !artistCount && !showNewArtistName) {
      setShowNewArtist(true);
    }
  }, [artistCount, isLoading, setShowNewArtist, showNewArtistName]);

  return (
    <fieldset className={styles.field}>
      <label htmlFor={name}>{label}</label>
      <Dropdown
        className={styles.select}
        closeOnClick
        containerClassName={styles.container}
        dropdownClassName={styles.dropdown}
        fullWidth
        id={name}
        text={showNewArtistName ? defaultLabel : selectedArtist?.name || defaultLabel}
      >
        {artists.map(artist => (
          <li className={styles.listItem} key={artist._id}>
            <button
              className={styles.artist}
              onClick={() => {
                onChange({ target: { name, value: artist._id } });
                if (showNewArtistName) setShowNewArtist(false);
              }}
            >
              {artist.name}
            </button>
          </li>
        ))}
        <li className={styles.create} key={'create'}>
          <button
            className={styles.artist}
            onClick={() => {
              onChange({ target: { name, value: null } });
              setShowNewArtist(true);
            }}
          >
            <FontAwesomeIcon icon={faPlusCircle} className="mr-2" />
            Create new artist…
          </button>
        </li>
      </Dropdown>
      {error ? <div className={styles.error}>{error}</div> : null}
    </fieldset>
  );
};

ArtistMenu.propTypes = {
  error: PropTypes.string,
  label: PropTypes.string,
  name: PropTypes.string,
  onChange: PropTypes.func,
  setShowNewArtist: PropTypes.func,
  showNewArtistName: PropTypes.bool,
  value: PropTypes.string
};

export default ArtistMenu;

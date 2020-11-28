import React, { useEffect } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import Dropdown from 'components/dropdown';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import { fetchArtists } from 'features/artists';
import styles from './artistMenu.module.css';

const ArtistMenu = field => {
  const {
    input: { name, value, onChange },
    label,
    meta: { touched, error },
    setShowNewArtist,
    showNewArtistName
  } = field;

  const dispatch = useDispatch();
  const { artists } = useSelector(state => state.artists, shallowEqual);
  const artistCount = artists?.length;
  const selectedArtist = artists?.find(({ _id: artistId }) => value === artistId);
  const defaultLabel = showNewArtistName ? 'New artist' : 'Select an artist…';

  useEffect(() => {
    dispatch(fetchArtists()).then(() => {
      if (!artistCount) {
        setShowNewArtist(true);
      }
    });
  }, [artistCount, dispatch, setShowNewArtist]);

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
        text={selectedArtist?.name || defaultLabel}
      >
        {artists.map(artist => (
          <li className={styles.listItem} key={artist._id}>
            <button
              className={styles.artist}
              onClick={() => {
                onChange(artist._id);
                if (showNewArtistName) setShowNewArtist(false);
              }}
            >
              {artist.name}
            </button>
          </li>
        ))}
        <li className={styles.create} key={'create'}>
          <button className={styles.artist} onClick={() => setShowNewArtist(true)}>
            <FontAwesomeIcon icon={faPlusCircle} className="mr-2" />
            Create new artist…
          </button>
        </li>
      </Dropdown>
      {touched && error ? <div className="invalid-feedback">{error}</div> : null}
    </fieldset>
  );
};

export default ArtistMenu;

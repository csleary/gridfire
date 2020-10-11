import React, { useEffect } from 'react';
import { addLink, fetchArtists, removeLink, setActiveArtistId, setErrors, setValues,updateArtist } from 'features/artists';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import Button from 'components/button';
import classnames from 'classnames';
import styles from './artists.module.css';

const Artists = () => {
  const dispatch = useDispatch();
  const { activeArtistId, artists, errors, isLoading, isSubmitting, } = useSelector(
    state => state.artists,
    shallowEqual
  );
  const activeArtist = artists.find(artist => artist._id === activeArtistId);
  const charsRemaining = 2000 - (activeArtist?.biography?.length ?? 0);

  useEffect(() => {
    dispatch(fetchArtists());
  }, [dispatch]);

  const handleChange = e => {
    const { name, value } = e.target;

    if (name === 'biography' && value.length > 2000) {
      return dispatch(setErrors({ name, value: 'Please keep your biography to under 2000 characters.' }));
    }

    dispatch(setValues({ artistId: activeArtistId, name, value }));
    dispatch(setErrors({ name, value: '' }));
  };

  const handleSubmit = async () => {
    dispatch(updateArtist(activeArtist));
  };

  
  return (
    <main className="container">
      <div className="row">
        <div className="col mb-5">
          <h2 className={styles.heading}>Artists</h2>
          <p>Select an artist to edit their details:</p>
          <ul className={styles.list}>
            {artists.map(artist => {
              const artistNameClassName = classnames({[styles.active]: artist._id === activeArtistId});

              return (
                <li key={artist._id}>
                  <Button className={artistNameClassName} onClick={() => dispatch(setActiveArtistId(artist._id))} textLink text={artist.name} />
                </li>
              );
            })}
          </ul>
          {activeArtist ? (
            <div>
              <h3 className={styles.heading}>{activeArtist.name}</h3>
              <fieldset className={styles.fields}>
                <label htmlFor="biography">Biography</label>
                <textarea
                  className={styles.biography}
                  name="biography"
                  onChange={handleChange}
                  type="text"
                  value={activeArtist.biography || ''}
                />
                <div className={classnames(styles.charCount, { [styles.minReached]: !charsRemaining })}>{`${charsRemaining} character${charsRemaining === 1 ? '' : 's'} remaining`}</div>
                {errors.biography ? <div className={styles.error}>{errors.biography}</div> : null}
              </fieldset>
              <h4>Links</h4>
              {activeArtist.links?.map(({_id: linkId, title, uri}) => (
                <fieldset className={styles.links} key={linkId}>
                  <div className={styles.link}>
                    <label className={styles.linkLabel} htmlFor={`${linkId}.title`}>Title</label>
                    <input className={styles.linkInput} name={`${linkId}.title`} onChange={handleChange} type="text" value={title} />
                  </div>
                  <div className={styles.link}>
                    <label  className={styles.linkLabel} htmlFor={`${linkId}.uri`}>URL</label>
                    <input className={styles.linkInput} name={`${linkId}.uri`} onChange={handleChange} type="text" value={uri} />
                  </div>
                  <Button
                  className={styles.linkRemove}
                    icon="minus-circle"
                    onClick={() => dispatch(removeLink({ artistId: activeArtistId, linkId }))}
                    title="Remove link"
                    size="small"
                    type="button"
                  >
                    Remove
                  </Button>
                </fieldset>
              ))}
              <Button
                icon="plus-circle"
                onClick={() => dispatch(addLink(activeArtistId))}
                title="Add a link"
                size="small"
                type="button"
              >
                Add a link
              </Button>
              <div className={styles.submit}>
                <Button disabled={isSubmitting} icon="check" type="button" onClick={handleSubmit}>
                  Save
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
};

export default Artists;

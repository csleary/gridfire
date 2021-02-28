import React, { useEffect, useState } from 'react';
import {
  addLink,
  fetchArtists,
  removeLink,
  setActiveArtistId,
  setErrors,
  setIsLoading,
  setIsPristine,
  setValues,
  updateArtist
} from 'features/artists';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import Button from 'components/button';
import Spinner from 'components/spinner';
import classnames from 'classnames';
import styles from './artists.module.css';
import { useHistory } from 'react-router-dom';
import { faCheck, faLink, faMinusCircle, faPlusCircle } from '@fortawesome/free-solid-svg-icons';

const Artists = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const { activeArtistId, artists, errors, isLoading, isPristine, isSubmitting } = useSelector(
    state => state.artists,
    shallowEqual
  );
  const [isAddingLink, setIsAddingLink] = useState(false);
  const activeArtist = artists.find(artist => artist._id === activeArtistId);
  const charsRemaining = 2000 - (activeArtist?.biography?.length ?? 0);

  useEffect(() => {
    if (!artists.length) dispatch(setIsLoading(true));
  }, []); // eslint-disable-line

  useEffect(() => {
    dispatch(fetchArtists()).then(() => dispatch(setIsLoading(false)));
  }, []); // eslint-disable-line

  const handleChange = e => {
    dispatch(setIsPristine(false));
    const { name, value } = e.target;

    if (name === 'biography' && value.length > 2000) {
      return dispatch(setErrors({ name, value: 'Please keep your biography to under 2000 characters.' }));
    }

    if ((name.endsWith('title') || name.endsWith('uri')) && value.length > 200) {
      return dispatch(setErrors({ name: 'links', value: 'Please keep your links to under 200 characters.' }));
    }

    dispatch(setValues({ artistId: activeArtistId, name, value }));
    dispatch(setErrors());
  };

  const handleSubmit = async () => {
    dispatch(updateArtist(activeArtist));
  };

  const handleAddLink = async () => {
    if (activeArtist.links?.length === 10) {
      setIsAddingLink(false);
      return dispatch(setErrors({ name: 'links', value: 'You can have a maximum of ten links.' }));
    }

    setIsAddingLink(true);
    await dispatch(addLink(activeArtistId));
    setIsAddingLink(false);
    dispatch(setErrors({ name: 'links', value: '' }));
  };

  if (isLoading) return <Spinner />;

  return (
    <main className="container">
      <div className="row">
        <div className="col mb-5">
          <h2 className={styles.heading}>Artists</h2>
          {artists.length > 1 ? (
            <>
              <p>Select an artist to edit their details:</p>
              <ul className={styles.list}>
                {artists.map(artist => {
                  const artistNameClassNames = classnames(styles.artistName, {
                    [styles.active]: artist._id === activeArtistId
                  });

                  return (
                    <li key={artist._id}>
                      <Button
                        className={artistNameClassNames}
                        onClick={() => dispatch(setActiveArtistId(artist._id))}
                        textLink
                        text={artist.name}
                      />
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}
          {activeArtist ? (
            <>
              <h3 className={styles.heading}>{activeArtist.name}</h3>
              <section className={styles.section}>
                <h5 className={styles.h5}>
                  Artist Name
                  <Button
                    className={styles.artistLink}
                    icon={faLink}
                    onClick={() =>
                      history.push(activeArtist.slug ? `/${activeArtist.slug}` : `/artist/${activeArtistId}`)
                    }
                    title="Visit artist page."
                    size="small"
                    type="button"
                  >
                    Visit page
                  </Button>
                </h5>
                <p>Rename your artist or set a unique URL stem for your artist page.</p>
                <fieldset className={styles.fields}>
                  <div className={styles.names}>
                    <div className={styles.name}>
                      <label className={styles.label} htmlFor={'name'}>
                        Name
                      </label>
                      <input
                        className={styles.nameInput}
                        name={'name'}
                        onChange={handleChange}
                        type="text"
                        value={activeArtist?.name || ''}
                      />
                    </div>
                    <div className={styles.slug}>
                      <label className={styles.label} htmlFor={'slug'}>
                        URL Slug
                      </label>
                      <div className={styles.field}>
                        <input
                          className={styles.nameInput}
                          name={'slug'}
                          onChange={handleChange}
                          type="text"
                          value={activeArtist?.slug || ''}
                        />
                        {errors.slug ? (
                          <div className={styles.error}>{errors.slug}</div>
                        ) : (
                          <div className={styles.hint}>Alphanumerics and dashes only.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </fieldset>
              </section>
              <section className={styles.section}>
                <fieldset className={styles.fields}>
                  <label className={styles.label} htmlFor="biography">
                    <h5 className={styles.h5}>Biography</h5>
                  </label>
                  <textarea
                    className={styles.biography}
                    name="biography"
                    onChange={handleChange}
                    type="text"
                    value={activeArtist.biography || ''}
                  />
                  <div
                    className={classnames(styles.charCount, { [styles.minReached]: !charsRemaining })}
                  >{`${charsRemaining} character${charsRemaining === 1 ? '' : 's'} remaining`}</div>
                  {errors.biography ? <div className={styles.error}>{errors.biography}</div> : null}
                </fieldset>
              </section>
              <section className={styles.section}>
                <h5 className={styles.h5}>Links</h5>
                {activeArtist.links?.map(({ _id: linkId, title, uri }) => (
                  <fieldset className={styles.links} key={linkId}>
                    <div className={styles.link}>
                      <label className={styles.label} htmlFor={`${linkId}.title`}>
                        Text
                      </label>
                      <input
                        className={styles.linkInput}
                        name={`${linkId}.title`}
                        onChange={handleChange}
                        type="text"
                        value={title}
                      />
                    </div>
                    <div className={styles.link}>
                      <label className={styles.label} htmlFor={`${linkId}.uri`}>
                        URL
                      </label>
                      <input
                        className={styles.linkInput}
                        name={`${linkId}.uri`}
                        onChange={handleChange}
                        type="text"
                        value={uri}
                      />
                    </div>
                    <Button
                      className={styles.linkRemove}
                      icon={faMinusCircle}
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
                  className={styles.linkAdd}
                  disabled={isAddingLink}
                  icon={faPlusCircle}
                  onClick={() => handleAddLink()}
                  title="Add a link"
                  size="small"
                  type="button"
                >
                  Add a link
                </Button>
                {errors.links ? (
                  <div className={styles.error}>{errors.links}</div>
                ) : (
                  <div className={styles.hint}>10 max.</div>
                )}
              </section>
              <div className={styles.submit}>
                <Button disabled={isSubmitting || isPristine} icon={faCheck} type="button" onClick={handleSubmit}>
                  Save
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
};

export default Artists;

import React, { useState } from 'react';
import Button from 'components/button';
import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import { nanoid } from '@reduxjs/toolkit';
import styles from './tags.module.css';
const NUM_MAX_CHARS = 30;
const NUM_MAX_TAGS = 20;

const Tags = ({ change, tags }) => {
  const [tagsInput, setTagsInput] = useState('');
  const [tagsError, setTagsError] = useState('');

  const handleTagsInput = event => {
    const { value } = event.target;
    if (value.length >= NUM_MAX_CHARS) return setTagsError(`Tag character limit (${NUM_MAX_CHARS}) reached!`);
    if (tags.length >= NUM_MAX_TAGS) return setTagsError(`Max limit of ${NUM_MAX_TAGS} tags reached.`);
    setTagsInput(value);
    setTagsError('');
  };

  const handleKeyPress = ({ key }) => {
    if (key === 'Enter') {
      const tag = tagsInput
        .replace(/[^0-9a-z\s]/gi, '')
        .trim()
        .toLowerCase();

      if (!tag.length) return;
      const update = [...tags, tag];
      change('tags', update);
      setTagsError('');
      setTagsInput('');
    }
  };

  const handleRemoveTag = indexToDelete => {
    const update = tags.filter((tag, index) => index !== indexToDelete);
    change('tags', update);
    if (tags.length <= 20) setTagsInput('');
  };

  const handleClearTags = () => {
    change('tags', []);
    setTagsInput('');
    setTagsError('');
  };

  return (
    <div className={styles.tags}>
      <div className="form-group">
        <label htmlFor="tagsInput">
          Add Tags
          <Button
            className={styles.clear}
            disabled={!tags.length}
            onClick={handleClearTags}
            textLink
            title={'Remove all currently set tags.'}
            type="button"
          >
            Clear All
          </Button>
        </label>
        <p>
          {tagsInput.length
            ? `Hit return to tag your release with \u2018${tagsInput}\u2019.`
            : 'Enter a tag for your release below:'}
        </p>
        <input
          className="form-control"
          id="tagsInput"
          onChange={handleTagsInput}
          onKeyPress={handleKeyPress}
          type="text"
          value={tagsInput}
        />
        <small className="form-text text-muted">
          e.g. Genres, styles, prominent instruments, or guest artists, remixers, conductors etc.
          <br />
          {NUM_MAX_TAGS} tag max, {NUM_MAX_CHARS} characters per tag.
        </small>
        <div className="invalid-feedback">{tagsError ? tagsError : null}</div>
      </div>
      {tags?.length ? (
        <p>Tags set so far…</p>
      ) : (
        <p>
          No tags currently set for this release. We strongly recommend setting some tags as they are indexed for
          searching.
        </p>
      )}
      {tags?.map((tag, index) => (
        <div
          className={styles.tag}
          key={nanoid()}
          onClick={() => handleRemoveTag(index)}
          role="button"
          tabIndex="-1"
          title={`Click to delete \u2018${tag}\u2019.`}
        >
          {tag}
          <FontAwesome className={styles.remove} name="times" />
        </div>
      ))}
    </div>
  );
};

Tags.propTypes = {
  change: PropTypes.func,
  tags: PropTypes.array
};

export default Tags;

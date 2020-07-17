import React, { useState } from 'react';
import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import { nanoid } from '@reduxjs/toolkit';

const Tags = ({ change, tags }) => {
  const [tagsInput, setTagsInput] = useState();
  const [tagsError, setTagsError] = useState();

  const handleTagsInput = event => {
    const { value } = event.target;
    if (tags.length >= 20) return setTagsError('Tag limit reached!');

    if (event.key === 'Enter') {
      const tag = value
        .replace(/[^0-9a-z\s]/gi, '')
        .trim()
        .toLowerCase();

      if (!tag.length) return;
      const update = [...tags, tag];
      change('tags', update);
      setTagsError('');
      setTagsInput('');
    }

    setTagsInput(value);
  };

  const handleRemoveTag = indexToDelete => {
    const update = tags.filter((tag, index) => index !== indexToDelete);
    change('tags', update);
    if (tags.length <= 20) setTagsInput('');
  };

  const handleClearTags = () => {
    change('tags', []);
    setTagsInput('');
  };

  return (
    <div className="tags mb-4">
      <div className="form-group">
        <label htmlFor="tagsInput">
          Add Tags
          <button
            className="btn btn-outline-primary btn-sm clear-tags px-1 ml-2"
            onClick={handleClearTags}
            title="Remove all currently set tags."
            type="button"
          >
            Clear All
          </button>
        </label>
        <input
          className="form-control"
          id="tagsInput"
          disabled={tagsError}
          onChange={handleTagsInput}
          onKeyPress={handleTagsInput}
          type="text"
          value={tagsInput}
        />
        <small className="form-text text-muted">
          e.g. Genres, styles, prominent instruments, or guest artists, remixers, conductors etc. 20 tag max.
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
          className="tag mr-2 mb-2"
          key={nanoid()}
          onClick={() => handleRemoveTag(index)}
          role="button"
          tabIndex="-1"
          title={`Click to delete \u2018${tag}\u2019.`}
        >
          {tag}
          <FontAwesome className="ml-2 remove-tag" name="times" />
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

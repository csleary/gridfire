const validate = ({ artistName, price, releaseDate, releaseTitle, trackList }) => {
  const errors = {};
  if (!artistName) errors.artistName = 'Please enter an artist name.';
  if (!releaseTitle) errors.releaseTitle = 'Please enter a release title.';
  if (!releaseDate) errors.releaseDate = 'Please enter a release date.';
  if (!price && price !== 0) errors.price = 'Please enter a price.';
  if (price && price < 0) errors.price = 'Price must be a positive number.';

  if (trackList) {
    const trackListErrors = [];
    trackList.forEach((track, trackIndex) => {
      const trackErrors = {};

      if (!track.trackTitle || !track.trackTitle.trim()) {
        trackErrors.trackTitle =
          'Please either enter a track title (with \u2018Untitled\u2019 for tracks with no title), or remove it from the list.';
        trackListErrors[trackIndex] = trackErrors;
      }
    });

    if (trackListErrors.length) errors.trackList = trackListErrors;
  }
  return errors;
};

export default validate;

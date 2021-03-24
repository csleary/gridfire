const validate = ({ artist, artistName, price, releaseDate, releaseTitle, trackList }) => {
  const errors = {};
  if (!artistName && !artist) errors.artist = 'Please select an artist for this release.';
  if (!releaseTitle) errors.releaseTitle = 'Please enter a release title.';
  if (!releaseDate) errors.releaseDate = 'Please enter a release date.';
  if (price === null || price === undefined) errors.price = 'Please enter a price.';
  if (price && price < 0) errors.price = 'Price must be a positive number.';

  if (trackList) {
    trackList.forEach((track, trackIndex) => {
      if (!track.trackTitle || !track.trackTitle.trim()) {
        errors[`trackList.${trackIndex}.trackTitle`] = 'Please enter a track title.';
      }
    });
  }
  return errors;
};

export default validate;

import { ReleaseTrack, TrackErrors } from "types";

interface ReleaseForValidation {
  artist: string;
  artistName: string;
  price: string;
  releaseDate: string;
  releaseTitle: string;
  trackList: Array<ReleaseTrack>;
}

const validate = ({ artist, artistName, price, releaseDate, releaseTitle, trackList = [] }: ReleaseForValidation) => {
  const errors = { artistName: "", releaseTitle: "", releaseDate: "", price: "" };
  if (!artist && !artistName) errors.artistName = "Please select or enter an artist name.";
  if (!releaseTitle) errors.releaseTitle = "Please enter a release title.";
  if (!releaseDate) errors.releaseDate = "Please enter a release date.";
  if (price === null || price === undefined) errors.price = "Please enter a price.";
  if (price && Number(price) < 0) errors.price = "Price must be a positive number.";

  const trackErrors = {} as TrackErrors;

  trackList.forEach(({ _id: trackId, trackTitle }) => {
    if (!trackTitle?.trim()) {
      trackErrors[`${trackId}.trackTitle`] = "Please enter a track title.";
    }
  });

  return [errors, trackErrors];
};

export default validate;

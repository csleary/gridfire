import {
  ADD_RELEASE,
  ADD_TRACK,
  ADD_TRACK_LOADING,
  DELETE_ARTWORK,
  DELETE_RELEASE,
  DELETE_TRACK,
  DELETE_TRACK_LOADING,
  FETCH_ARTIST_CATALOGUE,
  FETCH_AUDIO_UPLOAD_URL,
  FETCH_CATALOGUE,
  FETCH_COLLECTION,
  FETCH_RELEASE,
  FETCH_USER_RELEASE,
  FETCH_USER_RELEASES,
  MOVE_TRACK,
  PUBLISH_STATUS,
  PURCHASE_RELEASE,
  UPDATE_RELEASE,
  UPLOAD_ARTWORK,
  UPLOAD_ARTWORK_PROGRESS
} from '../actions/types';

const initialState = {
  artistName: '',
  artworkUploading: false,
  artworkUploadProgress: 0,
  isAddingTrack: false,
  isDeletingTrack: false,
  isLoading: false,
  catalogue: [],
  collection: [],
  paymentAddress: '',
  priceInXem: '',
  selectedRelease: false,
  userReleases: []
};

export default (state = initialState, action) => {
  const { type, payload } = action;
  switch (type) {
    case ADD_RELEASE:
    case DELETE_ARTWORK:
    case FETCH_RELEASE:
    case FETCH_USER_RELEASE:
    case MOVE_TRACK:
    case UPDATE_RELEASE:
      return {
        ...state,
        selectedRelease: payload
      };
    case ADD_TRACK:
      return {
        ...state,
        isAddingTrack: false,
        selectedRelease: payload
      };
    case ADD_TRACK_LOADING:
      return {
        ...state,
        isAddingTrack: action.isAddingTrack
      };
    case DELETE_TRACK:
      return {
        ...state,
        isDeletingTrack: false,
        selectedRelease: payload
      };
    case DELETE_TRACK_LOADING:
      return {
        ...state,
        isDeletingTrack: action.isDeletingTrack
      };
    case DELETE_RELEASE:
      if (state.userReleases) {
        return {
          ...state,
          userReleases: state.userReleases.filter(
            release => release._id !== payload
          )
        };
      }
      return { ...state };
    case FETCH_ARTIST_CATALOGUE:
      return {
        ...state,
        artistName: payload.artistName,
        catalogue: payload.releases
      };
    case FETCH_AUDIO_UPLOAD_URL:
      return {
        ...state,
        audioUploadUrl: payload
      };
    case FETCH_CATALOGUE:
      return {
        ...state,
        catalogue: payload
      };
    case FETCH_COLLECTION:
      return {
        ...state,
        collection: payload
      };
    case FETCH_USER_RELEASES:
      return {
        ...state,
        isLoading: action.isLoading,
        userReleases: payload
      };
    case PUBLISH_STATUS:
      return {
        ...state,
        isLoading: action.isLoading,
        userReleases: state.userReleases.map(release => {
          if (release._id === payload._id) return payload;
          return release;
        })
      };
    case PURCHASE_RELEASE:
      return {
        ...state,
        selectedRelease: payload.release,
        paymentAddress: payload.paymentInfo.paymentAddress,
        paymentHash: payload.paymentInfo.paymentHash,
        priceInXem: payload.price
      };
    case UPLOAD_ARTWORK:
      return {
        ...state,
        artworkUploading: payload
      };
    case UPLOAD_ARTWORK_PROGRESS:
      return {
        ...state,
        artworkUploadProgress: payload
      };
    default:
      return state;
  }
};

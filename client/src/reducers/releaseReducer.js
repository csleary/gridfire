import {
  ADD_RELEASE,
  ADD_TRACK,
  DELETE_ARTWORK,
  DELETE_RELEASE,
  DELETE_TRACK,
  FETCH_ARTWORK_UPLOAD_URL,
  FETCH_AUDIO_UPLOAD_URL,
  FETCH_CATALOGUE,
  FETCH_RELEASE,
  FETCH_USER_RELEASE,
  FETCH_USER_RELEASES,
  MOVE_TRACK,
  PUBLISH_STATUS,
  PURCHASE_RELEASE,
  TRANSCODE_AUDIO_STARTED,
  TRANSCODE_AUDIO_FINISHED,
  UPDATE_RELEASE
} from '../actions/types';

const initialState = {
  isLoading: false,
  catalogue: [],
  paymentAddress: '',
  selectedRelease: false,
  userReleases: []
};

export default (state = initialState, action) => {
  switch (action.type) {
    case ADD_RELEASE:
      return {
        ...state,
        selectedRelease: action.payload
      };
    case ADD_TRACK:
      return {
        ...state,
        selectedRelease: action.payload
      };
    case DELETE_ARTWORK:
      return {
        ...state,
        selectedRelease: action.payload
      };
    case DELETE_RELEASE:
      return {
        ...state,
        userReleases: state.userReleases.filter(
          release => release._id !== action.payload
        )
      };
    case DELETE_TRACK:
      return {
        ...state,
        selectedRelease: action.payload
      };
    case FETCH_ARTWORK_UPLOAD_URL:
      return {
        ...state,
        artworkUploadUrl: action.payload
      };
    case FETCH_AUDIO_UPLOAD_URL:
      return {
        ...state,
        audioUploadUrl: action.payload
      };
    case FETCH_CATALOGUE:
      return {
        ...state,
        catalogue: action.payload
      };
    case FETCH_RELEASE:
      return {
        ...state,
        selectedRelease: action.payload
      };
    case FETCH_USER_RELEASE:
      return {
        ...state,
        selectedRelease: action.payload
      };
    case FETCH_USER_RELEASES:
      return {
        ...state,
        isLoading: action.isLoading,
        userReleases: action.payload
      };
    case MOVE_TRACK:
      return {
        ...state,
        selectedRelease: action.payload
      };
    case PUBLISH_STATUS:
      return {
        ...state,
        isLoading: action.isLoading,
        userReleases: state.userReleases.map((release) => {
          if (release._id === action.payload._id) return action.payload;
          return release;
        })
      };
    case PURCHASE_RELEASE:
      return {
        ...state,
        selectedRelease: action.payload,
        paymentAddress: action.paymentAddress,
        paymentHash: action.paymentHash
      };
    case TRANSCODE_AUDIO_STARTED:
      return {
        ...state,
        transcoding: true
      };
    case TRANSCODE_AUDIO_FINISHED:
      return {
        ...state,
        transcoding: false
      };
    case UPDATE_RELEASE:
      return {
        ...state,
        selectedRelease: action.payload
      };
    default:
      return state;
  }
};

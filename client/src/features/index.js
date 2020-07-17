import artworkSlice from 'features/artwork';
import { combineReducers } from 'redux';
import { reducer as formReducer } from 'redux-form';
import nemSlice from 'features/nem';
import playerSlice from 'features/player';
import releaseSlice from 'features/releases';
import searchSlice from 'features/search';
import toastSlice from 'features/toast';
import trackSlice from 'features/tracks';
import userSlice from 'features/user';

const appReducer = combineReducers({
  artwork: artworkSlice,
  form: formReducer,
  nem: nemSlice,
  player: playerSlice,
  releases: releaseSlice,
  search: searchSlice,
  toast: toastSlice,
  tracks: trackSlice,
  user: userSlice
});

const rootReducer = (state, action) => {
  if (action.type === 'user/logOut') {
    state = undefined;
  }

  return appReducer(state, action);
};

export default rootReducer;

import artistSlice from "state/artists";
import artworkSlice from "state/artwork";
import { combineReducers } from "redux";
import playerSlice from "state/player";
import releaseSlice from "state/releases";
import searchSlice from "state/search";
import trackSlice from "state/tracks";
import userSlice from "state/user";
import web3Slice from "state/web3";

const appReducer = combineReducers({
  artists: artistSlice,
  artwork: artworkSlice,
  player: playerSlice,
  releases: releaseSlice,
  search: searchSlice,
  tracks: trackSlice,
  user: userSlice,
  web3: web3Slice
});

const rootReducer = (state, action) => {
  if (action.type === "user/logOut") {
    state.user = undefined;
  }

  return appReducer(state, action);
};

export default rootReducer;

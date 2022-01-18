import artistSlice from "features/artists";
import artworkSlice from "features/artwork";
import { combineReducers } from "redux";
import paymentSlice from "features/payment";
import playerSlice from "features/player";
import releaseSlice from "features/releases";
import searchSlice from "features/search";
import trackSlice from "features/tracks";
import userSlice from "features/user";
import web3Slice from "features/web3";

const appReducer = combineReducers({
  artists: artistSlice,
  artwork: artworkSlice,
  payment: paymentSlice,
  player: playerSlice,
  releases: releaseSlice,
  search: searchSlice,
  tracks: trackSlice,
  user: userSlice,
  web3: web3Slice
});

const rootReducer = (state, action) => {
  if (action.type === "user/logOut") {
    state = undefined;
  }

  return appReducer(state, action);
};

export default rootReducer;

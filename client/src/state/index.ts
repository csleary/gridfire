import artists from "state/artists";
import artwork from "state/artwork";
import { combineReducers } from "redux";
import editor from "state/editor";
import player from "state/player";
import releases from "state/releases";
import search from "state/search";
import tracks from "state/tracks";
import user from "state/user";
import web3 from "state/web3";

const rootReducer = combineReducers({
  artists,
  artwork,
  editor,
  player,
  releases,
  search,
  tracks,
  user,
  web3
});

export default rootReducer;

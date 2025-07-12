import { combineReducers } from "redux";

import artists from "@/state/artists";
import artwork from "@/state/artwork";
import editor from "@/state/editor";
import { logsApi } from "@/state/logs";
import player from "@/state/player";
import releases from "@/state/releases";
import search from "@/state/search";
import tracks from "@/state/tracks";
import user from "@/state/user";
import web3 from "@/state/web3";

const rootReducer = combineReducers({
  artists,
  artwork,
  editor,
  [logsApi.reducerPath]: logsApi.reducer,
  player,
  releases,
  search,
  tracks,
  user,
  web3
});

export default rootReducer;

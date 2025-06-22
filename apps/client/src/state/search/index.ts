import { AppDispatch } from "index";
import axios from "axios";
import { createSlice } from "@reduxjs/toolkit";
import { Release } from "types";

interface SearchState {
  isSearching: boolean;
  searchQuery: string;
  searchResults: Release[];
}

const initialState: SearchState = {
  isSearching: false,
  searchQuery: "",
  searchResults: []
};

const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    clearResults(state) {
      state.searchResults = [];
      state.searchQuery = "";
    },
    setSearchResults(state, action) {
      state.searchResults = action.payload;
    },
    setSearching(state, action) {
      state.isSearching = action.payload.isSearching;
      state.searchQuery = action.payload.searchQuery;
    }
  }
});

const searchReleases = (searchQuery: string) => async (dispatch: AppDispatch) => {
  dispatch(setSearching({ isSearching: true, searchQuery }));

  const params = searchQuery
    .trim()
    .split(",")
    .reduce((prev, current) => {
      let [key, value] = current.split(":");
      key = key?.trim().toLowerCase();
      value = value?.trim();

      if (["artist", "cat", "label", "price", "tag", "title", "track", "year"].includes(key)) {
        return { ...prev, [key]: value };
      }

      return { ...prev, text: current.trim() };
    }, {});

  const res = await axios.get("/api/catalogue/search", { params });
  dispatch(setSearchResults(res.data));
  dispatch(setSearching({ isSearching: false, searchQuery }));
  return res;
};

export const { clearResults, setSearching, setSearchResults } = searchSlice.actions;
export { searchReleases };
export default searchSlice.reducer;

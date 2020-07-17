import axios from 'axios';
import { createSlice } from '@reduxjs/toolkit';

const searchSlice = createSlice({
  name: 'search',
  initialState: {
    isSearching: false,
    searchQuery: '',
    searchResults: []
  },
  reducers: {
    clearResults(state) {
      state.searchResults = [];
      state.searchQuery = '';
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

const searchReleases = searchQuery => async dispatch => {
  dispatch(setSearching({ isSearching: true, searchQuery }));
  const res = await axios.get('/api/search', { params: { searchQuery } });
  dispatch(setSearchResults(res.data));
  dispatch(setSearching({ isSearching: false, searchQuery }));
  return res;
};

export const { clearResults, setSearching, setSearchResults } = searchSlice.actions;
export { searchReleases };
export default searchSlice.reducer;

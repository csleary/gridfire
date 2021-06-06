import axios from 'axios';
import { batch } from 'react-redux';
import { createSlice } from '@reduxjs/toolkit';
import { setActiveRelease } from 'features/releases';
import { toastError } from 'features/toast';

const artworkSlice = createSlice({
  name: 'artwork',
  initialState: {
    artworkUploading: false,
    artworkUploadProgress: 0
  },
  reducers: {
    setArtworkUploading(state, action) {
      state.artworkUploading = action.payload;
    },

    setArtworkUploadProgress(state, action) {
      state.artworkUploadProgress = action.payload;
    }
  }
});

const deleteArtwork = releaseId => async dispatch => {
  try {
    const res = await axios.delete(`/api/artwork/${releaseId}`);
    dispatch(setActiveRelease(res.data));
  } catch (error) {
    dispatch(toastError(error.response.data.error));
  }
};

const uploadArtwork = (releaseId, imgData, type) => async dispatch => {
  const data = new FormData();
  data.append('releaseId', releaseId);
  data.append('type', type);
  data.append('file', imgData);

  const config = {
    onUploadProgress: event => {
      const progress = (event.loaded / event.total) * 100;
      dispatch(setArtworkUploadProgress(Math.floor(progress)));
    }
  };

  try {
    dispatch(setArtworkUploading(true));
    axios.post('/api/artwork', data, config);
  } catch (error) {
    batch(() => {
      dispatch(toastError(error.response.data.error));
      dispatch(setArtworkUploadProgress(0));
      dispatch(setArtworkUploading(false));
    });
  }
};

export const { setArtworkUploading, setArtworkUploadProgress } = artworkSlice.actions;
export { deleteArtwork, uploadArtwork };
export default artworkSlice.reducer;

import axios from "axios";
import { batch } from "react-redux";
import { createSlice } from "@reduxjs/toolkit";
import { setActiveRelease } from "state/releases";
import { toastError } from "state/toast";

const artworkSlice = createSlice({
  name: "artwork",
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
    dispatch(toastError({ message: error.response.data.error, title: "Error" }));
  }
};

const uploadArtwork = (releaseId, file) => async dispatch => {
  const data = new FormData();
  data.append("artworkImageFile", file);

  const config = {
    onUploadProgress: event => {
      const progress = (event.loaded / event.total) * 100;
      dispatch(setArtworkUploadProgress(Math.floor(progress)));
      if (event.loaded === event.total) dispatch(setArtworkUploading(false));
    }
  };

  try {
    dispatch(setArtworkUploading(true));
    await axios.post(`/api/artwork/${releaseId}`, data, config);
  } catch (error) {
    batch(() => {
      dispatch(toastError({ message: error.response.data.error, title: "Error" }));
      dispatch(setArtworkUploadProgress(0));
      dispatch(setArtworkUploading(false));
    });
  }
};

export const { setArtworkUploading, setArtworkUploadProgress } = artworkSlice.actions;
export { deleteArtwork, uploadArtwork };
export default artworkSlice.reducer;

import { createSlice } from "@reduxjs/toolkit";
import axios, { AxiosProgressEvent } from "axios";

import { setActiveRelease } from "@/state/releases";
import { AppDispatch } from "@/types";
import handleError from "@/utils/handleError";

interface ArtworkState {
  artworkUploading: boolean;
  artworkUploadProgress: number;
}

const initialState: ArtworkState = {
  artworkUploading: false,
  artworkUploadProgress: 0
};

const artworkSlice = createSlice({
  initialState,
  name: "artwork",
  reducers: {
    setArtworkUploading(state, action) {
      state.artworkUploading = action.payload;
    },
    setArtworkUploadProgress(state, action) {
      state.artworkUploadProgress = action.payload;
    }
  }
});

const deleteArtwork = (releaseId: string) => async (dispatch: AppDispatch) => {
  try {
    const res = await axios.delete(`/api/artwork/${releaseId}`);
    dispatch(setActiveRelease(res.data));
  } catch (error: unknown) {
    handleError(error, dispatch);
  }
};

const uploadArtwork = (releaseId: string, file: File) => async (dispatch: AppDispatch) => {
  const data = new FormData();
  data.append("artworkImageFile", file);

  const config = {
    onUploadProgress: (event: AxiosProgressEvent) => {
      const progress = (event.loaded / (event.total || 0)) * 100;
      dispatch(setArtworkUploadProgress(Math.floor(progress)));
      if (event.loaded === event.total) dispatch(setArtworkUploading(false));
    }
  };

  try {
    dispatch(setArtworkUploading(true));
    await axios.post(`/api/artwork/${releaseId}`, data, config);
  } catch (error: unknown) {
    handleError(error, dispatch);
    dispatch(setArtworkUploading(false));
    dispatch(setArtworkUploadProgress(0));
  }
};

export const { setArtworkUploading, setArtworkUploadProgress } = artworkSlice.actions;
export { deleteArtwork, uploadArtwork };
export type { ArtworkState };
export default artworkSlice.reducer;

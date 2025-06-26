import { AppDispatch } from "@/main";
import { setActiveRelease } from "@/state/releases";
import { toastError } from "@/state/toast";
import { createSlice } from "@reduxjs/toolkit";
import axios, { AxiosProgressEvent } from "axios";
import { batch } from "react-redux";

interface ArtworkState {
  artworkUploading: boolean;
  artworkUploadProgress: number;
}

const initialState: ArtworkState = {
  artworkUploading: false,
  artworkUploadProgress: 0
};

const artworkSlice = createSlice({
  name: "artwork",
  initialState,
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
  } catch (error: any) {
    dispatch(toastError({ message: error.response.data.error, title: "Error" }));
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
  } catch (error: any) {
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

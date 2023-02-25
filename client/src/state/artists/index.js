import { toastError, toastSuccess } from "state/toast";
import axios from "axios";
import { batch } from "react-redux";
import { createSlice } from "@reduxjs/toolkit";

const artistSlice = createSlice({
  name: "artists",
  initialState: {
    activeArtistId: "",
    artists: [],
    errors: {},
    isLoading: false,
    isSubmitting: false,
    isPristine: true
  },
  reducers: {
    removeLink(state, action) {
      const { artistId, linkId } = action.payload;
      state.isPristine = false;

      state.artists = state.artists.map(artist => {
        if (artist._id === artistId) return { ...artist, links: artist.links.filter(link => link._id !== linkId) };
        return artist;
      });
    },
    setActiveArtistId(state, action) {
      state.activeArtistId = action.payload;
    },
    setArtist(state, action) {
      state.artists = state.artists.map(artist => {
        if (artist._id === action.payload._id) return action.payload;
        return artist;
      });
    },
    setArtists(state, action) {
      state.artists = action.payload;
      if (action.payload.length === 1) state.activeArtistId = action.payload[0]._id;
    },
    setErrors(state, action) {
      if (!action.payload) {
        state.errors = {};
        return;
      }

      state.errors[action.payload.name] = action.payload.value;
    },
    setIsLoading(state, action) {
      state.isLoading = action.payload;
    },
    setIsPristine(state, action) {
      state.isPristine = action.payload;
    },
    setIsSubmitting(state, action) {
      state.isSubmitting = action.payload;
    },
    setLink(state, action) {
      const { artistId, link } = action.payload;
      state.isPristine = false;
      state.artists = state.artists.map(artist => {
        if (artist._id === artistId) return { ...artist, links: [...artist.links, link] };
        return artist;
      });
    },
    setValues(state, action) {
      const { artistId, name, value } = action.payload;

      state.artists = state.artists.map(artist => {
        if (artist._id === artistId && name.split(".").length === 2) {
          const [linkId, fieldName] = name.split(".");

          return {
            ...artist,
            links: artist.links.map(link => {
              if (link._id === linkId) return { ...link, [fieldName]: value };
              return link;
            })
          };
        }

        if (artist._id === artistId) return { ...artist, [name]: value };
        return artist;
      });
    }
  }
});

const addLink = activeArtistId => async dispatch => {
  try {
    const res = await axios.patch(`/api/artists/${activeArtistId}/link`);
    dispatch(setLink({ artistId: activeArtistId, link: res.data }));
  } catch (error) {
    dispatch(toastError({ message: error.response?.data.error ?? error.toString(), title: "Error" }));
  }
};

const fetchArtists = () => async dispatch => {
  try {
    dispatch(setIsLoading(true));
    const res = await axios.get("/api/artists");
    dispatch(setArtists(res.data));
  } catch (error) {
    dispatch(toastError({ message: error.response?.data.error, title: "Error" }));
  } finally {
    dispatch(setIsLoading(false));
  }
};

const updateArtist = values => async dispatch => {
  try {
    dispatch(setIsSubmitting(true));
    const res = await axios.post(`/api/artists/${values._id}`, values);

    if (res.data.error) {
      dispatch(setErrors({ name: res.data.name, value: res.data.value }));
      dispatch(toastError({ message: res.data.error, title: "Error" }));
      return dispatch(setIsSubmitting(false));
    }

    batch(() => {
      dispatch(setArtist(res.data));
      dispatch(setErrors());
      dispatch(toastSuccess({ message: "Artist saved", title: "Success" }));
      dispatch(setIsSubmitting(false));
      dispatch(setIsPristine(true));
    });
  } catch (error) {
    dispatch(toastError({ message: error.response?.data.error, title: "Error" }));
    dispatch(setIsLoading(false));
  }
};

export const {
  removeLink,
  setActiveArtistId,
  setArtist,
  setArtists,
  setErrors,
  setIsPristine,
  setIsSubmitting,
  setLink,
  setValues,
  setIsLoading
} = artistSlice.actions;

export { addLink, fetchArtists, updateArtist };

export default artistSlice.reducer;

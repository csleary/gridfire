import { Activity, Artist } from "types";
import { EntityState, createDraftSafeSelector, createEntityAdapter, createSlice } from "@reduxjs/toolkit";
import { toastError, toastSuccess } from "state/toast";
import { AppDispatch, RootState } from "index";
import { DateTime } from "luxon";
import axios from "axios";
import { batch } from "react-redux";

interface ArtistState {
  activeArtistId: string;
  activity: EntityState<Activity>;
  artists: Artist[];
  errors: { [key: string]: string };
  hasNotifications: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  isPristine: boolean;
  lastCheckedOn: string | null;
}

const activityAdapter = createEntityAdapter<Activity>({
  selectId: activity => activity._id
});

const initialState: ArtistState = {
  activeArtistId: "",
  activity: activityAdapter.getInitialState(),
  artists: [],
  errors: {},
  hasNotifications: false,
  isLoading: false,
  isSubmitting: false,
  isPristine: true,
  lastCheckedOn: DateTime.utc().toISO()
};

const artistSlice = createSlice({
  name: "artists",
  initialState,
  reducers: {
    addActivity(state, action) {
      activityAdapter.addOne(state.activity, action.payload);
    },
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
    setActivity(state, action) {
      activityAdapter.setAll(state.activity, action.payload);
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
    setLastCheckedOn(state) {
      state.lastCheckedOn = DateTime.utc().toISO();
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

const addLink = (activeArtistId: string) => async (dispatch: AppDispatch) => {
  try {
    const res = await axios.patch(`/api/artist/${activeArtistId}/link`);
    dispatch(setLink({ artistId: activeArtistId, link: res.data }));
  } catch (error: any) {
    dispatch(toastError({ message: error.response?.data.error ?? error.toString(), title: "Error" }));
  }
};

const fetchActivity = () => async (dispatch: AppDispatch) => {
  try {
    const res = await axios.get(`/api/artist/activity`);
    dispatch(setActivity(res.data));
  } catch (error: any) {
    dispatch(toastError({ message: error.response?.data?.error || error.message || error.toString(), title: "Error" }));
  }
};

const fetchArtists = () => async (dispatch: AppDispatch) => {
  try {
    dispatch(setIsLoading(true));
    const res = await axios.get("/api/artist");
    dispatch(setArtists(res.data));
  } catch (error: any) {
    dispatch(toastError({ message: error.response?.data.error, title: "Error" }));
  } finally {
    dispatch(setIsLoading(false));
  }
};

const updateArtist = (values: Artist) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setIsSubmitting(true));
    const res = await axios.post(`/api/artist/${values._id}`, values);

    if (res.data.error) {
      dispatch(setErrors({ name: res.data.name, value: res.data.value }));
      dispatch(toastError({ message: res.data.error, title: "Error" }));
      return dispatch(setIsSubmitting(false));
    }

    batch(() => {
      dispatch(setArtist(res.data));
      dispatch(setErrors(null));
      dispatch(toastSuccess({ message: "Artist saved", title: "Success" }));
      dispatch(setIsSubmitting(false));
      dispatch(setIsPristine(true));
    });
  } catch (error: any) {
    dispatch(toastError({ message: error.response?.data.error, title: "Error" }));
    dispatch(setIsLoading(false));
  }
};

export const {
  removeLink,
  setActiveArtistId,
  setActivity,
  setArtist,
  setArtists,
  setErrors,
  setIsPristine,
  setIsSubmitting,
  setLastCheckedOn,
  setLink,
  setValues,
  setIsLoading
} = artistSlice.actions;

const { selectAll: selectAllActivity, selectTotal: selectTotalActivity } = activityAdapter.getSelectors(
  (state: RootState) => state.artists.activity
);

const selectTotalUnread = createDraftSafeSelector(
  (state: RootState) => state.artists.lastCheckedOn,
  (state: RootState) => state,
  (lastCheckedOn, state) =>
    selectAllActivity(state).filter(
      ({ createdAt }) => DateTime.fromISO(createdAt) > DateTime.fromISO(lastCheckedOn as string)
    ).length
);

const selectRecentActivity = createDraftSafeSelector(
  (state: RootState) => state,
  state => selectAllActivity(state).slice(0, 20)
);

export {
  addLink,
  fetchActivity,
  fetchArtists,
  selectAllActivity,
  selectRecentActivity,
  selectTotalActivity,
  selectTotalUnread,
  updateArtist
};

export default artistSlice.reducer;

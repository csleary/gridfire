import { lazy } from "react";
import { Helmet } from "react-helmet";
import { Route, Routes } from "react-router-dom";
const Artists = lazy(() => import("./artists"));
const Collection = lazy(() => import("./collection"));
const Favourites = lazy(() => import("./favourites"));
const Payment = lazy(() => import("./payment"));
const UserReleases = lazy(() => import("./userReleases"));
const Activity = lazy(() => import("./activity"));
const Wishlist = lazy(() => import("./wishlist"));

const Dashboard = () => (
  <>
    <Helmet>
      <title>Dashboard | Gridfire</title>
      <meta
        content="Take control of your Gridfire account. Add music, configure your payment details, add artist information and more."
        name="description"
      />
    </Helmet>
    <Routes>
      <Route element={<Activity />} path="/activity" />
      <Route element={<Artists />} path="/artists" />
      <Route element={<Collection />} path="/collection" />
      <Route element={<Favourites />} path="/favourites" />
      <Route element={<Payment />} path="/payment/*" />
      <Route element={<Wishlist />} path="/wishlist" />
      <Route element={<UserReleases />} path="/" />
    </Routes>
  </>
);

export default Dashboard;

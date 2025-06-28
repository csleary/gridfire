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
        name="description"
        content="Take control of your Gridfire account. Add music, configure your payment details, add artist information and more."
      />
    </Helmet>
    <Routes>
      <Route path="/activity" element={<Activity />} />
      <Route path="/artists" element={<Artists />} />
      <Route path="/collection" element={<Collection />} />
      <Route path="/favourites" element={<Favourites />} />
      <Route path="/payment/*" element={<Payment />} />
      <Route path="/wishlist" element={<Wishlist />} />
      <Route path="/" element={<UserReleases />} />
    </Routes>
  </>
);

export default Dashboard;

import { Route, Routes } from "react-router-dom";
import Payment from "./payment";
import Activity from "./activity";
import Artists from "./artists";
import Collection from "./collection";
import Favourites from "./favourites";
import { Helmet } from "react-helmet";
import UserReleases from "./userReleases";
import WishList from "./wishList";

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
      <Route path="/wishlist" element={<WishList />} />
      <Route path="/" element={<UserReleases />} />
    </Routes>
  </>
);

export default Dashboard;

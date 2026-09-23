import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { useEffect } from "react";
import { useAuthStore } from "./store/useAuthStore";
import Navbar from "./components/layout/Navbar";
import MobileNav from "./components/layout/MobileNav";

import Home from "./pages/Home/Home";
import Search from "./pages/Search/Search";
import ProductDetails from "./pages/Product/ProductDetails";
import Sell from "./pages/Sell/Sell";
import VisualSearch from "./pages/VisualSearch/VisualSearch";
import Wishlist from "./pages/Wishlist/Wishlist";
import Chat from "./pages/Chat/Chat";
//import Dashboard from "./pages/Dashboard/Dashboard";
import Profile from "./pages/Profile/Profile";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { useWishlistStore } from "./store/wishlistStore";
import SellerProfile from "./pages/Seller/SellerProfile";

function App() {
  const initializeAuth = useAuthStore(
    (state) => state.initializeAuth
  );

  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated
  );

  const initializeWishlist = useWishlistStore(
    (state) => state.initializeWishlist
  );

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

    useEffect(() => {
    if (isAuthenticated) {
      initializeWishlist();
    }
  }, [isAuthenticated, initializeWishlist]);
  
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>

        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/search" element={<Search />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route
          path="/seller/:sellerId"
          element={<SellerProfile />}
        />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>

          <Route path="/profile" element={<Profile />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/sell" element={<Sell />} />
          {/* <Route path="/my-listings" element={<MyListings />} /> */}
          <Route path="/chat" element={<Chat />} />
        </Route>
        <Route
          path="/visual-search"
          element={<VisualSearch />}
        />
      </Routes>

      <MobileNav />

      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 2500,
        }}
      />
    </BrowserRouter>
  );
}

export default App;
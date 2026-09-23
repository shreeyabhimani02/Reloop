import {
  Heart,
  Home,
  PlusCircle,
  Search,
  User,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function MobileNav() {
  return (
    <nav className="mobile-nav">

      <Link to="/">
        <Home size={20} />
        <span>Home</span>
      </Link>

      <Link to="/search">
        <Search size={20} />
        <span>Search</span>
      </Link>

      <Link
        to="/sell"
        className="mobile-sell"
      >
        <PlusCircle size={24} />
        <span>Sell</span>
      </Link>

      <Link to="/wishlist">
        <Heart size={20} />
        <span>Wishlist</span>
      </Link>

      <Link to="/profile">
        <User size={20} />
        <span>Profile</span>
      </Link>

    </nav>
  );
}
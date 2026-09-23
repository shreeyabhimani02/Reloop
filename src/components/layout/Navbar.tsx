import {
  Heart,
  LogIn,
  LogOut,
  Menu,
  Search,
  User,
  X,
} from "lucide-react";
import "./Navbar.css";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { useWishlistStore } from "../../store/wishlistStore";
import { useSearchStore } from "../../store/searchStore";
import { disconnectSocket } from "../../services/socket";
import { Bell } from "lucide-react";
import NotificationDropdown from "../Notifications/NotificationDropdown";
import { useNotifications } from "../../hooks/useNotifications";
import { useSearchSuggestions } from "../../hooks/useSearchSuggestions";

export default function Navbar() {
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated
  );
  const logout = useAuthStore((state) => state.logout);

  const wishlist = useWishlistStore(
    (state) => state.wishlist
  );

  const resetWishlist = useWishlistStore(
    (state) => state.resetWishlist
  );

  const addSearch = useSearchStore(
    (state) => state.addSearch
  );

  const [search, setSearch] = useState("");

  const [showSuggestions, setShowSuggestions] =
    useState(false);

  const searchWrapperRef =
    useRef<HTMLDivElement>(null);

  const {
    data: suggestions = [],
    isFetching: suggestionsLoading,
  } = useSearchSuggestions(search);

  const [showNotifications, setShowNotifications] = useState(false);

  const { data: notificationData } = useNotifications(
    isAuthenticated
  );

  const unreadNotificationCount =
    notificationData?.unreadCount ?? 0;

  function handleSuggestionClick(
    suggestion: string
  ) {
    const value = suggestion.trim();

    if (!value) return;

    addSearch(value);

    navigate(
      `/search?q=${encodeURIComponent(value)}`
    );

    setSearch("");
    setShowSuggestions(false);
  }

  function handleSearch(
    e: React.FormEvent
  ) {
    e.preventDefault();

    const value = search.trim();

    if (!value) return;

    addSearch(value);

    navigate(
      `/search?q=${encodeURIComponent(value)}`
    );

    setSearch("");
    setShowSuggestions(false);
  }

  function handleLogout() {
    disconnectSocket();

    logout();
    resetWishlist();

    setMobileMenuOpen(false);

    navigate("/");
  }

  useEffect(() => {
    function handleClickOutside(
      event: MouseEvent
    ) {
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(
          event.target as Node
        )
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  return (
    <header className="navbar">

      <div className="navbar-inner">

        {/* Logo */}
        <Link
          to="/"
          className="navbar-logo"
          onClick={() => setMobileMenuOpen(false)}
        >
          ReLoop
        </Link>

        {/* Desktop Search */}
        <div
          className="navbar-search-wrapper"
          ref={searchWrapperRef}
        >
          <form
            className="navbar-search"
            onSubmit={handleSearch}
          >
            <Search size={18} />

            <input
              type="search"
              placeholder="Search for anything..."
              value={search}
              onFocus={() => {
                if (search.trim().length >= 2) {
                  setShowSuggestions(true);
                }
              }}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowSuggestions(true);
              }}
            />
          </form>

          {showSuggestions &&
            search.trim().length >= 2 && (
              <div className="search-suggestions">
                {suggestionsLoading ? (
                  <div className="search-suggestion-loading">
                    Searching...
                  </div>
                ) : suggestions.length > 0 ? (
                  suggestions.map(
                    (suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        className="search-suggestion"
                        onClick={() =>
                          handleSuggestionClick(
                            suggestion
                          )
                        }
                      >
                        <Search size={16} />
                        <span>{suggestion}</span>
                      </button>
                    )
                  )
                ) : (
                  <div className="search-suggestion-empty">
                    No suggestions found
                  </div>
                )}
              </div>
            )}
        </div>

        {/* Desktop Navigation */}
        <nav className="navbar-actions">

          <Link to="/sell" className="navbar-sell">
            Sell
          </Link>

          {isAuthenticated ? (
            <>
              {/* Wishlist */}
              <Link
                to="/wishlist"
                className="navbar-icon-button"
                aria-label="Wishlist"
              >
                <Heart size={20} />

                {wishlist.length > 0 && (
                  <span className="navbar-badge">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              {/* Profile */}
              <Link
                to="/profile"
                className="navbar-user"
              >
                <span className="navbar-user-icon">
                  <User size={17} />
                </span>

                <span className="navbar-user-name">
                  {user?.name}
                </span>
              </Link>

              <div className="navbar-notification-wrapper">
                <button
                  type="button"
                  className="navbar-icon-button"
                  onClick={() =>
                    setShowNotifications((previous) => !previous)
                  }
                  aria-label="Notifications"
                >
                  <Bell size={21} />

                  {unreadNotificationCount > 0 && (
                    <span className="notification-badge">
                      {unreadNotificationCount > 99
                        ? "99+"
                        : unreadNotificationCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <NotificationDropdown
                    onClose={() => setShowNotifications(false)}
                  />
                )}
              </div>

              {/* Logout */}
              <button
                type="button"
                className="navbar-logout"
                onClick={handleLogout}
              >
                <LogOut size={17} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="navbar-login"
              >
                <LogIn size={17} />
                Login
              </Link>

              <Link
                to="/register"
                className="navbar-register"
              >
                Sign up
              </Link>
            </>
          )}

        </nav>

        {/* Mobile menu button */}
        <button
          type="button"
          className="navbar-menu-button"
          aria-label={
            mobileMenuOpen
              ? "Close menu"
              : "Open menu"
          }
          onClick={() =>
            setMobileMenuOpen((previous) => !previous)
          }
        >
          {mobileMenuOpen ? (
            <X size={24} />
          ) : (
            <Menu size={24} />
          )}
        </button>

      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="navbar-mobile-menu">

          <div className="navbar-mobile-search-wrapper">
            <form
              className="navbar-mobile-search"
              onSubmit={handleSearch}
            >
              <Search size={18} />

              <input
                type="search"
                placeholder="Search for anything..."
                value={search}
                onFocus={() => {
                  if (search.trim().length >= 2) {
                    setShowSuggestions(true);
                  }
                }}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowSuggestions(true);
                }}
              />
            </form>

            {showSuggestions &&
              search.trim().length >= 2 && (
                <div className="search-suggestions mobile-search-suggestions">
                  {suggestionsLoading ? (
                    <div className="search-suggestion-loading">
                      Searching...
                    </div>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        className="search-suggestion"
                        onClick={() =>
                          handleSuggestionClick(
                            suggestion
                          )
                        }
                      >
                        <Search size={16} />
                        <span>{suggestion}</span>
                      </button>
                    ))
                  ) : (
                    <div className="search-suggestion-empty">
                      No suggestions found
                    </div>
                  )}
                </div>
              )}
          </div>

          <Link
            to="/sell"
            onClick={() => setMobileMenuOpen(false)}
          >
            Sell
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/wishlist"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Heart size={18} />
                Wishlist
                {wishlist.length > 0 && (
                  <span>
                    ({wishlist.length})
                  </span>
                )}
              </Link>

              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
              >
                <User size={18} />
                {user?.name}
              </Link>

              <button
                type="button"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LogIn size={18} />
                Login
              </Link>

              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign up
              </Link>
            </>
          )}

        </div>
      )}

    </header>
  );
}
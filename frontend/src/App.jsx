import { useState } from "react";
import "./App.css";

const foundItems = [
  {
    id: 1,
    name: "Hydro Flask (Blue)",
    location: "Campus Center",
    status: "Available",
    category: "Drinkware",
    date: "Today",
    position: { left: "52%", top: "31%" },
  },
  {
    id: 2,
    name: "TI-84 Plus Calculator",
    location: "Gleeson Hall",
    status: "Available",
    category: "Electronics",
    date: "Yesterday",
    position: { left: "32%", top: "52%" },
  },
  {
    id: 3,
    name: "Car Key Fob",
    location: "Library 1st Floor",
    status: "In Review",
    category: "Keys",
    date: "Oct 17",
    position: { left: "72%", top: "63%" },
  },
];

function App() {
  const [currentPage, setCurrentPage] = useState("login"); // "login", "register", "home"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedItemId, setSelectedItemId] = useState(foundItems[0].id);
  const [itemSearch, setItemSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All items");
  const [mapZoom, setMapZoom] = useState(1);

  // State for Registration Prototype
  const [registerData, setRegisterData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    regUsername: "",
    regPassword: "",
    confirmPassword: "",
  });

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    setCurrentPage("home");
  };

  const handleLogout = () => {
    setCurrentPage("login");
  };

  const handleRegisterChange = (e) => {
    setRegisterData({
      ...registerData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    // Prototype action: Log values and return to login screen
    console.log("Registered User Data:", registerData);
    setCurrentPage("login");
  };

  /* ---------------- HOME SCREEN ---------------- */
  if (currentPage === "home") {
    return (
      <div className="home-page">
        <div className="home-container">
          <div className="home-header-bar">
            <div>
              <h1 className="home-title">FSC Lost & Found</h1>
              <p className="home-subtitle">
                Welcome, {username.trim() ? username : "Student"}!
              </p>
            </div>
            <button className="logout-button" onClick={handleLogout}>
              Log Out
            </button>
          </div>

          <div className="home-welcome-card">
            <h2>Campus Lost & Found Home</h2>
            <p>
              Manage your lost item reports, browse found campus belongings, and submit ownership claims.
            </p>
          </div>

          <div className="home-grid">
            <div className="home-card">
              <div className="card-badge">Report</div>
              <h3>Report Lost Item</h3>
              <p>Submit details about an item you lost on campus.</p>
              <button className="home-card-btn primary-btn">Report Item</button>
            </div>

            <div className="home-card">
              <div className="card-badge">Browse</div>
              <h3>Found Items Catalog</h3>
              <p>Browse recovered items turned in to campus security.</p>
              <button
                className="home-card-btn secondary-btn"
                onClick={() => setCurrentPage("map")}
              >
                View Catalog
              </button>
            </div>

            <div className="home-card">
              <div className="card-badge">Status</div>
              <h3>My Claims & Reports</h3>
              <p>Check updates on items you have claimed or reported.</p>
              <button className="home-card-btn secondary-btn">View Claims</button>
            </div>
          </div>

          <div className="home-recent-section">
            <h3>Recent Found Items</h3>
            <div className="item-table">
              <div className="item-table-row item-table-head">
                <span>Item Name</span>
                <span>Location Found</span>
                <span>Status</span>
              </div>
              {foundItems.map((item) => (
                <div className="item-table-row" key={item.id}>
                  <span>{item.name}</span>
                  <span>{item.location}</span>
                  <span className={`status-badge ${item.status === "Available" ? "available" : "claimed"}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === "map") {
    const filteredItems = foundItems.filter((item) => {
      const matchesSearch = `${item.name} ${item.location} ${item.category}`
        .toLowerCase()
        .includes(itemSearch.toLowerCase());
      const matchesStatus = statusFilter === "All items" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    const selectedItem = foundItems.find((item) => item.id === selectedItemId);

    return (
      <main className="catalog-page">
        <header className="catalog-header">
          <div className="catalog-brand">
            <button className="back-button" onClick={() => setCurrentPage("home")} aria-label="Back to home">
              ←
            </button>
            <div>
              <p className="eyebrow">FSC LOST & FOUND</p>
              <h1>Found on campus</h1>
            </div>
          </div>
          <button className="logout-button" onClick={handleLogout}>Log Out</button>
        </header>

        <section className="catalog-toolbar" aria-label="Catalog filters">
          <label className="catalog-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Search items or locations"
              value={itemSearch}
              onChange={(event) => setItemSearch(event.target.value)}
              aria-label="Search items or locations"
            />
          </label>
          <div className="status-filter" aria-label="Filter by status">
            {["All items", "Available", "In Review"].map((status) => (
              <button
                key={status}
                className={statusFilter === status ? "filter-option active" : "filter-option"}
                onClick={() => setStatusFilter(status)}
                aria-pressed={statusFilter === status}
              >
                {status}
              </button>
            ))}
          </div>
          <span className="result-count">{filteredItems.length} items</span>
        </section>

        <section className="catalog-content">
          <div className="campus-map" aria-label="Schematic campus map with found item locations">
            <div className="map-topline">
              <span><span className="map-live-dot" /> CAMPUS LOCATIONS</span>
              <span>SCHEMATIC MAP</span>
            </div>
            <div className="map-viewport">
              <div className="map-art" style={{ transform: `scale(${mapZoom})` }}>
                <div className="map-green map-green-north" />
                <div className="map-green map-green-south" />
                <div className="map-road map-road-main" />
                <div className="map-road map-road-cross" />
                <div className="map-walk map-walk-one" />
                <div className="map-walk map-walk-two" />
                <span className="map-label map-label-north">NORTH WALK</span>
                <span className="map-label map-label-quad">THE QUAD</span>
                <span className="map-label map-label-east">EAST WALK</span>
                <div className="map-building building-center"><span>Campus<br />Center</span></div>
                <div className="map-building building-gleeson"><span>Gleeson<br />Hall</span></div>
                <div className="map-building building-library"><span>Library</span></div>
                <div className="map-building building-west"><span>Student<br />Union</span></div>
                <div className="map-building building-east"><span>Science<br />Hall</span></div>
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    className={`map-pin ${item.id === selectedItemId ? "selected" : ""}`}
                    style={{ left: item.position.left, top: item.position.top }}
                    onClick={() => setSelectedItemId(item.id)}
                    aria-label={`${item.name}, found at ${item.location}`}
                    title={`${item.name} · ${item.location}`}
                  >
                    <span>{item.id}</span>
                  </button>
                ))}
                <span className="map-north">N ↑</span>
              </div>
            </div>
            <div className="map-controls" aria-label="Map zoom controls">
              <button onClick={() => setMapZoom((zoom) => Math.min(zoom + 0.15, 1.6))} aria-label="Zoom in">+</button>
              <button onClick={() => setMapZoom((zoom) => Math.max(zoom - 0.15, 0.85))} aria-label="Zoom out">−</button>
              <button onClick={() => setMapZoom(1)} aria-label="Reset map zoom">↺</button>
            </div>
            <div className="map-legend"><span className="legend-pin" /> Found item</div>
          </div>

          <aside className="item-panel">
            <div className="item-panel-heading">
              <div>
                <p className="eyebrow">RECENTLY TURNED IN</p>
                <h2>Found items</h2>
              </div>
              <span className="panel-count">{filteredItems.length}</span>
            </div>
            <div className="item-list">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  className={`found-item ${selectedItemId === item.id ? "active" : ""}`}
                  onClick={() => setSelectedItemId(item.id)}
                  aria-pressed={selectedItemId === item.id}
                >
                  <span className="item-marker-number">{item.id}</span>
                  <span className="found-item-copy">
                    <strong>{item.name}</strong>
                    <span>{item.location} · {item.date}</span>
                  </span>
                  <span className={`status-dot ${item.status === "Available" ? "is-available" : "is-review"}`} aria-label={item.status} />
                </button>
              ))}
              {filteredItems.length === 0 && <p className="empty-results">No items match those filters.</p>}
            </div>
            {selectedItem && filteredItems.some((item) => item.id === selectedItem.id) && (
              <div className="selected-item-detail" aria-live="polite">
                <p className="eyebrow">SELECTED ITEM</p>
                <h3>{selectedItem.name}</h3>
                <p>{selectedItem.category} · {selectedItem.location}</p>
                <span className={`detail-status ${selectedItem.status === "Available" ? "available" : "in-review"}`}>
                  {selectedItem.status}
                </span>
              </div>
            )}
            <p className="map-note">Locations are approximate. Check with campus staff before pickup.</p>
          </aside>
        </section>
      </main>
    );
  }

  /* ---------------- REGISTER SCREEN ---------------- */
  if (currentPage === "register") {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>Register</h1>

          <form onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={registerData.email}
                onChange={handleRegisterChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="Enter your first name"
                value={registerData.firstName}
                onChange={handleRegisterChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Enter your last name"
                value={registerData.lastName}
                onChange={handleRegisterChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="regUsername">Username</label>
              <input
                id="regUsername"
                name="regUsername"
                type="text"
                placeholder="Choose a username"
                value={registerData.regUsername}
                onChange={handleRegisterChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="regPassword">Password</label>
              <input
                id="regPassword"
                name="regPassword"
                type="password"
                placeholder="Enter password"
                value={registerData.regPassword}
                onChange={handleRegisterChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm password"
                value={registerData.confirmPassword}
                onChange={handleRegisterChange}
                required
              />
            </div>

            <button type="submit" className="login-button">
              Register
            </button>

            <button
              type="button"
              className="register-button"
              onClick={() => setCurrentPage("login")}
            >
              Back
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ---------------- LOGIN SCREEN ---------------- */
  return (
    <div className="login-page">
      <div className="login-card">
        <h1>FSC Lost & Found</h1>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="username">Username or Email</label>
            <input
              id="username"
              type="text"
              placeholder="Enter your username or email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="login-button">
            Log In
          </button>

          <button
            type="button"
            className="register-button"
            onClick={() => setCurrentPage("register")}
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
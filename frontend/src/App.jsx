import { useState } from "react";
import "./App.css";

function App() {
  const [currentPage, setCurrentPage] = useState("login"); // "login", "register", "home"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

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
              <button className="home-card-btn secondary-btn">View Catalog</button>
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
              <div className="item-table-row">
                <span>Hydro Flask (Blue)</span>
                <span>Campus Center</span>
                <span className="status-badge available">Available</span>
              </div>
              <div className="item-table-row">
                <span>TI-84 Plus Calculator</span>
                <span>Gleeson Hall</span>
                <span className="status-badge available">Available</span>
              </div>
              <div className="item-table-row">
                <span>Car Key Fob</span>
                <span>Library 1st Floor</span>
                <span className="status-badge claimed">In Review</span>
              </div>
            </div>
          </div>
        </div>
      </div>
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
import "./App.css";

function App() {
  return (
    <div className="login-page">
      <div className="login-card">

        <h1>FSC Lost & Found</h1>

        <div className="form-group">
          <label>Username or Email</label>
          <input
            type="text"
            placeholder="Enter your username or email"
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
          />
        </div>

        <button className="login-button">
          Log In
        </button>

        <button className="register-button">
          Register
        </button>

      </div>
    </div>
  );
}

export default App;
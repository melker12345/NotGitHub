import React from "react";
import { Link } from "react-router-dom";

function WelcomePage() {
    return (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
            <h1>Welcome to GitHub Clone</h1>
            <p>Manage your repositories and collaborate with others securely.</p>
            <div style={{ marginTop: "20px" }}>
                <Link to="/login" style={{ marginRight: "10px" }}>
                    <button>Sign In</button>
                </Link>
                <Link to="/register">
                    <button>Create Account</button>
                </Link>
            </div>
        </div>
    );
}

export default WelcomePage;

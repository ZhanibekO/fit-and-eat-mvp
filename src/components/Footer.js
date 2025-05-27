// src/components/Footer.js
import React from "react";

const Footer = () => {
  return (
    <footer
      style={{
        backgroundColor: "#34495e",
        color: "#fff",
        textAlign: "center",
        padding: "1rem",
        marginTop: "2rem"
      }}
    >
      <p>&copy; {new Date().getFullYear()} AI Fitness App. All rights reserved.</p>
    </footer>
  );
};

export default Footer;

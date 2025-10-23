import React, { useEffect } from "react";
import Routes from "./Routes";
import Notification from "./components/Notification";
import "./utils/billingApiHelper"; // Import to initialize window.billingApi
import axios from './utils/axios';

function App() {
  // Initialize API notification handlers
  useEffect(() => {
    // Add any global initialization here if needed
    console.log("App initialized");
  }, []);
  
  return (
    <>
      <Routes />
      <Notification />
    </>
  );
}

export default App;

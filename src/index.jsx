import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/tailwind.css";
import "./styles/index.css";
import axios from './utils/axios';

// Log errors to console for debugging
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
});

// Error boundary for React errors
class ErrorLogger extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Error boundary caught an error', error, info);
  }

  render() {
    if (this.state.hasError) {
      return <div style={{padding: '20px', color: 'red'}}>Something went wrong. Check the console for details.</div>;
    }
    return this.props.children;
  }
}

const initializeApp = async () => {
  try {
    // Fetch the CSRF token from the backend to ensure it's set before the app loads
    await axios.get('/get-csrf-token');
    console.log('CSRF token requested. Current cookies:', document.cookie);
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    // You might want to show an error message to the user here
  }

  try {
    const container = document.getElementById("root");
    if (!container) {
      console.error('Root element not found!');
      document.body.innerHTML = '<div style="color:red;padding:20px;">Error: Root element #root not found</div>';
    } else {
      const root = createRoot(container);
      root.render(
        <ErrorLogger>
          <App />
        </ErrorLogger>
      );
    }
  } catch (err) {
    console.error('Fatal error during rendering:', err);
    document.body.innerHTML = '<div style="color:red;padding:20px;">Fatal error: ' + err.message + '</div>';
  }
};

initializeApp();

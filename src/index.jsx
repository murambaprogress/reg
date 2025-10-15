import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/tailwind.css";
import "./styles/index.css";

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

  componentDidCatch(error, errorInfo) {
    console.error('React error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div style={{padding: '20px', color: 'red'}}>Something went wrong. Check the console for details.</div>;
    }
    return this.props.children;
  }
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

import React from "react";
import Routes from "./Routes";
import { UserProvider } from "./components/UserContext";
import { SalesProvider } from "./pages/sales-shop/SalesContext";
import { InventoryProvider } from "./pages/inventory-management/InventoryContext";


function App() {
  return <Routes />;
}

export default App;

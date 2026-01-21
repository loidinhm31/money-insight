import { RouterProvider } from "react-router-dom";
import { router } from "./routes";

/**
 * Main App component
 * Uses React Router for URL-based navigation
 */
function App() {
  return <RouterProvider router={router} />;
}

export default App;

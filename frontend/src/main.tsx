import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Verify from "./pages/Verify"
import Providers from "./pages/Providers"
import Provider from "./pages/Provider"
import Bookings from "./pages/Bookings"
import Dashboard from "./pages/Dashboard"
import Admin from "./pages/Admin"
import NotFound from "./pages/NotFound"
import { Layout } from "./ui/Layout"
import RequireAuth from "./ui/RequireAuth"

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Home /> },
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "verify", element: <Verify /> },

      // защищенные
      { path: "providers", element: <RequireAuth><Providers /></RequireAuth> },
      { path: "providers/:id", element: <RequireAuth><Provider /></RequireAuth> },
      { path: "bookings", element: <RequireAuth><Bookings /></RequireAuth> },
      { path: "dashboard", element: <RequireAuth><Dashboard /></RequireAuth> },
      { path: "admin", element: <RequireAuth><Admin /></RequireAuth> },
    ]
  }
])

const qc = new QueryClient()
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
)

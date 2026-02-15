import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { UserProvider } from "@/contexts/UserContext";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Stories from "./pages/Stories";
import Videos from "./pages/Videos";
import Games from "./pages/Games";
import Activities from "./pages/Activities";
import Profile from "./pages/Profile";
import Favorites from "./pages/Favorites";
import Notifications from "./pages/Notifications";
import Privacy from "./pages/Privacy";
import Help from "./pages/Help";
import StoryDetail from "./pages/StoryDetail";
import NotFound from "./pages/NotFound";
import Devotional from "./pages/Devotional";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <UserProvider>
        <FavoritesProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="/stories" element={<ProtectedRoute><Stories /></ProtectedRoute>} />
                <Route path="/story/:id" element={<ProtectedRoute><StoryDetail /></ProtectedRoute>} />
                <Route path="/videos" element={<ProtectedRoute><Videos /></ProtectedRoute>} />
                <Route path="/games" element={<ProtectedRoute><Games /></ProtectedRoute>} />
                <Route path="/activities" element={<ProtectedRoute><Activities /></ProtectedRoute>} />
                <Route path="/devotional" element={<ProtectedRoute><Devotional /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="/privacy" element={<ProtectedRoute><Privacy /></ProtectedRoute>} />
                <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </FavoritesProvider>
      </UserProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

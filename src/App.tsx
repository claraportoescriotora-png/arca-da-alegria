import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { AuthProvider } from "@/contexts/AuthProvider";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Stories from "./pages/Stories";
import Videos from "./pages/Videos";
import Games from "./pages/Games";
import PuzzleGame from './pages/games/PuzzleGame';
import ShepherdGame from './pages/games/ShepherdGame';
import SkyJumpGame from './pages/games/SkyJumpGame';
import SignsGame from './pages/games/SignsGame';
import FindJesusGame from './pages/games/FindJesusGame';
import RhythmGame from './pages/games/RhythmGame';
import CharadesGame from './pages/games/CharadesGame';
import Activities from "./pages/Activities";
import Profile from "./pages/Profile";
import Favorites from "./pages/Favorites";
import Notifications from "./pages/Notifications";
import Privacy from "./pages/Privacy";
import Help from "./pages/Help";
import StoryDetail from "./pages/StoryDetail";
import NotFound from "./pages/NotFound";
import Devotional from "./pages/Devotional";
import Missions from "./pages/Missions";
import MissionDetail from "./pages/MissionDetail";
import ProtectedRoute from "./components/ProtectedRoute";

import Paywall from "./pages/Paywall";
import SubscriptionGuard from "./components/SubscriptionGuard";

const queryClient = new QueryClient();

import { UserProvider } from "@/contexts/UserContext";
import { ConfigProvider } from "@/contexts/ConfigContext";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <ConfigProvider>
          <UserProvider>
            <FavoritesProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/paywall" element={<ProtectedRoute><Paywall /></ProtectedRoute>} />
                    <Route path="/home" element={<ProtectedRoute><SubscriptionGuard><Home /></SubscriptionGuard></ProtectedRoute>} />
                    <Route path="/stories" element={<ProtectedRoute><SubscriptionGuard><Stories /></SubscriptionGuard></ProtectedRoute>} />
                    <Route path="/story/:id" element={<ProtectedRoute><SubscriptionGuard><StoryDetail /></SubscriptionGuard></ProtectedRoute>} />
                    <Route path="/videos" element={<ProtectedRoute><SubscriptionGuard><Videos /></SubscriptionGuard></ProtectedRoute>} />
                    <Route path="/games" element={<ProtectedRoute><SubscriptionGuard><Games /></SubscriptionGuard></ProtectedRoute>} />
                    <Route path="/games/puzzle/:id" element={<ProtectedRoute><SubscriptionGuard><PuzzleGame /></SubscriptionGuard></ProtectedRoute>} />
                    <Route path="/games/shepherd/:id" element={<ProtectedRoute><SubscriptionGuard><ShepherdGame /></SubscriptionGuard></ProtectedRoute>} />
                    <Route path="/games/sky-jump/:id" element={<ProtectedRoute><SubscriptionGuard><SkyJumpGame /></SubscriptionGuard></ProtectedRoute>} />
                    <Route path="/games/signs/:id" element={<ProtectedRoute><SubscriptionGuard><SignsGame /></SubscriptionGuard></ProtectedRoute>} />
                    <Route path="/games/find-jesus/:id" element={<ProtectedRoute><SubscriptionGuard><FindJesusGame /></SubscriptionGuard></ProtectedRoute>} />
                    <Route path="/games/rhythm/:id" element={<ProtectedRoute><SubscriptionGuard><RhythmGame /></SubscriptionGuard></ProtectedRoute>} />
                    <Route path="/games/charades/:id" element={<ProtectedRoute><SubscriptionGuard><CharadesGame /></SubscriptionGuard></ProtectedRoute>} />
                    <Route path="/activities" element={<ProtectedRoute><SubscriptionGuard><Activities /></SubscriptionGuard></ProtectedRoute>} />
                    <Route path="/missions" element={<ProtectedRoute><SubscriptionGuard><Missions /></SubscriptionGuard></ProtectedRoute>} />
                    <Route path="/missions/:id" element={<ProtectedRoute><SubscriptionGuard><MissionDetail /></SubscriptionGuard></ProtectedRoute>} />
                    <Route path="/devotional" element={<ProtectedRoute><SubscriptionGuard><Devotional /></SubscriptionGuard></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><SubscriptionGuard><Profile /></SubscriptionGuard></ProtectedRoute>} />
                    <Route path="/favorites" element={<ProtectedRoute><SubscriptionGuard><Favorites /></SubscriptionGuard></ProtectedRoute>} />
                    <Route path="/notifications" element={<ProtectedRoute><SubscriptionGuard><Notifications /></SubscriptionGuard></ProtectedRoute>} />
                    <Route path="/privacy" element={<ProtectedRoute><SubscriptionGuard><Privacy /></SubscriptionGuard></ProtectedRoute>} />
                    <Route path="/help" element={<ProtectedRoute><SubscriptionGuard><Help /></SubscriptionGuard></ProtectedRoute>} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </FavoritesProvider>
          </UserProvider>
        </ConfigProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

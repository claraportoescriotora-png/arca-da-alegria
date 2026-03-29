import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { AuthProvider } from "@/contexts/AuthProvider";
import { UserProvider } from "@/contexts/UserContext";
import { ConfigProvider } from "@/contexts/ConfigContext";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Stories = lazy(() => import("./pages/Stories"));
const Videos = lazy(() => import("./pages/Videos"));
const Games = lazy(() => import("./pages/Games"));
const PuzzleGame = lazy(() => import("./pages/games/PuzzleGame"));
const ShepherdGame = lazy(() => import("./pages/games/ShepherdGame"));
const SkyJumpGame = lazy(() => import("./pages/games/SkyJumpGame"));
const SignsGame = lazy(() => import("./pages/games/SignsGame"));
const FindJesusGame = lazy(() => import("./pages/games/FindJesusGame"));
const RhythmGame = lazy(() => import("./pages/games/RhythmGame"));
const CharadesGame = lazy(() => import("./pages/games/CharadesGame"));
const Activities = lazy(() => import("./pages/Activities"));
const Profile = lazy(() => import("./pages/Profile"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Help = lazy(() => import("./pages/Help"));
const StoryDetail = lazy(() => import("./pages/StoryDetail"));
const VideoDetail = lazy(() => import("./pages/VideoDetail"));
const SeriesDetail = lazy(() => import("./pages/SeriesDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Devotional = lazy(() => import("./pages/Devotional"));
const Missions = lazy(() => import("./pages/Missions"));
const MissionDetail = lazy(() => import("./pages/MissionDetail"));
const Paywall = lazy(() => import("./pages/Paywall"));
const Welcome = lazy(() => import("./pages/Welcome"));
const ThankYou = lazy(() => import("./pages/ThankYou"));
const Store = lazy(() => import("./pages/Store"));

// High-impact lazy loads (Landing for SEO, Admin for bundle size)
const Admin = lazy(() => import("./pages/admin/Admin"));
const Landing = lazy(() => import("./pages/Landing"));

import ProtectedRoute from "./components/ProtectedRoute";
import SubscriptionGuard from "./components/SubscriptionGuard";

const queryClient = new QueryClient();

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
                <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                  <Suspense fallback={null}>
                    <Routes>
                      {/* Public Landing Page */}
                      <Route path="/landing" element={<Landing />} />

                      <Route path="/" element={<Login />} />
                      <Route path="/welcome" element={<ProtectedRoute><Welcome /></ProtectedRoute>} />
                      <Route path="/obrigado" element={<ThankYou />} />
                      <Route path="/paywall" element={<ProtectedRoute><Paywall /></ProtectedRoute>} />
                      <Route path="/home" element={<ProtectedRoute><SubscriptionGuard><Home /></SubscriptionGuard></ProtectedRoute>} />
                      <Route path="/stories" element={<ProtectedRoute><SubscriptionGuard><Stories /></SubscriptionGuard></ProtectedRoute>} />
                      <Route path="/story/:id" element={<ProtectedRoute><SubscriptionGuard><StoryDetail /></SubscriptionGuard></ProtectedRoute>} />
                      <Route path="/videos" element={<ProtectedRoute><SubscriptionGuard><Videos /></SubscriptionGuard></ProtectedRoute>} />
                      <Route path="/video/:id" element={<ProtectedRoute><SubscriptionGuard><VideoDetail /></SubscriptionGuard></ProtectedRoute>} />
                      <Route path="/series/:id" element={<ProtectedRoute><SubscriptionGuard><SeriesDetail /></SubscriptionGuard></ProtectedRoute>} />
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
                      <Route path="/store" element={<ProtectedRoute><SubscriptionGuard><Store /></SubscriptionGuard></ProtectedRoute>} />

                      {/* Admin Route - Checks permission inside the component */}
                      <Route path="/admin/*" element={<ProtectedRoute><Admin /></ProtectedRoute>} />

                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
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

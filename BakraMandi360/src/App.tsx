import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, useLocation } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { SearchProvider } from "@/contexts/SearchContext";
import { NotificationProvider } from "@/contexts/NotificationContext";

import Index1 from "./pages/Index1";
import Index from "./pages/Index";
import Animals from "./pages/Animals";
import AnimalDetail from "./pages/AnimalDetail";
import Reviews from "./pages/Review";
import Qurbani from "./pages/Qurbani";
import Orders from "./pages/Orders";
import AddListing from "./pages/AddListing";
import ViewListing from "./pages/ViewListing";
import EditListing from "./pages/EditListing";
import AddProfile from "./pages/profile/AddProfile";
import ViewProfile from "./pages/profile/ViewProfile";
import UpdateProfile from "./pages/profile/UpdateProfile";
import DeleteProfile from "./pages/profile/DeleteProfile";
import Dashboarddata from "./components/dashboard/Dashboarddata";
import DashboardLayout from "./components/layout/DashboardLayout";
import SettingsSection from "./components/dashboard/SettingsSection";
import ListingSection from "./components/dashboard/ListingSection";
import Navbar from "./components/Navbar";
import Navbar1 from "./components/layout/Navbar1";
import Wishlist from "@/components/Wishlist";
import Dashboard from "./pages/AdminDashboard";
import Sales from "./pages/AdminSales";
import AdminSales from "./pages/AdminSales";
import Payments from "./pages/AdPayments";
import AdminNotifications from "./pages/AdminNotifications";
import Settings from "./pages/AdminSettings";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { Sidebar } from "@/components/Adminlayout/Sidebar";
import ResetPasswordPage from "./components/ResetPasswordForm";
import Login from "./components/Login";
import CheckoutPage from './components/CheckoutPage';
const queryClient = new QueryClient();

// Layout components inside Router context
const AppLayout = () => {
  const location = useLocation();
  const isSellerRoute = location.pathname.startsWith("/dashboard");
  const isResetPasswordRoute = location.pathname.startsWith("/reset-password");

  console.log("AppLayout: Current path:", location.pathname);
  console.log(
    "AppLayout: isSellerRoute:",
    isSellerRoute,
    "isResetPasswordRoute:",
    isResetPasswordRoute
  );

  return (
    <div className="flex flex-col min-h-screen">
      {!isResetPasswordRoute && !isSellerRoute && <Navbar />}
      {isSellerRoute && <Navbar1 />}
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
    </div>
  );
};

const AdminLayout = () => (
  <NotificationProvider>
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  </NotificationProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <WishlistProvider>
          <SearchProvider>
            <Toaster />
            <BrowserRouter>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Index1 />} />
                  <Route path="/animals" element={<Animals />} />
                  <Route path="/animal/:id" element={<AnimalDetail />} />
                  <Route
                    path="/animal/:id/reviews"
                    element={<Reviews animal={undefined} />}
                  />
                  <Route path="/qurbani" element={<Qurbani />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  {/* Move AdminLogin to root-level */}
                 <Route path="/AdminLogin" element={<Login />} />

                  <Route path="/dashboard" element={<DashboardLayout />}>
                    <Route index element={<Dashboarddata />} />
                    <Route path="Seller" element={<Index />} />
                    <Route path="settings" element={<SettingsSection />} />
                    <Route path="listings" element={<ListingSection />} />
                    <Route path="addlistings" element={<AddListing />} />
                    <Route path="sales" element={<Sales />} />
                    <Route path="listings/:id" element={<ViewListing />} />
                    <Route path="listings/:id/edit" element={<EditListing />} />
                    <Route path="profile/add" element={<AddProfile />} />
                    <Route path="profile/view" element={<ViewProfile />} />
                    <Route path="profile/update" element={<UpdateProfile />} />
                    <Route path="profile/delete" element={<DeleteProfile currentUser={undefined} />} />
                  </Route>
                </Route>

                {/* Admin panel routes */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="listings" element={<ListingSection />} />
                  <Route path="addlistings" element={<AddListing />} />
                  <Route path="sales" element={<AdminSales />} />
                  <Route path="payments" element={<Payments />} />
                  <Route path="notifications" element={<AdminNotifications />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="profile" element={<Profile />} />
                </Route>

                {/* Fallback for unmatched routes */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </SearchProvider>
        </WishlistProvider>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

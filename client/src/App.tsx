import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { SavedVehiclesProvider } from "@/contexts/SavedVehiclesContext";
import { useFavicon } from "@/hooks/use-favicon";
import { useLiveChat } from "@/hooks/use-live-chat";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Inventory from "@/pages/Inventory";
import VehicleDetails from "@/pages/VehicleDetails";
import Consign from "@/pages/Consign";
import Admin from "@/pages/Admin";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminInventory from "@/pages/admin/Inventory";
import AdminLeads from "@/pages/admin/Leads";
import AdminConsignments from "@/pages/admin/Consignments";
import AdminSettings from "@/pages/admin/Settings";
import AdminRoadmap from "@/pages/admin/Roadmap";
import AdminSeoTools from "@/pages/admin/SeoTools";
import AdminPushNotifications from "@/pages/admin/PushNotifications";
import AdminSystemCheck from "@/pages/admin/SystemCheck";
import AdminSmsConversations from "@/pages/admin/SmsConversations";
import SellerPortal from "@/pages/SellerPortal";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import TradeIn from "@/pages/TradeIn";
import Compare from "@/pages/Compare";
import Appointments from "@/pages/Appointments";
import CreditApp from "@/pages/CreditApp";
import SavedVehicles from "@/pages/SavedVehicles";
import LocationPage from "@/pages/LocationPage";
import { PushNotificationPrompt } from "@/components/PushNotificationPrompt";
import { useLocation } from "wouter";

function FaviconLoader() {
  useFavicon();
  return null;
}

function LiveChatLoader() {
  useLiveChat();
  return null;
}

function PushNotificationPromptWrapper() {
  const [location] = useLocation();
  if (location.startsWith('/admin')) return null;
  return <PushNotificationPrompt />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/inventory">{() => <Inventory />}</Route>
      <Route path="/inventory/make/:make">{(params) => <Inventory makeSlug={params.make} />}</Route>
      <Route path="/inventory/make/:make/model/:model">{(params) => <Inventory makeSlug={params.make} modelSlug={params.model} />}</Route>
      <Route path="/inventory/:slug">{(params) => <VehicleDetails id={params.slug} />}</Route>
      <Route path="/vehicle/:id">{(params) => <VehicleDetails id={params.id} legacyRedirect />}</Route>
      <Route path="/consign" component={Consign} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/inventory" component={AdminInventory} />
      <Route path="/admin/leads" component={AdminLeads} />
      <Route path="/admin/consignments" component={AdminConsignments} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/roadmap" component={AdminRoadmap} />
      <Route path="/admin/seo-tools" component={AdminSeoTools} />
      <Route path="/admin/notifications" component={AdminPushNotifications} />
      <Route path="/admin/system-check" component={AdminSystemCheck} />
      <Route path="/admin/sms" component={AdminSmsConversations} />
      <Route path="/admin-legacy" component={Admin} />
      <Route path="/seller-portal" component={SellerPortal} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/trade-in" component={TradeIn} />
      <Route path="/compare" component={Compare} />
      <Route path="/appointments" component={Appointments} />
      <Route path="/get-approved" component={CreditApp} />
      <Route path="/saved" component={SavedVehicles} />
      <Route path="/location/:slug">{(params) => <LocationPage slug={params.slug} />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <SavedVehiclesProvider>
          <TooltipProvider>
            <FaviconLoader />
            <LiveChatLoader />
            <Toaster />
            <Router />
            <PushNotificationPromptWrapper />
          </TooltipProvider>
        </SavedVehiclesProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}

export default App;

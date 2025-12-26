import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { useFavicon } from "@/hooks/use-favicon";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Inventory from "@/pages/Inventory";
import VehicleDetails from "@/pages/VehicleDetails";
import Consign from "@/pages/Consign";
import Admin from "@/pages/Admin";
import SellerPortal from "@/pages/SellerPortal";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import TradeIn from "@/pages/TradeIn";
import Compare from "@/pages/Compare";
import Appointments from "@/pages/Appointments";

function FaviconLoader() {
  useFavicon();
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/inventory" component={Inventory} />
      <Route path="/vehicle/:id">{(params) => <VehicleDetails id={params.id} />}</Route>
      <Route path="/consign" component={Consign} />
      <Route path="/admin" component={Admin} />
      <Route path="/seller-portal" component={SellerPortal} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/trade-in" component={TradeIn} />
      <Route path="/compare" component={Compare} />
      <Route path="/appointments" component={Appointments} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <TooltipProvider>
          <FaviconLoader />
          <Toaster />
          <Router />
        </TooltipProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}

export default App;

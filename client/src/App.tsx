import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DecisionFlow from "./pages/DecisionFlow";
import AdminManagement from "./pages/AdminManagement";
import ScenarioComparison from "./pages/ScenarioComparison";
import Login from "./pages/Login";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path={"/"} component={DecisionFlow} />
      <Route path="/admin" component={AdminManagement} />
      <Route path="/decision" component={DecisionFlow} />
      <Route path="/scenario-compare" component={ScenarioComparison} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

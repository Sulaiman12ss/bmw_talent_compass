import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DecisionFlow from "./pages/DecisionFlow";
import AdminManagement from "./pages/AdminManagement";
import ScenarioComparison from "./pages/ScenarioComparison";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={DecisionFlow} />
      <Route path="/admin" component={AdminManagement} />
      <Route path="/decision" component={DecisionFlow} />
      <Route path="/scenario-compare" component={ScenarioComparison} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Decision Intelligence - Focused Hackathon Submission
// Single-page application focused on multi-agent hiring decisions

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

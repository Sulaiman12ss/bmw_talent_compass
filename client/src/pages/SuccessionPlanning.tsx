import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Briefcase, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useLocation } from "wouter";

export default function SuccessionPlanning() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch succession plans
  const { data: plans, isLoading: plansLoading } = trpc.succession.getPlans.useQuery();

  if (!isAuthenticated) {
    return null;
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case "critical":
      case "high":
        return <AlertTriangle className="w-4 h-4" />;
      case "low":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Briefcase className="w-8 h-8 text-blue-600" />
              Succession Planning Assistant
            </h1>
            <p className="text-muted-foreground mt-1">
              Leadership succession scenarios and readiness assessment
            </p>
          </div>
          <Button onClick={() => setLocation("/")}>Back to Dashboard</Button>
        </div>

        {/* Risk Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Critical Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">
                {plans?.filter((p) => p.riskLevel === "critical").length || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">High Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">
                {plans?.filter((p) => p.riskLevel === "high").length || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Medium Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600">
                {plans?.filter((p) => p.riskLevel === "medium").length || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Low Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {plans?.filter((p) => p.riskLevel === "low").length || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Succession Plans */}
        <div className="space-y-4">
          {plansLoading ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">Loading succession plans...</p>
              </CardContent>
            </Card>
          ) : plans && plans.length > 0 ? (
            plans.map((plan) => (
              <Card key={plan.id} className={plan.riskLevel === "critical" ? "border-red-300" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle>{plan.roleName}</CardTitle>
                        <Badge className={getRiskColor(plan.riskLevel)} variant="outline">
                          <span className="flex items-center gap-1">
                            {getRiskIcon(plan.riskLevel)}
                            {plan.riskLevel.charAt(0).toUpperCase() + plan.riskLevel.slice(1)} Risk
                          </span>
                        </Badge>
                      </div>
                      <CardDescription>Role ID: {plan.criticalRoleId}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Readiness Score */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold">Succession Readiness</p>
                      <span className="text-sm font-bold text-blue-600">{plan.readinessScore || 0}%</span>
                    </div>
                    <Progress value={plan.readinessScore || 0} className="h-2" />
                  </div>

                  {/* Current Holder */}
                  {plan.currentHolderId && (
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm font-semibold mb-1">Current Holder</p>
                      <p className="text-sm text-muted-foreground">Employee ID: {plan.currentHolderId}</p>
                    </div>
                  )}

                  {/* Succession Candidates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {plan.primarySuccessor && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-semibold text-green-900 mb-1">Primary Successor</p>
                        <p className="text-sm text-green-800">Employee ID: {plan.primarySuccessor}</p>
                        <p className="text-xs text-green-700 mt-1">Ready for advancement</p>
                      </div>
                    )}
                    {plan.backupSuccessor && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-semibold text-blue-900 mb-1">Backup Successor</p>
                        <p className="text-sm text-blue-800">Employee ID: {plan.backupSuccessor}</p>
                        <p className="text-xs text-blue-700 mt-1">Development in progress</p>
                      </div>
                    )}
                  </div>

                  {/* Development Plan */}
                  {plan.developmentPlan && (
                    <div className="p-3 bg-indigo-50 rounded-lg">
                      <p className="text-sm font-semibold mb-2">Development Plan</p>
                      <p className="text-sm text-muted-foreground">{plan.developmentPlan}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1">
                      View Scenario Analysis
                    </Button>
                    <Button className="flex-1">
                      Update Development Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">No succession plans configured</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recommendations */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle>Succession Planning Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Address Critical Gaps</p>
                <p className="text-sm text-muted-foreground">
                  Prioritize development plans for roles with critical risk levels
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Accelerate Development</p>
                <p className="text-sm text-muted-foreground">
                  Implement targeted training for identified successors
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Monitor Readiness</p>
                <p className="text-sm text-muted-foreground">
                  Track succession readiness scores quarterly
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

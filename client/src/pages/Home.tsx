import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { BarChart3, TrendingUp, Users, AlertCircle, Target, Briefcase } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch dashboard data
  const { data: employees, isLoading: employeesLoading } = trpc.employees.list.useQuery();
  const { data: topTalents, isLoading: talentsLoading } = trpc.talent.getTopTalents.useQuery({ limit: 5 });
  const { data: successionPlans, isLoading: plansLoading } = trpc.succession.getPlans.useQuery();
  const { data: alerts, isLoading: alertsLoading } = trpc.alerts.getUnread.useQuery();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">BMW Talent Compass</CardTitle>
            <CardDescription>AI-Powered HR Decision Support Platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Welcome to the BMW Talent Compass, your comprehensive platform for identifying hidden talent, planning succession, and optimizing compensation across your organization.
            </p>
            <Button className="w-full" onClick={() => window.location.href = "/api/oauth/login"}>
              Sign In with Manus
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Talent Compass Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back, {user?.name || "HR Leader"}</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Employees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employees?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Active workforce</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="w-4 h-4" />
                Hidden Talents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{topTalents?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">High-potential identified</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Succession Plans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{successionPlans?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Critical roles covered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{alerts?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Requiring attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="talent" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="talent" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Talent Spotting
            </TabsTrigger>
            <TabsTrigger value="succession" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Succession
            </TabsTrigger>
            <TabsTrigger value="compensation" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Compensation
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Talent Spotting Tab */}
          <TabsContent value="talent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Hidden Talent Spotter</CardTitle>
                <CardDescription>
                  AI-powered analysis identifying high-potential employees and overlooked talent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {talentsLoading ? (
                    <p className="text-sm text-muted-foreground">Loading talent data...</p>
                  ) : topTalents && topTalents.length > 0 ? (
                    <div className="space-y-2">
                      {topTalents.map((talent) => (
                        <div key={talent.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition">
                          <div className="flex-1">
                            <p className="font-medium">Employee ID: {talent.employeeId}</p>
                            <p className="text-sm text-muted-foreground">Talent Score: {talent.talentScore}/100</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setLocation(`/talent/${talent.employeeId}`)}>
                            View Details
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No talent assessments available yet</p>
                  )}
                  <Button className="w-full mt-4" onClick={() => setLocation("/talent-analysis")}>
                    View Full Talent Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Succession Planning Tab */}
          <TabsContent value="succession" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Succession Planning Assistant</CardTitle>
                <CardDescription>
                  Leadership succession scenarios and readiness assessment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {plansLoading ? (
                    <p className="text-sm text-muted-foreground">Loading succession plans...</p>
                  ) : successionPlans && successionPlans.length > 0 ? (
                    <div className="space-y-2">
                      {successionPlans.slice(0, 5).map((plan) => (
                        <div key={plan.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition">
                          <div className="flex-1">
                            <p className="font-medium">{plan.roleName}</p>
                            <p className="text-sm text-muted-foreground">Risk Level: {plan.riskLevel}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setLocation(`/succession/${plan.criticalRoleId}`)}>
                            View Plan
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No succession plans configured</p>
                  )}
                  <Button className="w-full mt-4" onClick={() => setLocation("/succession-planning")}>
                    View All Succession Plans
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compensation Tab */}
          <TabsContent value="compensation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Compensation Trend Decoder</CardTitle>
                <CardDescription>
                  Market analysis and compensation recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Analyze internal and external compensation data to identify trends and ensure competitive pay equity.
                </p>
                <Button className="w-full" onClick={() => setLocation("/compensation-analysis")}>
                  View Compensation Analysis
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Workforce Analytics</CardTitle>
                <CardDescription>
                  Real-time insights and reporting on workforce metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Comprehensive analytics dashboard showing talent distribution, skill gaps, and organizational health metrics.
                </p>
                <Button className="w-full" onClick={() => setLocation("/analytics")}>
                  View Analytics Dashboard
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Alerts Section */}
        {alerts && alerts.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <AlertCircle className="w-5 h-5" />
                Critical Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="text-sm p-2 bg-white rounded border-l-4 border-orange-500">
                    <p className="font-medium text-orange-900">{alert.title}</p>
                    <p className="text-orange-800">{alert.description}</p>
                  </div>
                ))}
              </div>
              {alerts.length > 3 && (
                <Button variant="outline" className="w-full mt-4" onClick={() => setLocation("/alerts")}>
                  View All Alerts ({alerts.length})
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

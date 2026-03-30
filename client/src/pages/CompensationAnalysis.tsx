import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from "lucide-react";
import { useLocation } from "wouter";

export default function CompensationAnalysis() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (!isAuthenticated) {
    return null;
  }

  // Mock compensation data for demonstration
  const compensationMetrics = [
    {
      department: "Engineering",
      avgSalary: 125000,
      marketBenchmark: 130000,
      percentile: 72,
      trend: "up",
    },
    {
      department: "Product",
      avgSalary: 115000,
      marketBenchmark: 120000,
      percentile: 68,
      trend: "up",
    },
    {
      department: "Sales",
      avgSalary: 105000,
      marketBenchmark: 110000,
      percentile: 65,
      trend: "stable",
    },
    {
      department: "HR",
      avgSalary: 85000,
      marketBenchmark: 88000,
      percentile: 60,
      trend: "down",
    },
  ];

  const trendAnalysis = [
    {
      title: "Market Inflation Impact",
      description: "Industry salaries increased 4.2% YoY",
      impact: "positive",
    },
    {
      title: "Skill Premium",
      description: "AI/ML expertise commands 15% premium",
      impact: "positive",
    },
    {
      title: "Retention Risk",
      description: "Below-market compensation in 2 departments",
      impact: "negative",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <DollarSign className="w-8 h-8 text-green-600" />
              Compensation Trend Decoder
            </h1>
            <p className="text-muted-foreground mt-1">
              Market analysis and compensation recommendations
            </p>
          </div>
          <Button onClick={() => setLocation("/")}>Back to Dashboard</Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Compensation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">$108.5K</p>
              <p className="text-xs text-muted-foreground mt-1">Across all departments</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Market Benchmark</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">$112K</p>
              <p className="text-xs text-muted-foreground mt-1">Industry average</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Competitiveness</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">68%</p>
              <p className="text-xs text-muted-foreground mt-1">Percentile rank</p>
            </CardContent>
          </Card>
        </div>

        {/* Department Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Department Compensation Analysis</CardTitle>
            <CardDescription>
              Comparison of internal salaries vs market benchmarks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {compensationMetrics.map((dept, idx) => (
              <div key={idx} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold">{dept.department}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-muted-foreground">
                        Internal: ${dept.avgSalary.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Market: ${dept.marketBenchmark.toLocaleString()}
                      </span>
                      {dept.trend === "up" && (
                        <Badge className="bg-green-100 text-green-800">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Rising
                        </Badge>
                      )}
                      {dept.trend === "down" && (
                        <Badge className="bg-red-100 text-red-800">
                          <TrendingDown className="w-3 h-3 mr-1" />
                          Declining
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Percentile Rank</span>
                    <span className="text-xs font-semibold">{dept.percentile}%</span>
                  </div>
                  <Progress value={dept.percentile} className="h-2" />
                </div>
                <div className="h-px bg-border" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Trend Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Market Trend Analysis</CardTitle>
            <CardDescription>
              Key compensation trends and their impact on BMW
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {trendAnalysis.map((trend, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border-l-4 ${
                  trend.impact === "positive"
                    ? "bg-green-50 border-green-500"
                    : "bg-red-50 border-red-500"
                }`}
              >
                <div className="flex items-start gap-3">
                  {trend.impact === "positive" ? (
                    <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-semibold text-sm">{trend.title}</p>
                    <p className="text-sm text-muted-foreground">{trend.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle>Compensation Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <BarChart3 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Adjust Engineering Salaries</p>
                <p className="text-sm text-muted-foreground">
                  Consider 3-5% increase to align with market benchmarks
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Implement Skill-Based Premiums</p>
                <p className="text-sm text-muted-foreground">
                  Offer 10-15% premium for AI/ML and EV expertise
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <TrendingDown className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Monitor HR Department</p>
                <p className="text-sm text-muted-foreground">
                  Address below-market compensation to prevent talent loss
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button variant="outline" className="flex-1">
            Export Report
          </Button>
          <Button className="flex-1">
            Generate Recommendations
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

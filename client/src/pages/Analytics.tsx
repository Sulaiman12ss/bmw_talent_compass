import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, PieChart, LineChart } from "lucide-react";
import { useLocation } from "wouter";
import { BarChart, Bar, PieChart as PieChartComponent, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart as LineChartComponent, Line } from "recharts";

export default function Analytics() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (!isAuthenticated) {
    return null;
  }

  // Mock data for charts
  const departmentData = [
    { name: "Engineering", employees: 120, highPotential: 35 },
    { name: "Product", employees: 85, highPotential: 22 },
    { name: "Sales", employees: 95, highPotential: 18 },
    { name: "HR", employees: 45, highPotential: 8 },
    { name: "Operations", employees: 65, highPotential: 12 },
  ];

  const skillDistribution = [
    { name: "Technical", value: 45, fill: "#3b82f6" },
    { name: "Leadership", value: 25, fill: "#10b981" },
    { name: "Domain", value: 20, fill: "#f59e0b" },
    { name: "Other", value: 10, fill: "#8b5cf6" },
  ];

  const performanceTrend = [
    { month: "Jan", avgScore: 72, targetScore: 75 },
    { month: "Feb", avgScore: 73, targetScore: 75 },
    { month: "Mar", avgScore: 74, targetScore: 75 },
    { month: "Apr", avgScore: 75, targetScore: 75 },
    { month: "May", avgScore: 76, targetScore: 75 },
    { month: "Jun", avgScore: 77, targetScore: 75 },
  ];

  const levelDistribution = [
    { level: "Junior", count: 85 },
    { level: "Mid", count: 120 },
    { level: "Senior", count: 95 },
    { level: "Lead", count: 45 },
    { level: "Manager", count: 35 },
    { level: "Director", count: 15 },
    { level: "Executive", count: 8 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              Workforce Analytics
            </h1>
            <p className="text-muted-foreground mt-1">
              Real-time insights and reporting on workforce metrics
            </p>
          </div>
          <Button onClick={() => setLocation("/")}>Back to Dashboard</Button>
        </div>

        {/* Department Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Department Overview</CardTitle>
            <CardDescription>
              Employee distribution and high-potential talent by department
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="employees" fill="#3b82f6" name="Total Employees" />
                <Bar dataKey="highPotential" fill="#10b981" name="High Potential" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Skills Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Skills Distribution</CardTitle>
              <CardDescription>
                Breakdown of employee skills by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChartComponent>
                  <Pie
                    data={skillDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {skillDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChartComponent>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Level Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Career Level Distribution</CardTitle>
              <CardDescription>
                Employee distribution across career levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {levelDistribution.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{item.level}</span>
                      <span className="text-sm text-muted-foreground">{item.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(item.count / 120) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Trend</CardTitle>
            <CardDescription>
              Average performance scores vs target over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChartComponent data={performanceTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avgScore"
                  stroke="#3b82f6"
                  name="Average Score"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="targetScore"
                  stroke="#10b981"
                  name="Target Score"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </LineChartComponent>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Key Metrics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Workforce</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">403</p>
              <p className="text-xs text-muted-foreground mt-1">Active employees</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">High Potential %</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">28%</p>
              <p className="text-xs text-muted-foreground mt-1">113 employees</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Tenure</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">6.2</p>
              <p className="text-xs text-muted-foreground mt-1">Years at company</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Performance Avg</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">77%</p>
              <p className="text-xs text-muted-foreground mt-1">Above target</p>
            </CardContent>
          </Card>
        </div>

        {/* Export Options */}
        <div className="flex gap-4">
          <Button variant="outline" className="flex-1">
            Export as PDF
          </Button>
          <Button variant="outline" className="flex-1">
            Export as CSV
          </Button>
          <Button className="flex-1">
            Schedule Report
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Sparkles, TrendingUp, Target, Award, Zap } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

export default function TalentAnalysis() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all employees and top talents
  const { data: employees, isLoading: employeesLoading } = trpc.employees.list.useQuery();
  const { data: topTalents, isLoading: talentsLoading } = trpc.talent.getTopTalents.useQuery({ limit: 20 });

  if (!isAuthenticated) {
    return null;
  }

  // Filter talents based on search
  const filteredTalents = topTalents?.filter((talent) =>
    talent.assessmentSummary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    talent.recommendedRoles?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-blue-600" />
              Hidden Talent Spotter
            </h1>
            <p className="text-muted-foreground mt-1">
              AI-powered analysis identifying high-potential employees and overlooked talent
            </p>
          </div>
          <Button onClick={() => setLocation("/")}>Back to Dashboard</Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search Talent Assessments</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search by role, skills, or recommendations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Talent Cards */}
        <div className="space-y-4">
          {talentsLoading ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">Loading talent assessments...</p>
              </CardContent>
            </Card>
          ) : filteredTalents.length > 0 ? (
            filteredTalents.map((talent) => (
              <Card key={talent.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-yellow-600" />
                        Employee ID: {talent.employeeId}
                      </CardTitle>
                      <CardDescription>Talent Assessment Report</CardDescription>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">
                      Score: {talent.talentScore}/100
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Talent and Potential Scores */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                      <p className="text-sm text-muted-foreground">Talent Score</p>
                      <p className="text-2xl font-bold text-blue-900">{talent.talentScore}%</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                      <p className="text-sm text-muted-foreground">Potential Score</p>
                      <p className="text-2xl font-bold text-green-900">{talent.potentialScore}%</p>
                    </div>
                  </div>

                  {/* Hidden Talent Flags */}
                  {talent.hiddenTalentFlags && (
                    <div>
                      <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-600" />
                        Hidden Talent Indicators
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {JSON.parse(talent.hiddenTalentFlags).map((flag: string, idx: number) => (
                          <Badge key={idx} variant="secondary">
                            {flag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended Skills */}
                  {talent.recommendedSkills && (
                    <div>
                      <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-600" />
                        Recommended Skills to Develop
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {JSON.parse(talent.recommendedSkills).map((skill: string, idx: number) => (
                          <Badge key={idx} variant="outline">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended Roles */}
                  {talent.recommendedRoles && (
                    <div>
                      <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        Recommended Career Paths
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {JSON.parse(talent.recommendedRoles).map((role: string, idx: number) => (
                          <Badge key={idx} className="bg-green-100 text-green-800">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Assessment Summary */}
                  {talent.assessmentSummary && (
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm font-semibold mb-2">AI Assessment Summary</p>
                      <p className="text-sm text-muted-foreground">{talent.assessmentSummary}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setLocation(`/employees/${talent.employeeId}`)}
                    >
                      View Full Profile
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => setLocation(`/talent/${talent.employeeId}`)}
                    >
                      Development Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  {searchTerm ? "No talents match your search criteria" : "No talent assessments available yet"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary Statistics */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle>Talent Pool Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Employees</p>
              <p className="text-2xl font-bold">{employees?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Assessed Talents</p>
              <p className="text-2xl font-bold">{topTalents?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Talent Score</p>
              <p className="text-2xl font-bold">
                {topTalents && topTalents.length > 0
                  ? Math.round(topTalents.reduce((sum, t) => sum + t.talentScore, 0) / topTalents.length)
                  : 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

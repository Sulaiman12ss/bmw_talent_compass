import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Briefcase, Calendar, TrendingUp, Award, BookOpen, AlertCircle } from "lucide-react";
import { Streamdown } from "streamdown";
import { useState } from "react";

export default function EmployeeProfile() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const employeeId = parseInt(params.id || "0");
  const [generatingInsights, setGeneratingInsights] = useState(false);

  const { data: employeeData, isLoading, error } = trpc.employees.getById.useQuery({ id: employeeId });
  const generateTalentAssessment = trpc.insights.generateTalentAssessment.useMutation();
  const generateUpskillPath = trpc.insights.generateUpskillPath.useMutation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading employee profile...</p>
        </div>
      </div>
    );
  }

  if (error || !employeeData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Employee Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">The employee profile you're looking for doesn't exist.</p>
            <Button onClick={() => navigate("/")} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { employee, skills, performance, training, talentAssessment } = employeeData;

  const handleGenerateTalentAssessment = async () => {
    setGeneratingInsights(true);
    try {
      await generateTalentAssessment.mutateAsync({ employeeId });
    } catch (err) {
      console.error("Error generating assessment:", err);
    } finally {
      setGeneratingInsights(false);
    }
  };

  const handleGenerateUpskillPath = async () => {
    setGeneratingInsights(true);
    try {
      await generateUpskillPath.mutateAsync({
        employeeId,
        futureNeeds: ["AI/ML", "Leadership", "EV Technology"],
      });
    } catch (err) {
      console.error("Error generating upskill path:", err);
    } finally {
      setGeneratingInsights(false);
    }
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      junior: "bg-blue-100 text-blue-800",
      mid: "bg-green-100 text-green-800",
      senior: "bg-purple-100 text-purple-800",
      lead: "bg-orange-100 text-orange-800",
      manager: "bg-red-100 text-red-800",
      director: "bg-indigo-100 text-indigo-800",
      executive: "bg-pink-100 text-pink-800",
    };
    return colors[level] || "bg-gray-100 text-gray-800";
  };

  const getProficiencyColor = (level: string) => {
    const colors: Record<string, string> = {
      beginner: "text-blue-600",
      intermediate: "text-green-600",
      advanced: "text-orange-600",
      expert: "text-red-600",
    };
    return colors[level] || "text-gray-600";
  };

  const getPerformanceColor = (rating: string) => {
    const colors: Record<string, string> = {
      exceeds: "text-green-600 bg-green-50",
      meets: "text-blue-600 bg-blue-50",
      below: "text-red-600 bg-red-50",
    };
    return colors[rating] || "text-gray-600 bg-gray-50";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button onClick={() => navigate("/")} variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {employee.firstName} {employee.lastName}
                </h1>
                <p className="text-lg text-gray-600 mt-1">{employee.position}</p>
                <div className="flex items-center gap-4 mt-4">
                  <Badge className={getLevelColor(employee.level)}>{employee.level.toUpperCase()}</Badge>
                  <Badge variant="outline">{employee.department}</Badge>
                  <span className="text-sm text-gray-600">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {employee.yearsAtCompany} years at BMW
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{employee.email}</span>
                </div>
              </div>
            </div>
            {employee.biography && (
              <p className="text-gray-700 mt-4 italic">{employee.biography}</p>
            )}
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Current Role
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{employee.position}</p>
                  <p className="text-xs text-gray-600 mt-1">{employee.yearsInRole} years in role</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Talent Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {talentAssessment?.talentScore || "N/A"}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Based on performance & skills</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Potential Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {talentAssessment?.potentialScore || "N/A"}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Growth potential</p>
                </CardContent>
              </Card>
            </div>

            {talentAssessment && (
              <Card>
                <CardHeader>
                  <CardTitle>Talent Assessment Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <Streamdown>{talentAssessment.assessmentSummary}</Streamdown>
                  {talentAssessment.hiddenTalentFlags && talentAssessment.hiddenTalentFlags.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-sm mb-2">Hidden Talents & Strengths</h4>
                      <div className="flex flex-wrap gap-2">
                        {JSON.parse(talentAssessment.hiddenTalentFlags).map((flag: string, idx: number) => (
                          <Badge key={idx} variant="secondary">
                            {flag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Technical & Professional Skills</CardTitle>
                <CardDescription>Skills with proficiency levels and years of experience</CardDescription>
              </CardHeader>
              <CardContent>
                {skills && skills.length > 0 ? (
                  <div className="space-y-4">
                    {skills.map((skill) => (
                      <div key={skill.id} className="border-b pb-4 last:border-b-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{skill.skillName}</h4>
                            <p className="text-sm text-gray-600">{skill.category}</p>
                          </div>
                          <Badge variant="outline" className={getProficiencyColor(skill.proficiencyLevel)}>
                            {skill.proficiencyLevel}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span>{skill.yearsOfExperience} years experience</span>
                          {skill.endorsements && skill.endorsements > 0 && (
                            <span className="flex items-center gap-1">
                              <Award className="w-3 h-3" />
                              {skill.endorsements} endorsements
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No skills recorded yet.</p>
                )}
              </CardContent>
            </Card>

            {talentAssessment && talentAssessment.recommendedSkills && (
              <Card>
                <CardHeader>
                  <CardTitle>Recommended Skills for Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {JSON.parse(talentAssessment.recommendedSkills).map((skill: string, idx: number) => (
                      <Badge key={idx} className="bg-blue-100 text-blue-800">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            {performance && performance.length > 0 ? (
              performance.map((perf) => (
                <Card key={perf.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Performance Rating - {perf.ratingYear}</CardTitle>
                      <Badge className={getPerformanceColor(perf.overallRating)}>
                        {perf.overallRating.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Technical Score</p>
                        <p className="text-2xl font-bold">{perf.technicalScore}/5</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Leadership Score</p>
                        <p className="text-2xl font-bold">{perf.leadershipScore}/5</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Collaboration Score</p>
                        <p className="text-2xl font-bold">{perf.collaborationScore}/5</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Innovation Score</p>
                        <p className="text-2xl font-bold">{perf.innovationScore}/5</p>
                      </div>
                    </div>
                    {perf.comments && (
                      <div className="border-t pt-4">
                        <p className="text-sm text-gray-600 mb-2">Reviewer Comments</p>
                        <p className="text-gray-900">{perf.comments}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-gray-600">No performance ratings available yet.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Training Tab */}
          <TabsContent value="training" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Training & Development</CardTitle>
                <CardDescription>Completed, in-progress, and planned training programs</CardDescription>
              </CardHeader>
              <CardContent>
                {training && training.length > 0 ? (
                  <div className="space-y-4">
                    {training.map((train) => (
                      <div key={train.id} className="border-b pb-4 last:border-b-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{train.trainingName}</h4>
                            <p className="text-sm text-gray-600">{train.category}</p>
                          </div>
                          <Badge
                            variant={
                              train.status === "completed"
                                ? "default"
                                : train.status === "in_progress"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {train.status === "in_progress" ? "In Progress" : train.status === "completed" ? "Completed" : "Planned"}
                          </Badge>
                        </div>
                        {train.hoursSpent && (
                          <p className="text-sm text-gray-600 mt-2">
                            <BookOpen className="w-3 h-3 inline mr-1" />
                            {train.hoursSpent} hours
                          </p>
                        )}
                        {train.completionDate && (
                          <p className="text-sm text-gray-600">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {new Date(train.completionDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No training records available yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI-Generated Recommendations</CardTitle>
                <CardDescription>Personalized insights for career development and growth</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleGenerateTalentAssessment}
                  disabled={generatingInsights}
                  className="w-full"
                >
                  {generatingInsights ? "Generating..." : "Generate Fresh Talent Assessment"}
                </Button>
                <Button
                  onClick={handleGenerateUpskillPath}
                  disabled={generatingInsights}
                  variant="outline"
                  className="w-full"
                >
                  {generatingInsights ? "Generating..." : "Generate Upskilling Path"}
                </Button>
              </CardContent>
            </Card>

            {talentAssessment?.recommendedRoles && (
              <Card>
                <CardHeader>
                  <CardTitle>Recommended Career Paths</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {JSON.parse(talentAssessment.recommendedRoles).map((role: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-900">{role}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {generateUpskillPath.data && (
              <Card>
                <CardHeader>
                  <CardTitle>Personalized Upskilling Path</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Recommended Path</h4>
                    <Streamdown>{generateUpskillPath.data.recommendedPath}</Streamdown>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Training Programs</h4>
                    <div className="flex flex-wrap gap-2">
                      {generateUpskillPath.data.trainingPrograms?.map((prog: string, idx: number) => (
                        <Badge key={idx} variant="secondary">
                          {prog}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Timeline</h4>
                    <p className="text-gray-700">{generateUpskillPath.data.timeline}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

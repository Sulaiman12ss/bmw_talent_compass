import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Streamdown } from "streamdown";
import { useLocation } from "wouter";

/**
 * Scenario Comparison Page (Fix 4)
 * Runs analysis across ALL scenarios and displays side-by-side rankings
 */

export default function ScenarioComparison() {
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<number[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [, navigate] = useLocation();

  const jobsQuery = trpc.decision.getJobs.useQuery();
  const candidatesQuery = trpc.decision.getCandidates.useQuery();
  const compareScenarios = trpc.decision.compareScenarios.useMutation();

  const handleCompare = async () => {
    if (!selectedJobId || selectedCandidateIds.length === 0) {
      alert("Please select a job and at least one candidate");
      return;
    }

    setIsComparing(true);
    try {
      await compareScenarios.mutateAsync({
        jobId: selectedJobId,
        candidateIds: selectedCandidateIds,
      });
    } finally {
      setIsComparing(false);
    }
  };

  const result = compareScenarios.data;

  if (jobsQuery.isLoading || candidatesQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    );
  }

  const getRankIcon = (baselineRank: number, scenarioRank: number) => {
    if (scenarioRank < baselineRank) return <TrendingUp className="w-3 h-3 text-green-600" />;
    if (scenarioRank > baselineRank) return <TrendingDown className="w-3 h-3 text-red-600" />;
    return <Minus className="w-3 h-3 text-slate-400" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="sm" onClick={() => navigate("/decision")}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-8 h-8" />
              Scenario Comparison
            </h1>
            <p className="text-slate-600">Compare candidate rankings across all business scenarios</p>
          </div>
        </div>

        {!result ? (
          <>
            {/* Setup */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Select Job</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {jobsQuery.data?.map((job) => (
                      <Button
                        key={job.id}
                        variant={selectedJobId === job.id ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => setSelectedJobId(job.id)}
                      >
                        {job.jobTitle}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Select Candidates</CardTitle>
                  <CardDescription>All selected candidates will be ranked across every scenario</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {candidatesQuery.data?.map((c) => (
                      <Button
                        key={c.id}
                        variant={selectedCandidateIds.includes(c.id) ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => {
                          setSelectedCandidateIds((prev) =>
                            prev.includes(c.id) ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                          );
                        }}
                      >
                        {c.firstName} {c.lastName}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Button
              size="lg"
              onClick={handleCompare}
              disabled={!selectedJobId || selectedCandidateIds.length === 0 || isComparing}
              className="w-full"
            >
              {isComparing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running Multi-Scenario Comparison (this may take 2-3 minutes)...
                </>
              ) : (
                "Compare All Scenarios"
              )}
            </Button>
          </>
        ) : (
          <div className="space-y-6">
            {/* Comparison Matrix */}
            <Card>
              <CardHeader>
                <CardTitle>Side-by-Side Ranking Matrix</CardTitle>
                <CardDescription>
                  Same candidates ranked across Baseline + {result.scenarios.length} scenarios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="text-left p-3 font-semibold">Candidate</th>
                        <th className="text-center p-3 font-semibold">
                          <div>Baseline</div>
                          <div className="text-xs font-normal text-slate-500">Score / Rank</div>
                        </th>
                        {result.scenarios.map((s) => (
                          <th key={s.id} className="text-center p-3 font-semibold whitespace-normal min-w-[8rem]">
                            <div className="break-words">{s.name}</div>
                            <div className="text-xs font-normal text-slate-500">Score / Rank</div>
                          </th>
                        ))}
                        <th className="text-center p-3 font-semibold">Mis-Hire Risk</th>
                        <th className="text-center p-3 font-semibold">Est. Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.comparisonMatrix
                        .sort((a, b) => ((a as any).baselineRank || 99) - ((b as any).baselineRank || 99))
                        .map((row) => {
                          const baselineRank = (row as any).baselineRank || 0;
                          return (
                            <tr key={row.candidateId} className="border-b hover:bg-slate-50">
                              <td className="p-3 min-w-[10rem]">
                                <div className="font-medium whitespace-normal break-words">{row.candidateName}</div>
                                <div className="text-xs text-slate-500 whitespace-normal break-words">{row.currentRole} at {row.currentCompany}</div>
                              </td>
                              <td className="text-center p-3">
                                <div className="font-bold text-lg">{row.baselineScore}</div>
                                <Badge variant="outline" className="text-xs">#{baselineRank}</Badge>
                              </td>
                              {row.scenarioScores.map((ss, idx) => {
                                const scenarioRank = (ss as any).rank || 0;
                                return (
                                  <td key={idx} className="text-center p-3">
                                    <div className="font-bold text-lg">{ss.adjustedFitScore}</div>
                                    <div className="flex items-center justify-center gap-1">
                                      <Badge variant="outline" className="text-xs">#{scenarioRank}</Badge>
                                      {getRankIcon(baselineRank, scenarioRank)}
                                    </div>
                                  </td>
                                );
                              })}
                              <td className="text-center p-3">
                                <span className={`font-bold ${row.misHireRiskScore > 60 ? "text-red-600" : row.misHireRiskScore > 40 ? "text-amber-600" : "text-green-600"}`}>
                                  {row.misHireRiskScore}/100
                                </span>
                              </td>
                              <td className="text-center p-3">
                                <span className="font-semibold">€{Math.round(row.estimatedMisHireCostEUR).toLocaleString()}</span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Scenario Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Baseline */}
              <Card className="border-2 border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Baseline Recommendation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-xl">{result.baselineRecommendation.candidateName}</span>
                    <Badge>{result.baselineRecommendation.confidenceScore}% confidence</Badge>
                  </div>
                  <Streamdown className="text-sm">{result.baselineRecommendation.executiveSummary}</Streamdown>
                </CardContent>
              </Card>

              {/* Per-Scenario */}
              {result.scenarioRecommendations.map((sr) => (
                <Card key={sr.scenarioId} className="border-2 border-indigo-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{sr.scenarioName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-xl">{sr.candidateName}</span>
                      <Badge>{sr.confidenceScore}% confidence</Badge>
                    </div>
                    <Streamdown className="text-sm">{sr.executiveSummary}</Streamdown>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Key Insight */}
            <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
              <CardHeader>
                <CardTitle>Key Insight: Scenario Sensitivity</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const uniqueRecommendations = new Set([
                    result.baselineRecommendation.candidateName,
                    ...result.scenarioRecommendations.map((sr) => sr.candidateName),
                  ]);
                  if (uniqueRecommendations.size === 1) {
                    return (
                      <p className="text-sm">
                        <strong>{result.baselineRecommendation.candidateName}</strong> is the recommended candidate across
                        all scenarios, indicating a robust choice that performs well regardless of business context changes.
                      </p>
                    );
                  }
                  return (
                    <p className="text-sm">
                      The recommended candidate changes across scenarios ({uniqueRecommendations.size} different recommendations),
                      indicating that the hiring decision is <strong>scenario-sensitive</strong>. The CHRO should consider which
                      business scenario is most likely before making a final decision.
                    </p>
                  );
                })()}
              </CardContent>
            </Card>

            <Button
              variant="outline"
              onClick={() => {
                compareScenarios.reset();
                setSelectedJobId(null);
                setSelectedCandidateIds([]);
              }}
              className="w-full"
            >
              Run Another Comparison
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

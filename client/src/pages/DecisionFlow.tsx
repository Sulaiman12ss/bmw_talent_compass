import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle, AlertCircle, TrendingUp, Settings, BarChart3, Shield, Users, FileText, Circle } from "lucide-react";
import { Streamdown } from "streamdown";
import { useLocation } from "wouter";

// ============================================================================
// Agent Step Progress Types
// ============================================================================
type StepStatus = "pending" | "running" | "complete";

interface AgentStep {
  id: string;
  label: string;
  subLabel?: string;
  status: StepStatus;
}

// ============================================================================
// AgentProgressStepper Component
// ============================================================================
function AgentProgressStepper({ steps }: { steps: AgentStep[] }) {
  return (
    <div className="space-y-3">
      {steps.map((step, idx) => (
        <div key={step.id} className="flex items-start gap-3">
          {/* Icon */}
          <div className="mt-0.5 shrink-0">
            {step.status === "complete" ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : step.status === "running" ? (
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            ) : (
              <Circle className="w-5 h-5 text-slate-300" />
            )}
          </div>
          {/* Label */}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${
              step.status === "complete" ? "text-green-700" :
              step.status === "running" ? "text-blue-700" :
              "text-slate-400"
            }`}>
              {step.label}
            </p>
            {step.subLabel && step.status === "running" && (
              <p className="text-xs text-slate-500 mt-0.5">{step.subLabel}</p>
            )}
            {step.status === "complete" && (
              <p className="text-xs text-green-600 mt-0.5">Done</p>
            )}
          </div>
          {/* Connector line */}
          {idx < steps.length - 1 && (
            <div className="absolute ml-2.5 mt-5 w-0.5 h-3 bg-slate-200" style={{ position: "relative", left: "-2.25rem", top: "0.5rem", marginLeft: 0 }} />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * DecisionFlow Page - Multi-Agent Decision Intelligence Pipeline (v2)
 * Displays: Executive Summary, KPI Metrics, BMW Leader Pairings, Scenario Weights, Risk Assessment
 */

export default function DecisionFlow() {
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<number[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [, navigate] = useLocation();

  const jobsQuery = trpc.decision.getJobs.useQuery();
  const candidatesQuery = trpc.decision.getCandidates.useQuery();
  const scenariosQuery = trpc.decision.getScenarios.useQuery();
  const analyzeDecision = trpc.decision.analyzeDecision.useMutation();

  // Clear all timers on unmount
  useEffect(() => {
    return () => { timerRefs.current.forEach(clearTimeout); };
  }, []);

  const buildInitialSteps = (candidateIds: number[], hasScenario: boolean): AgentStep[] => {
    const candidates = candidatesQuery.data?.filter(c => candidateIds.includes(c.id)) || [];
    const steps: AgentStep[] = [
      { id: "jd", label: "JD Agent — Parsing job requirements", status: "pending" },
      { id: "cv", label: "CV Agent — Scoring candidates", status: "pending" },
      { id: "leadership", label: "Leadership Agent — Assessing team fit", status: "pending" },
    ];
    if (hasScenario) {
      steps.push({ id: "scenario", label: "Scenario Agent — Re-ranking under scenario", status: "pending" });
    }
    steps.push({ id: "decision", label: "Decision Agent — Synthesising recommendation", status: "pending" });
    return steps;
  };

  const scheduleProgressUpdates = (candidateIds: number[], hasScenario: boolean) => {
    const candidates = candidatesQuery.data?.filter(c => candidateIds.includes(c.id)) || [];
    const timers: ReturnType<typeof setTimeout>[] = [];

    const update = (delay: number, fn: (prev: AgentStep[]) => AgentStep[]) => {
      timers.push(setTimeout(() => setAgentSteps(fn), delay));
    };

    // T+0: JD Agent starts
    update(0, steps => steps.map(s => s.id === "jd" ? { ...s, status: "running", subLabel: "Extracting competencies and priority weights..." } : s));

    // T+5s: JD complete, CV starts
    update(5000, steps => steps.map(s =>
      s.id === "jd" ? { ...s, status: "complete", subLabel: undefined } :
      s.id === "cv" ? { ...s, status: "running", subLabel: `Scoring ${candidates[0]?.firstName || "candidates"}...` } : s
    ));

    // T+9s, 13s, 17s, 21s: per-candidate CV sub-labels
    candidates.slice(1).forEach((c, idx) => {
      update(9000 + idx * 4000, steps => steps.map(s =>
        s.id === "cv" ? { ...s, subLabel: `Scoring ${c.firstName} ${c.lastName}...` } : s
      ));
    });

    // T+30s: CV complete, Leadership starts
    update(30000, steps => steps.map(s =>
      s.id === "cv" ? { ...s, status: "complete", subLabel: undefined } :
      s.id === "leadership" ? { ...s, status: "running", subLabel: `Assessing ${candidates[0]?.firstName || "candidates"} vs. BMW leaders...` } : s
    ));

    // T+34s, 38s, 42s, 46s: per-candidate Leadership sub-labels
    candidates.slice(1).forEach((c, idx) => {
      update(34000 + idx * 4000, steps => steps.map(s =>
        s.id === "leadership" ? { ...s, subLabel: `Assessing ${c.firstName} ${c.lastName} vs. BMW leaders...` } : s
      ));
    });

    if (hasScenario) {
      // T+55s: Leadership complete, Scenario starts
      update(55000, steps => steps.map(s =>
        s.id === "leadership" ? { ...s, status: "complete", subLabel: undefined } :
        s.id === "scenario" ? { ...s, status: "running", subLabel: `Re-ranking ${candidates[0]?.firstName || "candidates"} under scenario...` } : s
      ));

      candidates.slice(1).forEach((c, idx) => {
        update(59000 + idx * 3000, steps => steps.map(s =>
          s.id === "scenario" ? { ...s, subLabel: `Re-ranking ${c.firstName} ${c.lastName}...` } : s
        ));
      });

      // T+75s: Scenario complete, Decision starts
      update(75000, steps => steps.map(s =>
        s.id === "scenario" ? { ...s, status: "complete", subLabel: undefined } :
        s.id === "decision" ? { ...s, status: "running", subLabel: "Synthesising final recommendation..." } : s
      ));
    } else {
      // T+55s: Leadership complete, Decision starts (no scenario)
      update(55000, steps => steps.map(s =>
        s.id === "leadership" ? { ...s, status: "complete", subLabel: undefined } :
        s.id === "decision" ? { ...s, status: "running", subLabel: "Synthesising final recommendation..." } : s
      ));
    }

    timerRefs.current = timers;
  };

  const handleAnalyze = async () => {
    if (!selectedJobId || selectedCandidateIds.length === 0) {
      alert("Please select a job and at least one candidate");
      return;
    }

    // Clear any previous timers
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];

    const hasScenario = selectedScenarioId !== null;
    const initialSteps = buildInitialSteps(selectedCandidateIds, hasScenario);
    setAgentSteps(initialSteps);
    setIsAnalyzing(true);

    // Schedule frontend progress updates
    scheduleProgressUpdates(selectedCandidateIds, hasScenario);

    try {
      await analyzeDecision.mutateAsync({
        jobId: selectedJobId,
        candidateIds: selectedCandidateIds,
        scenarioId: selectedScenarioId || undefined,
      });
    } finally {
      // Clear all timers and mark all steps complete
      timerRefs.current.forEach(clearTimeout);
      timerRefs.current = [];
      setAgentSteps(prev => prev.map(s => ({ ...s, status: "complete", subLabel: undefined })));
      setIsAnalyzing(false);
    }
  };

  const result = analyzeDecision.data;
  const selectedJob = jobsQuery.data?.find((j) => j.id === selectedJobId);
  const selectedCandidates = candidatesQuery.data?.filter((c) =>
    selectedCandidateIds.includes(c.id)
  ) || [];
  const selectedScenario = scenariosQuery.data?.find((s) => s.id === selectedScenarioId);

  if (jobsQuery.error || candidatesQuery.error || scenariosQuery.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8 flex items-center justify-center">
        <Card className="w-full max-w-md border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">Error Loading Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-800 mb-4">
              {jobsQuery.error?.message || candidatesQuery.error?.message || scenariosQuery.error?.message || "Unknown error"}
            </p>
            <Button onClick={() => window.location.reload()}>Reload Page</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (jobsQuery.isLoading || candidatesQuery.isLoading || scenariosQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-slate-600" />
          <p className="text-slate-600">Loading decision data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Decision Intelligence</h1>
            <p className="text-slate-600">Multi-Agent AI Analysis for Hiring Decisions</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/scenario-compare")} variant="outline" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Compare Scenarios
            </Button>
            <Button onClick={() => navigate("/admin")} variant="outline" className="gap-2">
              <Settings className="w-4 h-4" />
              Manage Data
            </Button>
          </div>
        </div>

        {!result ? (
          <>
            {/* Setup Phase */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Job Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Select Job
                  </CardTitle>
                  <CardDescription>Choose the position to fill</CardDescription>
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

              {/* Candidate Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Select Candidates
                  </CardTitle>
                  <CardDescription>Choose candidates to evaluate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {candidatesQuery.data?.map((candidate) => (
                      <Button
                        key={candidate.id}
                        variant={selectedCandidateIds.includes(candidate.id) ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => {
                          setSelectedCandidateIds((prev) =>
                            prev.includes(candidate.id)
                              ? prev.filter((id) => id !== candidate.id)
                              : [...prev, candidate.id]
                          );
                        }}
                      >
                        {candidate.firstName} {candidate.lastName}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Scenario Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Select Scenario
                  </CardTitle>
                  <CardDescription>Optional: Business context</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button
                      variant={selectedScenarioId === null ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => setSelectedScenarioId(null)}
                    >
                      No Scenario
                    </Button>
                    {scenariosQuery.data?.map((scenario) => (
                      <Button
                        key={scenario.id}
                        variant={selectedScenarioId === scenario.id ? "default" : "outline"}
                        className="w-full justify-start text-xs"
                        onClick={() => setSelectedScenarioId(scenario.id)}
                      >
                        {scenario.name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Analyze Button + Progress Indicator */}
            <div className="mb-8">
              <Button
                size="lg"
                onClick={handleAnalyze}
                disabled={!selectedJobId || selectedCandidateIds.length === 0 || isAnalyzing}
                className="w-full mb-6"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Running 5-Agent Pipeline...
                  </>
                ) : (
                  "Execute Decision Analysis"
                )}
              </Button>

              {/* Agent Step Progress Indicator */}
              {isAnalyzing && agentSteps.length > 0 && (
                <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-blue-900">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      Multi-Agent Pipeline Running
                    </CardTitle>
                    <CardDescription className="text-blue-700">
                      5 AI agents are analysing your selection. This typically takes 60–90 seconds.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {agentSteps.map((step, idx) => (
                        <div key={step.id} className="flex items-start gap-3">
                          {/* Step number + icon */}
                          <div className="flex flex-col items-center shrink-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                              step.status === "complete"
                                ? "bg-green-100 border-green-400 text-green-700"
                                : step.status === "running"
                                ? "bg-blue-100 border-blue-400 text-blue-700"
                                : "bg-slate-100 border-slate-300 text-slate-400"
                            }`}>
                              {step.status === "complete" ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : step.status === "running" ? (
                                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                              ) : (
                                <span>{idx + 1}</span>
                              )}
                            </div>
                            {idx < agentSteps.length - 1 && (
                              <div className={`w-0.5 h-6 mt-1 ${
                                step.status === "complete" ? "bg-green-300" : "bg-slate-200"
                              }`} />
                            )}
                          </div>

                          {/* Step label */}
                          <div className="flex-1 pt-1 pb-2">
                            <p className={`text-sm font-semibold ${
                              step.status === "complete" ? "text-green-700" :
                              step.status === "running" ? "text-blue-800" :
                              "text-slate-400"
                            }`}>
                              {step.label}
                            </p>
                            {step.status === "running" && step.subLabel && (
                              <p className="text-xs text-blue-600 mt-0.5 italic">{step.subLabel}</p>
                            )}
                            {step.status === "complete" && (
                              <p className="text-xs text-green-600 mt-0.5">✓ Complete</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <p className="text-xs text-blue-600 text-center">
                        Step timing is estimated. Results will appear automatically when all agents complete.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-6">
            {/* CHRO Executive Summary */}
            <Card className="border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <FileText className="w-6 h-6" />
                  Executive Summary
                </CardTitle>
                <CardDescription>CHRO-ready recommendation brief</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white p-6 rounded-lg border border-blue-200 shadow-sm">
                  <Streamdown className="text-base leading-relaxed">{result.recommendation.executiveSummary}</Streamdown>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <p className="text-sm text-slate-600 mb-1">Recommended Candidate</p>
                    <p className="text-xl font-bold text-slate-900">
                      {result.recommendation.recommendedCandidateName}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <p className="text-sm text-slate-600 mb-1">Confidence Score</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-3">
                        <div
                          className="bg-green-500 h-3 rounded-full transition-all"
                          style={{ width: `${result.recommendation.confidenceScore}%` }}
                        />
                      </div>
                      <span className="font-bold text-lg">{result.recommendation.confidenceScore}%</span>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <p className="text-sm text-slate-600 mb-1">Position</p>
                    <p className="text-xl font-bold text-slate-900">{selectedJob?.jobTitle}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Analysis Tabs */}
            <Tabs defaultValue="kpi" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="kpi">KPI Metrics</TabsTrigger>
                <TabsTrigger value="candidates">CV Analysis</TabsTrigger>
                <TabsTrigger value="leadership">Leadership</TabsTrigger>
                <TabsTrigger value="jd">JD Weights</TabsTrigger>
                {result.scenarioAnalysis && <TabsTrigger value="scenario">Scenario</TabsTrigger>}
                <TabsTrigger value="risk">Risk & Roadmap</TabsTrigger>
              </TabsList>

              {/* KPI Metrics Tab */}
              <TabsContent value="kpi">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      AI-Derived KPI Metrics
                    </CardTitle>
                    <CardDescription>
                      All metrics calculated by the CV Agent using transparent formulas — not pre-seeded
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-slate-50">
                            <th className="text-left p-3 font-semibold">Candidate</th>
                            <th className="text-center p-3 font-semibold">Fit Score</th>
                            <th className="text-center p-3 font-semibold">Mis-Hire Risk</th>
                            <th className="text-center p-3 font-semibold">Est. Mis-Hire Cost</th>
                            <th className="text-center p-3 font-semibold">Quality of Hire</th>
                            <th className="text-center p-3 font-semibold">Experience Match</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.candidateScores.map((score) => {
                            const candidate = selectedCandidates.find((c) => c.id === score.candidateId);
                            const isRecommended = result.recommendation.recommendedCandidateId === score.candidateId;
                            return (
                              <tr key={score.candidateId} className={`border-b ${isRecommended ? "bg-green-50" : ""}`}>
                                <td className="p-3">
                                  <div className="font-medium">
                                    {candidate?.firstName} {candidate?.lastName}
                                    {isRecommended && <Badge className="ml-2 text-xs">Recommended</Badge>}
                                  </div>
                                  <div className="text-xs text-slate-500">{candidate?.currentRole}</div>
                                </td>
                                <td className="text-center p-3">
                                  <span className="font-bold text-lg">{score.fitScore}</span>
                                  <span className="text-slate-400">/100</span>
                                </td>
                                <td className="text-center p-3">
                                  <span className={`font-bold text-lg ${score.misHireRiskScore > 60 ? "text-red-600" : score.misHireRiskScore > 40 ? "text-amber-600" : "text-green-600"}`}>
                                    {score.misHireRiskScore}
                                  </span>
                                  <span className="text-slate-400">/100</span>
                                </td>
                                <td className="text-center p-3">
                                  <span className={`font-bold ${score.estimatedMisHireCostEUR > 500000 ? "text-red-600" : "text-slate-700"}`}>
                                    €{Math.round(score.estimatedMisHireCostEUR).toLocaleString()}
                                  </span>
                                </td>
                                <td className="text-center p-3">
                                  <span className="font-bold text-lg">{score.qualityOfHireProjection}</span>
                                  <span className="text-slate-400">/100</span>
                                </td>
                                <td className="text-center p-3">
                                  <span className="font-bold text-lg">{score.experienceMatch}</span>
                                  <span className="text-slate-400">/100</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* KPI Formula Transparency */}
                    <div className="mt-6 space-y-3">
                      <h4 className="font-semibold text-slate-700">Formula Transparency (Audit Trail)</h4>
                      {result.candidateScores.map((score) => {
                        const candidate = selectedCandidates.find((c) => c.id === score.candidateId);
                        return (
                          <details key={score.candidateId} className="bg-slate-50 rounded-lg border">
                            <summary className="p-3 cursor-pointer font-medium text-sm">
                              {candidate?.firstName} {candidate?.lastName} — Mis-Hire Cost Derivation
                            </summary>
                            <div className="p-4 pt-0 space-y-2">
                              <div className="bg-white p-3 rounded border text-xs font-mono">
                                <p className="font-semibold mb-1">Formula: {score.misHireCostFormula}</p>
                              </div>
                              <div className="bg-white p-3 rounded border text-sm">
                                <p className="font-semibold mb-1">Risk Score Derivation:</p>
                                <Streamdown className="text-xs">{score.misHireRiskReasoning}</Streamdown>
                              </div>
                            </div>
                          </details>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Candidates Tab - CV Agent Results */}
              <TabsContent value="candidates">
                <Card>
                  <CardHeader>
                    <CardTitle>Candidate Evaluation (CV Agent)</CardTitle>
                    <CardDescription>
                      Skill matching, experience assessment, and enriched profile analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {result.candidateScores.map((score) => {
                        const candidate = selectedCandidates.find((c) => c.id === score.candidateId);
                        return (
                          <div key={score.candidateId} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-bold text-lg">
                                  {candidate?.firstName} {candidate?.lastName}
                                </h4>
                                <p className="text-sm text-slate-600">
                                  {candidate?.currentRole} at {candidate?.currentCompany}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {candidate?.boardExposure && <Badge variant="outline" className="text-xs">Board Exposure</Badge>}
                                  {candidate?.plantScaleExperience && <Badge variant="outline" className="text-xs">Plant Scale</Badge>}
                                  {candidate?.evProgramCredential && <Badge variant="outline" className="text-xs">EV Credential</Badge>}
                                  {candidate?.education?.map((e: any, i: number) => (
                                    <Badge key={i} variant="outline" className="text-xs">{e.degree}</Badge>
                                  ))}
                                </div>
                              </div>
                              <Badge className="text-lg px-3 py-1">{score.fitScore}/100</Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div>
                                <p className="text-xs text-slate-600 mb-1">Experience Match</p>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-slate-200 rounded-full h-2">
                                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${score.experienceMatch}%` }} />
                                  </div>
                                  <span className="text-sm font-semibold">{score.experienceMatch}%</span>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-slate-600 mb-1">Quality of Hire Projection</p>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-slate-200 rounded-full h-2">
                                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${score.qualityOfHireProjection}%` }} />
                                  </div>
                                  <span className="text-sm font-semibold">{score.qualityOfHireProjection}%</span>
                                </div>
                              </div>
                            </div>

                            {/* Skill Matches */}
                            <div className="mb-3">
                              <p className="text-xs font-semibold text-slate-700 mb-2">Skill Gap Analysis:</p>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                {score.skillMatches.map((sm, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-xs">
                                    <span className="min-w-[8rem] max-w-[14rem] break-words shrink-0">{sm.skill}</span>
                                    <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                                      <div
                                        className={`h-1.5 rounded-full ${sm.match >= 70 ? "bg-green-500" : sm.match >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                                        style={{ width: `${sm.match}%` }}
                                      />
                                    </div>
                                    <span className="font-semibold w-8 shrink-0">{sm.match}%</span>
                                    {sm.gap > 20 && <span className="text-red-500 text-xs shrink-0">Gap: {sm.gap}%</span>}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="bg-slate-50 p-3 rounded border border-slate-200">
                              <p className="text-xs font-semibold text-slate-700 mb-1">Reasoning:</p>
                              <Streamdown className="text-sm">{score.reasoning}</Streamdown>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Leadership Tab */}
              <TabsContent value="leadership">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Leadership Assessment (Grounded in BMW Team)
                    </CardTitle>
                    <CardDescription>
                      Compatibility assessed against specific BMW leaders — not abstract scores
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {result.leadershipAssessments.map((assessment) => {
                        const candidate = selectedCandidates.find((c) => c.id === assessment.candidateId);
                        return (
                          <div key={assessment.candidateId} className="border rounded-lg p-4">
                            <h4 className="font-bold text-lg mb-3">
                              {candidate?.firstName} {candidate?.lastName}
                            </h4>

                            <div className="grid grid-cols-3 gap-4 mb-4">
                              <div>
                                <p className="text-xs text-slate-600 mb-2">Leadership Score</p>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-slate-200 rounded-full h-2">
                                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${assessment.leadershipScore}%` }} />
                                  </div>
                                  <span className="text-sm font-semibold">{assessment.leadershipScore}</span>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-slate-600 mb-2">Team Dynamics</p>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-slate-200 rounded-full h-2">
                                    <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${assessment.teamDynamicsScore}%` }} />
                                  </div>
                                  <span className="text-sm font-semibold">{assessment.teamDynamicsScore}</span>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-slate-600 mb-2">Cultural Fit</p>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-slate-200 rounded-full h-2">
                                    <div className="bg-violet-500 h-2 rounded-full" style={{ width: `${assessment.culturalFitScore}%` }} />
                                  </div>
                                  <span className="text-sm font-semibold">{assessment.culturalFitScore}</span>
                                </div>
                              </div>
                            </div>

                            <div className="mb-3 flex flex-wrap gap-2">
                              <Badge>{assessment.leadershipStyle}</Badge>
                              {assessment.leadershipTraits.map((trait, idx) => (
                                <Badge key={idx} variant="outline">{trait}</Badge>
                              ))}
                            </div>

                            <div className="mb-3">
                              <p className="text-sm font-semibold text-slate-700 mb-2">BMW Leadership Team Compatibility:</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {assessment.bmwLeaderPairings?.map((pairing, idx) => (
                                  <div key={idx} className="bg-slate-50 p-3 rounded-lg border">
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <p className="font-semibold text-sm">{pairing.bmwLeaderName}</p>
                                        <p className="text-xs text-slate-500">{pairing.bmwLeaderRole}</p>
                                      </div>
                                      <Badge variant={pairing.compatibilityScore >= 70 ? "default" : "outline"}
                                        className={pairing.compatibilityScore >= 70 ? "bg-green-600" : pairing.compatibilityScore >= 50 ? "bg-amber-500 text-white" : "bg-red-500 text-white"}>
                                        {pairing.compatibilityScore}/100
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-slate-600">{pairing.dynamicAnalysis}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="bg-slate-50 p-3 rounded border border-slate-200">
                              <p className="text-xs font-semibold text-slate-700 mb-1">Reasoning:</p>
                              <Streamdown className="text-sm">{assessment.reasoning}</Streamdown>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* JD Tab */}
              <TabsContent value="jd">
                <Card>
                  <CardHeader>
                    <CardTitle>Job Analysis (JD Agent — Weights Derived from Text)</CardTitle>
                    <CardDescription>
                      Priority weights extracted and reasoned from the job description — not pre-stored
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-3">Core Competencies:</h4>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {result.jdAnalysis.coreCompetencies.map((comp, idx) => (
                            <Badge key={idx} variant="secondary">{comp}</Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">AI-Derived Priority Weights:</h4>
                        <div className="space-y-2">
                          {Object.entries(result.jdAnalysis.priorityWeights)
                            .sort(([, a], [, b]) => (b as number) - (a as number))
                            .map(([skill, weight]) => (
                              <div key={skill}>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm font-medium">{skill}</span>
                                  <span className="text-sm font-semibold">{Math.round((weight as number) * 100)}%</span>
                                </div>
                                <div className="bg-slate-200 rounded-full h-2">
                                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${(weight as number) * 100}%` }} />
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>

                      <div className="bg-slate-50 p-4 rounded border border-slate-200">
                        <p className="text-sm font-semibold text-slate-700 mb-2">Weight Derivation Reasoning:</p>
                        <Streamdown className="text-sm">{result.jdAnalysis.reasoning}</Streamdown>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Scenario Tab */}
              {result.scenarioAnalysis && (
                <TabsContent value="scenario">
                  <Card>
                    <CardHeader>
                      <CardTitle>Scenario Analysis (Weights Derived by Reasoning)</CardTitle>
                      <CardDescription>
                        Scenario Agent independently reasons about weight changes — not reading pre-stored values
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4 p-4 bg-blue-50 rounded border border-blue-200">
                        <p className="text-sm font-semibold text-blue-900 mb-1">Scenario: {selectedScenario?.name}</p>
                        <p className="text-sm text-blue-800">{selectedScenario?.description}</p>
                      </div>

                      <div className="space-y-4">
                        {result.scenarioAnalysis.map((analysis) => {
                          const candidate = selectedCandidates.find((c) => c.id === analysis.candidateId);
                          return (
                            <div key={analysis.candidateId} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start mb-3">
                                <h4 className="font-bold">{candidate?.firstName} {candidate?.lastName}</h4>
                                <Badge className="text-lg px-3 py-1">{analysis.adjustedFitScore}/100</Badge>
                              </div>

                              {/* Derived Weights Comparison */}
                              <div className="mb-3">
                                <p className="text-sm font-semibold mb-2">Scenario-Derived Weights vs. JD Baseline:</p>
                                <div className="space-y-1">
                                  {Object.entries(analysis.derivedWeights)
                                    .sort(([, a], [, b]) => (b as number) - (a as number))
                                    .map(([skill, weight]) => {
                                      const baselineWeight = (result.jdAnalysis.priorityWeights as Record<string, number>)[skill] || 0;
                                      const diff = (weight as number) - baselineWeight;
                                      return (
                                        <div key={skill} className="flex items-center gap-2 text-xs">
                                          <span className="min-w-[10rem] max-w-[16rem] break-words shrink-0">{skill}</span>
                                          <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                                            <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${(weight as number) * 100}%` }} />
                                          </div>
                                          <span className="font-semibold w-10 shrink-0">{Math.round((weight as number) * 100)}%</span>
                                          <span className={`w-12 text-right shrink-0 ${diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : "text-slate-400"}`}>
                                            {diff > 0 ? "+" : ""}{Math.round(diff * 100)}%
                                          </span>
                                        </div>
                                      );
                                    })}
                                </div>
                              </div>

                              <div className="bg-amber-50 p-3 rounded border border-amber-200 mb-3">
                                <p className="text-xs font-semibold text-amber-800 mb-1">Weight Change Reasoning:</p>
                                <Streamdown className="text-xs">{analysis.weightChangeReasoning}</Streamdown>
                              </div>

                              {/* Fix 5: Weight Deviation Explanation */}
                              {(analysis as any).weightDeviationExplanation && (
                                <details className="bg-purple-50 rounded border border-purple-200 mb-3">
                                  <summary className="p-3 cursor-pointer text-xs font-semibold text-purple-800">
                                    Weight Derivation Reasoning (vs. HR Suggestions)
                                  </summary>
                                  <div className="p-3 pt-0">
                                    <Streamdown className="text-xs text-purple-700">{(analysis as any).weightDeviationExplanation}</Streamdown>
                                  </div>
                                </details>
                              )}

                              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                                <p className="text-xs font-semibold text-slate-700 mb-1">Scenario Evaluation:</p>
                                <Streamdown className="text-sm">{analysis.reasoning}</Streamdown>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {/* Risk & Roadmap Tab */}
              <TabsContent value="risk">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Risk Assessment
                      </CardTitle>
                      <CardDescription>Data-grounded risk analysis with mitigation strategies</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-white p-4 rounded-lg border">
                        <Streamdown>{result.recommendation.riskAssessment}</Streamdown>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Implementation Roadmap (First 90 Days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {result.recommendation.implementationRoadmap?.map((step, idx) => (
                          <div key={idx} className="flex gap-3 items-start">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                              {idx + 1}
                            </div>
                            <div className="flex-1 bg-slate-50 p-3 rounded-lg border">
                              <Streamdown className="text-sm">{step}</Streamdown>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Decision Trade-offs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(result.recommendation.tradeOffs).map(([key, value]) => (
                          <div key={key} className="border-l-4 border-blue-500 pl-4 py-2">
                            <p className="font-semibold text-slate-900 capitalize">{key}:</p>
                            <Streamdown className="text-sm text-slate-700">{value as string}</Streamdown>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 p-4 bg-amber-50 rounded border border-amber-200">
                        <p className="text-sm font-semibold text-amber-900 mb-2">Alternative Candidates:</p>
                        <div className="space-y-2">
                          {result.recommendation.alternativeCandidates.map((alt, idx) => (
                            <div key={idx} className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{alt.name}</p>
                                <Streamdown className="text-xs text-slate-600">{alt.rationale}</Streamdown>
                              </div>
                              <Badge variant="outline">{alt.fitScore}/100</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            {/* Reset Button */}
            <Button
              variant="outline"
              onClick={() => {
                analyzeDecision.reset();
                setSelectedJobId(null);
                setSelectedCandidateIds([]);
                setSelectedScenarioId(null);
                setAgentSteps([]);
              }}
              className="w-full"
            >
              Run Another Analysis
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, Search, ArrowLeft, Upload, FileText, AlertCircle, CheckCircle2, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

// ============================================================================
// Types for CV Parser output
// ============================================================================
interface ParsedAchievement {
  text: string;
  metric: string | null;
  domain: string;
}

interface ParsedProfile {
  firstName: string;
  lastName: string;
  email: string | null;
  currentRole: string;
  currentCompany: string;
  yearsOfExperience: number;
  skills: Array<{ name: string; proficiency: string; years: number }>;
  leadershipStyle: string | null;
  teamSize: number | null;
  achievements: ParsedAchievement[];
  education: Array<{ degree: string; institution: string; year: number }>;
  boardExposure: boolean;
  crossFunctionalExperience: string[];
  geographicMobility: string[];
  industryTransitions: Array<{ from: string; to: string; year: number }>;
  plantScaleExperience: boolean;
  evProgramCredential: boolean;
  notableProjects: string[];
  previousCompanies: Array<{ company: string; role: string; years: number }>;
  careerTrajectory: string;
  rawSummary: string;
  confidenceIndicators: Record<string, "stated" | "inferred">;
}

// ============================================================================
// Confidence Badge Component
// ============================================================================
function ConfidenceBadge({ type }: { type: "stated" | "inferred" }) {
  if (type === "stated") {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700 border border-green-200">
        <CheckCircle2 className="w-3 h-3" />
        stated
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
      <AlertCircle className="w-3 h-3" />
      inferred
    </span>
  );
}

// ============================================================================
// CV Upload & Parse Component (Step 1)
// ============================================================================
function CVUploadStep({ onParsed, onManualEntry }: { onParsed: (profile: ParsedProfile) => void; onManualEntry: () => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") {
      setParseError("Only PDF files are supported. Please upload a .pdf file.");
      return;
    }
    if (file.size > 16 * 1024 * 1024) {
      setParseError("File size exceeds 16MB limit.");
      return;
    }

    setFileName(file.name);
    setParseError(null);
    setIsParsing(true);

    try {
      const formData = new FormData();
      formData.append("cv", file);

      const response = await fetch("/api/parse-cv", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to parse CV");
      }

      onParsed(data.profile);
      toast.success("CV parsed successfully! Review the extracted data below.");
    } catch (err: any) {
      setParseError(err.message || "Failed to parse CV. Please try again.");
      toast.error("CV parsing failed");
    } finally {
      setIsParsing(false);
    }
  }, [onParsed]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200
          ${isDragging ? "border-blue-500 bg-blue-50 scale-[1.02]" : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"}
          ${isParsing ? "pointer-events-none opacity-60" : ""}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        {isParsing ? (
          <div className="space-y-3">
            <Loader2 className="w-12 h-12 mx-auto text-blue-500 animate-spin" />
            <p className="text-lg font-medium text-slate-700">Parsing CV with AI...</p>
            <p className="text-sm text-slate-500">Extracting structured profile from {fileName}</p>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              CV Parser Agent is analyzing the document
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className="w-12 h-12 mx-auto text-slate-400" />
            <p className="text-lg font-medium text-slate-700">
              Drop a CV here or click to upload
            </p>
            <p className="text-sm text-slate-500">
              PDF format, max 16MB. The AI will extract a structured candidate profile.
            </p>
          </div>
        )}
      </div>

      {/* Error Display */}
      {parseError && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">Parsing Error</p>
            <p className="text-sm text-red-600 mt-1">{parseError}</p>
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-sm text-slate-400">or</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* Manual Entry Button */}
      <Button
        variant="outline"
        onClick={onManualEntry}
        className="w-full gap-2"
      >
        <FileText className="w-4 h-4" />
        Enter candidate details manually
      </Button>
    </div>
  );
}

// ============================================================================
// Parsed Profile Review Component (Step 2 - Edit Before Save)
// ============================================================================
function ParsedProfileReview({
  profile,
  onSave,
  onBack,
  isSaving,
}: {
  profile: ParsedProfile;
  onSave: (profile: ParsedProfile) => void;
  onBack: () => void;
  isSaving: boolean;
}) {
  const [editedProfile, setEditedProfile] = useState<ParsedProfile>(profile);
  const [showRawSummary, setShowRawSummary] = useState(false);

  const updateField = (field: string, value: any) => {
    setEditedProfile((prev) => ({ ...prev, [field]: value }));
  };

  const ci = editedProfile.confidenceIndicators;

  return (
    <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
      {/* Header Banner */}
      <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <FileText className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-blue-800">AI-Parsed Profile — Review Before Saving</p>
          <p className="text-xs text-blue-600 mt-1">
            Fields marked <ConfidenceBadge type="inferred" /> were interpreted by the AI. Please verify them.
            Fields marked <ConfidenceBadge type="stated" /> were directly extracted from the CV.
          </p>
        </div>
      </div>

      {/* Basic Info */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Basic Information</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 mb-1">
              First Name <ConfidenceBadge type={ci.firstName || "stated"} />
            </label>
            <Input
              value={editedProfile.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              className="text-sm"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 mb-1">
              Last Name <ConfidenceBadge type={ci.lastName || "stated"} />
            </label>
            <Input
              value={editedProfile.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              className="text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 mb-1">
              Email <ConfidenceBadge type={ci.email || "stated"} />
            </label>
            <Input
              value={editedProfile.email || ""}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="email@example.com"
              className="text-sm"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 mb-1">
              Years of Experience <ConfidenceBadge type={ci.yearsOfExperience || "inferred"} />
            </label>
            <Input
              type="number"
              value={editedProfile.yearsOfExperience}
              onChange={(e) => updateField("yearsOfExperience", parseInt(e.target.value) || 0)}
              className="text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 mb-1">
              Current Role <ConfidenceBadge type={ci.currentRole || "stated"} />
            </label>
            <Input
              value={editedProfile.currentRole}
              onChange={(e) => updateField("currentRole", e.target.value)}
              className="text-sm"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 mb-1">
              Current Company <ConfidenceBadge type={ci.currentCompany || "stated"} />
            </label>
            <Input
              value={editedProfile.currentCompany}
              onChange={(e) => updateField("currentCompany", e.target.value)}
              className="text-sm"
            />
          </div>
        </div>
      </div>

      {/* Leadership & Team */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Leadership Profile</h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 mb-1">
              Leadership Style <ConfidenceBadge type={ci.leadershipStyle || "inferred"} />
            </label>
            <select
              value={editedProfile.leadershipStyle || ""}
              onChange={(e) => updateField("leadershipStyle", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm bg-amber-50"
            >
              <option value="">Unknown</option>
              <option value="collaborative">Collaborative</option>
              <option value="directive">Directive</option>
              <option value="visionary">Visionary</option>
              <option value="operational-excellence">Operational Excellence</option>
              <option value="delegative">Delegative</option>
              <option value="participative">Participative</option>
            </select>
          </div>
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 mb-1">
              Team Size <ConfidenceBadge type={ci.teamSize || "inferred"} />
            </label>
            <Input
              type="number"
              value={editedProfile.teamSize || 0}
              onChange={(e) => updateField("teamSize", parseInt(e.target.value) || 0)}
              className="text-sm"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 mb-1">
              Career Trajectory <ConfidenceBadge type="inferred" />
            </label>
            <select
              value={editedProfile.careerTrajectory}
              onChange={(e) => updateField("careerTrajectory", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm bg-amber-50"
            >
              <option value="ascending">Ascending</option>
              <option value="lateral">Lateral</option>
              <option value="specialist">Specialist</option>
            </select>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
          Skills ({editedProfile.skills.length})
        </h3>
        <div className="space-y-2">
          {editedProfile.skills.map((skill, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
              <Input
                value={skill.name}
                onChange={(e) => {
                  const newSkills = [...editedProfile.skills];
                  newSkills[idx] = { ...skill, name: e.target.value };
                  updateField("skills", newSkills);
                }}
                className="text-sm flex-1"
              />
              <select
                value={skill.proficiency}
                onChange={(e) => {
                  const newSkills = [...editedProfile.skills];
                  newSkills[idx] = { ...skill, proficiency: e.target.value };
                  updateField("skills", newSkills);
                }}
                className="px-2 py-1.5 border border-slate-200 rounded-md text-xs bg-amber-50"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
              <Input
                type="number"
                value={skill.years}
                onChange={(e) => {
                  const newSkills = [...editedProfile.skills];
                  newSkills[idx] = { ...skill, years: parseInt(e.target.value) || 0 };
                  updateField("skills", newSkills);
                }}
                className="text-sm w-16"
                title="Years"
              />
              <span className="text-[10px] text-slate-400">yrs</span>
              <ConfidenceBadge type="inferred" />
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
          Achievements ({editedProfile.achievements.length})
        </h3>
        <div className="space-y-2">
          {editedProfile.achievements.map((ach, idx) => (
            <div key={idx} className="p-3 bg-slate-50 rounded-lg space-y-1">
              <p className="text-sm text-slate-800">{ach.text}</p>
              <div className="flex items-center gap-3 text-xs">
                {ach.metric && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">
                    {ach.metric}
                  </span>
                )}
                <span className="text-slate-500">Domain: {ach.domain}</span>
              </div>
            </div>
          ))}
          {editedProfile.achievements.length === 0 && (
            <p className="text-sm text-slate-400 italic">No achievements extracted</p>
          )}
        </div>
      </div>

      {/* Automotive-Executive Indicators */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Automotive-Executive Indicators</h3>
        <div className="grid grid-cols-3 gap-3">
          <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${editedProfile.boardExposure ? "bg-purple-50 border-purple-200" : "bg-white border-slate-200"}`}>
            <input
              type="checkbox"
              checked={editedProfile.boardExposure}
              onChange={(e) => updateField("boardExposure", e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Board Exposure</span>
            <ConfidenceBadge type={ci.boardExposure || "inferred"} />
          </label>
          <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${editedProfile.plantScaleExperience ? "bg-blue-50 border-blue-200" : "bg-white border-slate-200"}`}>
            <input
              type="checkbox"
              checked={editedProfile.plantScaleExperience}
              onChange={(e) => updateField("plantScaleExperience", e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Plant Scale</span>
            <ConfidenceBadge type={ci.plantScaleExperience || "inferred"} />
          </label>
          <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${editedProfile.evProgramCredential ? "bg-green-50 border-green-200" : "bg-white border-slate-200"}`}>
            <input
              type="checkbox"
              checked={editedProfile.evProgramCredential}
              onChange={(e) => updateField("evProgramCredential", e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">EV Credential</span>
            <ConfidenceBadge type={ci.evProgramCredential || "inferred"} />
          </label>
        </div>
      </div>

      {/* Education */}
      {editedProfile.education.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Education</h3>
          <div className="space-y-2">
            {editedProfile.education.map((edu, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg text-sm">
                <span className="font-medium">{edu.degree}</span>
                <span className="text-slate-400">—</span>
                <span>{edu.institution}</span>
                <span className="text-slate-400">({edu.year})</span>
                <ConfidenceBadge type="stated" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Previous Companies */}
      {editedProfile.previousCompanies.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Previous Companies</h3>
          <div className="space-y-2">
            {editedProfile.previousCompanies.map((comp, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg text-sm">
                <span className="font-medium">{comp.role}</span>
                <span className="text-slate-400">at</span>
                <span>{comp.company}</span>
                <span className="text-slate-400">({comp.years} yrs)</span>
                <ConfidenceBadge type="stated" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags: Cross-Functional, Geographic, Industry Transitions */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Experience Tags</h3>
        <div className="flex flex-wrap gap-2">
          {editedProfile.crossFunctionalExperience.map((area, idx) => (
            <span key={`cf-${idx}`} className="px-2 py-1 bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-md text-xs">
              {area}
            </span>
          ))}
          {editedProfile.geographicMobility.map((region, idx) => (
            <span key={`geo-${idx}`} className="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-xs">
              {region}
            </span>
          ))}
          {editedProfile.industryTransitions.map((t, idx) => (
            <span key={`it-${idx}`} className="px-2 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-md text-xs">
              {t.from} → {t.to} ({t.year})
            </span>
          ))}
        </div>
      </div>

      {/* Raw Summary Toggle */}
      <div className="space-y-2">
        <button
          onClick={() => setShowRawSummary(!showRawSummary)}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 transition-colors"
        >
          {showRawSummary ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {showRawSummary ? "Hide" : "Show"} AI Summary (for Leadership Agent)
        </button>
        {showRawSummary && (
          <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600 italic">
            {editedProfile.rawSummary}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2 border-t border-slate-200">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back to Upload
        </Button>
        <Button
          onClick={() => onSave(editedProfile)}
          disabled={isSaving}
          className="flex-1 gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Confirm & Save Candidate
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Main Admin Management Component
// ============================================================================
export default function AdminManagement() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("jobs");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // CV Parser flow state
  const [cvFlowStep, setCvFlowStep] = useState<"upload" | "review" | "manual">("upload");
  const [parsedProfile, setParsedProfile] = useState<ParsedProfile | null>(null);

  // Form states
  const [jobForm, setJobForm] = useState({
    title: "",
    description: "",
    department: "",
    level: "senior",
    requiredSkills: "",
    yearsOfExperience: 5,
  });

  const [candidateForm, setCandidateForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    currentRole: "",
    currentCompany: "",
    yearsOfExperience: 0,
    skills: "",
    leadershipStyle: "collaborative",
    teamSize: 0,
  });

  const [scenarioForm, setScenarioForm] = useState({
    name: "",
    description: "",
    context: "",
    priorityWeights: JSON.stringify({
      evExpertise: 30,
      aiMlCapability: 25,
      teamLeadership: 25,
      executionSpeed: 20,
    }),
  });

  // BMW Leader dialog state
  const [isLeaderDialogOpen, setIsLeaderDialogOpen] = useState(false);
  const [editingLeader, setEditingLeader] = useState<any | null>(null);
  const [leaderForm, setLeaderForm] = useState({
    name: "",
    role: "",
    department: "",
    leadershipStyle: "",
    teamSize: 0,
    priorities: "",
    background: "",
    decisionMakingStyle: "",
    communicationPreference: "",
  });

  // Queries
  const jobsQuery = trpc.decision.getJobs.useQuery();
  const candidatesQuery = trpc.decision.getCandidates.useQuery();
  const scenariosQuery = trpc.decision.getScenarios.useQuery();
  const bmwLeadersQuery = trpc.decision.getBmwLeaders.useQuery();

  // BMW Leader mutations
  const createLeaderMutation = trpc.decision.createBmwLeader.useMutation({
    onSuccess: () => {
      toast.success("BMW leader added!");
      bmwLeadersQuery.refetch();
      setIsLeaderDialogOpen(false);
      setLeaderForm({ name: "", role: "", department: "", leadershipStyle: "", teamSize: 0, priorities: "", background: "", decisionMakingStyle: "", communicationPreference: "" });
    },
    onError: (e) => toast.error(e.message),
  });
  const updateLeaderMutation = trpc.decision.updateBmwLeader.useMutation({
    onSuccess: () => {
      toast.success("BMW leader updated!");
      bmwLeadersQuery.refetch();
      setIsLeaderDialogOpen(false);
      setEditingLeader(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleOpenLeaderDialog = (leader?: any) => {
    if (leader) {
      setEditingLeader(leader);
      setLeaderForm({
        name: leader.name,
        role: leader.role,
        department: leader.department,
        leadershipStyle: leader.leadershipStyle,
        teamSize: leader.teamSize || 0,
        priorities: Array.isArray(leader.priorities) ? leader.priorities.join(", ") : "",
        background: leader.background || "",
        decisionMakingStyle: leader.decisionMakingStyle || "",
        communicationPreference: leader.communicationPreference || "",
      });
    } else {
      setEditingLeader(null);
      setLeaderForm({ name: "", role: "", department: "", leadershipStyle: "", teamSize: 0, priorities: "", background: "", decisionMakingStyle: "", communicationPreference: "" });
    }
    setIsLeaderDialogOpen(true);
  };

  const handleSaveLeader = () => {
    const payload = {
      name: leaderForm.name,
      role: leaderForm.role,
      department: leaderForm.department,
      leadershipStyle: leaderForm.leadershipStyle,
      teamSize: leaderForm.teamSize,
      priorities: leaderForm.priorities.split(",").map((p) => p.trim()).filter(Boolean),
      background: leaderForm.background,
      decisionMakingStyle: leaderForm.decisionMakingStyle,
      communicationPreference: leaderForm.communicationPreference,
    };
    if (editingLeader) {
      updateLeaderMutation.mutate({ id: editingLeader.id, ...payload });
    } else {
      createLeaderMutation.mutate(payload);
    }
  };

  // Mutations
  const createJobMutation = trpc.decision.createJob.useMutation({
    onSuccess: () => {
      toast.success("Job created successfully!");
      jobsQuery.refetch();
      setJobForm({
        title: "",
        description: "",
        department: "",
        level: "senior",
        requiredSkills: "",
        yearsOfExperience: 5,
      });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to create job: ${error.message}`);
    },
  });

  const createCandidateMutation = trpc.decision.createCandidate.useMutation({
    onSuccess: () => {
      toast.success("Candidate added successfully!");
      candidatesQuery.refetch();
      setCandidateForm({
        firstName: "",
        lastName: "",
        email: "",
        currentRole: "",
        currentCompany: "",
        yearsOfExperience: 0,
        skills: "",
        leadershipStyle: "collaborative",
        teamSize: 0,
      });
      setParsedProfile(null);
      setCvFlowStep("upload");
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to add candidate: ${error.message}`);
    },
  });

  // Handle job creation
  const handleCreateJob = () => {
    if (!jobForm.title || !jobForm.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    createJobMutation.mutate({
      jobTitle: jobForm.title,
      description: jobForm.description,
      department: jobForm.department,
      seniority: jobForm.level,
      requiredSkills: jobForm.requiredSkills.split(",").map((s) => s.trim()),
      experienceYearsRequired: jobForm.yearsOfExperience,
    });
  };

  // Handle manual candidate creation
  const handleCreateCandidate = () => {
    if (!candidateForm.firstName || !candidateForm.lastName) {
      toast.error("Please fill in all required fields");
      return;
    }

    const skillsArray = candidateForm.skills
      .split(",")
      .map((s) => ({
        name: s.trim(),
        proficiency: "intermediate",
        years: 3,
      }));

    createCandidateMutation.mutate({
      firstName: candidateForm.firstName,
      lastName: candidateForm.lastName,
      email: candidateForm.email || `${candidateForm.firstName.toLowerCase()}.${candidateForm.lastName.toLowerCase()}@example.com`,
      currentRole: candidateForm.currentRole,
      currentCompany: candidateForm.currentCompany,
      yearsOfExperience: candidateForm.yearsOfExperience,
      skills: skillsArray,
      leadershipStyle: candidateForm.leadershipStyle,
      teamSize: candidateForm.teamSize,
    });
  };

  // Handle saving parsed CV profile
  const handleSaveParsedProfile = (profile: ParsedProfile) => {
    createCandidateMutation.mutate({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email || `${profile.firstName.toLowerCase()}.${profile.lastName.toLowerCase()}@example.com`,
      currentRole: profile.currentRole,
      currentCompany: profile.currentCompany,
      yearsOfExperience: profile.yearsOfExperience,
      skills: profile.skills,
      leadershipStyle: profile.leadershipStyle || undefined,
      teamSize: profile.teamSize || undefined,
      achievements: profile.achievements.map((a) => a.text),
      education: profile.education,
      boardExposure: profile.boardExposure,
      crossFunctionalExperience: profile.crossFunctionalExperience,
      geographicMobility: profile.geographicMobility,
      industryTransitions: profile.industryTransitions,
      plantScaleExperience: profile.plantScaleExperience,
      evProgramCredential: profile.evProgramCredential,
      notableProjects: profile.notableProjects,
      previousCompanies: profile.previousCompanies,
    });
  };

  // Reset CV flow when dialog closes
  const handleCandidateDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setCvFlowStep("upload");
      setParsedProfile(null);
    }
  };

  // Filter data based on search
  const filteredJobs = jobsQuery.data?.filter(
    (job) =>
      job.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.department?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredCandidates = candidatesQuery.data?.filter(
    (candidate) =>
      `${candidate.firstName} ${candidate.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      candidate.currentCompany?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Admin Management</h1>
            <p className="text-slate-600">Manage jobs, candidates, and scenarios for decision analysis</p>
          </div>
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Analysis
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-6 flex items-center gap-2">
          <Search className="w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search jobs or candidates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="jobs">Jobs ({filteredJobs.length})</TabsTrigger>
            <TabsTrigger value="candidates">Candidates ({filteredCandidates.length})</TabsTrigger>
            <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
            <TabsTrigger value="bmw-leaders">BMW Leaders</TabsTrigger>
          </TabsList>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-slate-900">Job Openings</h2>
              <Dialog open={isDialogOpen && activeTab === "jobs"} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Job
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Job Opening</DialogTitle>
                    <DialogDescription>Add a new job requirement to the system</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Job Title *</label>
                      <Input
                        placeholder="e.g., VP Engineering - EV Platform"
                        value={jobForm.title}
                        onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Description *</label>
                      <Textarea
                        placeholder="Detailed job description..."
                        value={jobForm.description}
                        onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                        rows={4}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700">Department</label>
                        <Input
                          placeholder="e.g., Engineering"
                          value={jobForm.department}
                          onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Level</label>
                        <select
                          value={jobForm.level}
                          onChange={(e) => setJobForm({ ...jobForm, level: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md"
                        >
                          <option value="junior">Junior</option>
                          <option value="mid">Mid</option>
                          <option value="senior">Senior</option>
                          <option value="lead">Lead</option>
                          <option value="executive">Executive</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700">Required Skills (comma-separated)</label>
                        <Input
                          placeholder="e.g., EV Systems, Leadership, AI/ML"
                          value={jobForm.requiredSkills}
                          onChange={(e) => setJobForm({ ...jobForm, requiredSkills: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Years of Experience</label>
                        <Input
                          type="number"
                          value={jobForm.yearsOfExperience}
                          onChange={(e) =>
                            setJobForm({ ...jobForm, yearsOfExperience: parseInt(e.target.value) })
                          }
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleCreateJob}
                      disabled={createJobMutation.isPending}
                      className="w-full"
                    >
                      {createJobMutation.isPending ? "Creating..." : "Create Job"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Jobs List */}
            <div className="grid gap-4">
              {jobsQuery.isLoading ? (
                <Card>
                  <CardContent className="p-6 text-center text-slate-500">Loading jobs...</CardContent>
                </Card>
              ) : filteredJobs.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-slate-500">No jobs found. Create one to get started!</CardContent>
                </Card>
              ) : (
                filteredJobs.map((job) => (
                  <Card key={job.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{job.jobTitle || "Job Opening"}</CardTitle>
                          <CardDescription>{job.department}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => toast.info("Edit feature coming soon")}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => toast.info("Delete feature coming soon")}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 mb-3">{job.description}</p>
                      <div className="flex gap-4 text-sm">
                        <span className="text-slate-500">Level: {job.seniority}</span>
                        <span className="text-slate-500">Experience: {job.experienceYearsRequired}+ years</span>
                        <span className="text-slate-500">Status: Open</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Candidates Tab */}
          <TabsContent value="candidates" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-slate-900">Candidates</h2>
              <Dialog open={isDialogOpen && activeTab === "candidates"} onOpenChange={handleCandidateDialogChange}>
                <DialogTrigger asChild>
                  <Button onClick={() => setActiveTab("candidates")} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Candidate
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh]">
                  <DialogHeader>
                    <DialogTitle>
                      {cvFlowStep === "upload" && "Add New Candidate"}
                      {cvFlowStep === "review" && "Review Parsed Profile"}
                      {cvFlowStep === "manual" && "Manual Entry"}
                    </DialogTitle>
                    <DialogDescription>
                      {cvFlowStep === "upload" && "Upload a CV to auto-extract candidate data, or enter details manually"}
                      {cvFlowStep === "review" && "Review and edit the AI-extracted profile before saving"}
                      {cvFlowStep === "manual" && "Enter candidate details manually"}
                    </DialogDescription>
                  </DialogHeader>

                  {/* Step 1: Upload */}
                  {cvFlowStep === "upload" && (
                    <CVUploadStep
                      onParsed={(profile) => {
                        setParsedProfile(profile);
                        setCvFlowStep("review");
                      }}
                      onManualEntry={() => setCvFlowStep("manual")}
                    />
                  )}

                  {/* Step 2: Review Parsed Profile */}
                  {cvFlowStep === "review" && parsedProfile && (
                    <ParsedProfileReview
                      profile={parsedProfile}
                      onSave={handleSaveParsedProfile}
                      onBack={() => setCvFlowStep("upload")}
                      isSaving={createCandidateMutation.isPending}
                    />
                  )}

                  {/* Step 3: Manual Entry (fallback) */}
                  {cvFlowStep === "manual" && (
                    <div className="space-y-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCvFlowStep("upload")}
                        className="gap-1 text-slate-500 -ml-2"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        Back to upload
                      </Button>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-slate-700">First Name *</label>
                          <Input
                            placeholder="First name"
                            value={candidateForm.firstName}
                            onChange={(e) => setCandidateForm({ ...candidateForm, firstName: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-700">Last Name *</label>
                          <Input
                            placeholder="Last name"
                            value={candidateForm.lastName}
                            onChange={(e) => setCandidateForm({ ...candidateForm, lastName: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-slate-700">Email</label>
                          <Input
                            type="email"
                            placeholder="email@example.com"
                            value={candidateForm.email}
                            onChange={(e) => setCandidateForm({ ...candidateForm, email: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-700">Current Role</label>
                          <Input
                            placeholder="e.g., Director of Engineering"
                            value={candidateForm.currentRole}
                            onChange={(e) => setCandidateForm({ ...candidateForm, currentRole: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-700">Current Company</label>
                          <Input
                            placeholder="e.g., Tesla"
                            value={candidateForm.currentCompany}
                            onChange={(e) => setCandidateForm({ ...candidateForm, currentCompany: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-slate-700">Years of Experience</label>
                          <Input
                            type="number"
                            value={candidateForm.yearsOfExperience}
                            onChange={(e) =>
                              setCandidateForm({ ...candidateForm, yearsOfExperience: parseInt(e.target.value) })
                            }
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-700">Team Size Led</label>
                          <Input
                            type="number"
                            value={candidateForm.teamSize}
                            onChange={(e) =>
                              setCandidateForm({ ...candidateForm, teamSize: parseInt(e.target.value) })
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Skills (comma-separated)</label>
                        <Input
                          placeholder="e.g., EV Systems, Leadership, AI/ML"
                          value={candidateForm.skills}
                          onChange={(e) => setCandidateForm({ ...candidateForm, skills: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Leadership Style</label>
                        <select
                          value={candidateForm.leadershipStyle}
                          onChange={(e) => setCandidateForm({ ...candidateForm, leadershipStyle: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md"
                        >
                          <option value="collaborative">Collaborative</option>
                          <option value="directive">Directive</option>
                          <option value="delegative">Delegative</option>
                          <option value="participative">Participative</option>
                        </select>
                      </div>
                      <Button
                        onClick={handleCreateCandidate}
                        disabled={createCandidateMutation.isPending}
                        className="w-full"
                      >
                        {createCandidateMutation.isPending ? "Adding..." : "Add Candidate"}
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>

            {/* Candidates List */}
            <div className="grid gap-4">
              {candidatesQuery.isLoading ? (
                <Card>
                  <CardContent className="p-6 text-center text-slate-500">Loading candidates...</CardContent>
                </Card>
              ) : filteredCandidates.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-slate-500">No candidates found. Add one to get started!</CardContent>
                </Card>
              ) : (
                filteredCandidates.map((candidate) => (
                  <Card key={candidate.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>
                            {candidate.firstName} {candidate.lastName}
                          </CardTitle>
                          <CardDescription>
                            {candidate.currentRole} at {candidate.currentCompany}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => toast.info("Edit feature coming soon")}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => toast.info("Delete feature coming soon")}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <span className="text-slate-500">Experience: {candidate.yearsOfExperience} years</span>
                        <span className="text-slate-500">Leadership: {candidate.leadershipStyle}</span>
                        <span className="text-slate-500">Team Size: {candidate.teamSize}</span>
                        <span className="text-slate-500">Skills: {Array.isArray(candidate.skills) ? candidate.skills.map((s: any) => typeof s === 'string' ? s : s.name).slice(0, 3).join(", ") : ""}</span>
                      </div>
                      {/* Enriched profile badges */}
                      <div className="flex flex-wrap gap-1">
                        {candidate.boardExposure && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">Board Exposure</span>}
                        {candidate.plantScaleExperience && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">Plant Scale</span>}
                        {candidate.evProgramCredential && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">EV Credential</span>}
                        {Array.isArray(candidate.education) && candidate.education.length > 0 && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">{(candidate.education[0] as any).degree}</span>}
                        {Array.isArray(candidate.crossFunctionalExperience) && candidate.crossFunctionalExperience.length > 0 && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-cyan-100 text-cyan-800">Cross-Functional: {candidate.crossFunctionalExperience.length} areas</span>}
                        {Array.isArray(candidate.geographicMobility) && candidate.geographicMobility.length > 0 && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">Global: {candidate.geographicMobility.join(", ")}</span>}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Scenarios Tab */}
          <TabsContent value="scenarios" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-slate-900">Scenarios</h2>
              <Button className="gap-2" onClick={() => toast.info("Scenario creation coming soon")}>
                <Plus className="w-4 h-4" />
                New Scenario
              </Button>
            </div>
            <Card>
              <CardContent className="p-6 text-center text-slate-500">
                Scenario management coming soon. Pre-configured scenarios: EV Transformation Crisis, Automotive Continuity, Supply Chain Crisis
              </CardContent>
            </Card>
          </TabsContent>

          {/* BMW Leadership Team Tab (Fix 6) */}
          <TabsContent value="bmw-leaders" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">BMW Leadership Team</h2>
                <p className="text-sm text-slate-500 mt-1">Edit leader profiles to see how changes affect compatibility assessments in the next analysis run.</p>
              </div>
              <Button className="gap-2" onClick={() => handleOpenLeaderDialog()}>
                <Plus className="w-4 h-4" />
                Add Leader
              </Button>
            </div>

            {/* Leader Cards */}
            <div className="grid gap-4">
              {bmwLeadersQuery.isLoading ? (
                <Card><CardContent className="p-6 text-center text-slate-500">Loading BMW leaders...</CardContent></Card>
              ) : !bmwLeadersQuery.data?.length ? (
                <Card><CardContent className="p-6 text-center text-slate-500">No BMW leaders found.</CardContent></Card>
              ) : (
                bmwLeadersQuery.data.map((leader) => (
                  <Card key={leader.id} className="border border-slate-200">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{leader.name}</CardTitle>
                          <CardDescription>{leader.role} — {leader.department}</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => handleOpenLeaderDialog(leader)}>
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500 text-xs uppercase tracking-wide">Leadership Style</span>
                          <p className="font-medium text-slate-800 mt-0.5">{leader.leadershipStyle}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 text-xs uppercase tracking-wide">Decision Making</span>
                          <p className="font-medium text-slate-800 mt-0.5">{leader.decisionMakingStyle || "—"}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 text-xs uppercase tracking-wide">Communication</span>
                          <p className="font-medium text-slate-800 mt-0.5">{leader.communicationPreference || "—"}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 text-xs uppercase tracking-wide">Team Size</span>
                          <p className="font-medium text-slate-800 mt-0.5">{leader.teamSize?.toLocaleString() || "—"}</p>
                        </div>
                      </div>
                      {Array.isArray(leader.priorities) && leader.priorities.length > 0 && (
                        <div>
                          <span className="text-slate-500 text-xs uppercase tracking-wide">Current Priorities</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {leader.priorities.map((p: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs">{p}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {leader.background && (
                        <div>
                          <span className="text-slate-500 text-xs uppercase tracking-wide">Background</span>
                          <p className="text-sm text-slate-700 mt-0.5 line-clamp-2">{leader.background}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Add/Edit Leader Dialog */}
            <Dialog open={isLeaderDialogOpen} onOpenChange={(open) => { setIsLeaderDialogOpen(open); if (!open) setEditingLeader(null); }}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingLeader ? `Edit ${editingLeader.name}` : "Add BMW Leader"}</DialogTitle>
                  <DialogDescription>Changes will take effect on the next analysis run — no re-seeding required.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Full Name</label>
                      <Input placeholder="Dr. Frank Weber" value={leaderForm.name} onChange={(e) => setLeaderForm({ ...leaderForm, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Role / Title</label>
                      <Input placeholder="Chief Technology Officer" value={leaderForm.role} onChange={(e) => setLeaderForm({ ...leaderForm, role: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Department</label>
                      <Input placeholder="Technology" value={leaderForm.department} onChange={(e) => setLeaderForm({ ...leaderForm, department: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Team Size</label>
                      <Input type="number" value={leaderForm.teamSize} onChange={(e) => setLeaderForm({ ...leaderForm, teamSize: parseInt(e.target.value) || 0 })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Leadership Style</label>
                      <Input placeholder="Visionary, data-driven" value={leaderForm.leadershipStyle} onChange={(e) => setLeaderForm({ ...leaderForm, leadershipStyle: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Decision Making Style</label>
                      <Input placeholder="Consensus-driven" value={leaderForm.decisionMakingStyle} onChange={(e) => setLeaderForm({ ...leaderForm, decisionMakingStyle: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Communication Preference</label>
                    <Input placeholder="Direct, data-backed presentations" value={leaderForm.communicationPreference} onChange={(e) => setLeaderForm({ ...leaderForm, communicationPreference: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Current Priorities (comma-separated)</label>
                    <Input placeholder="EV software stack, AI integration, platform unification" value={leaderForm.priorities} onChange={(e) => setLeaderForm({ ...leaderForm, priorities: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Background</label>
                    <Textarea rows={3} placeholder="Brief professional background..." value={leaderForm.background} onChange={(e) => setLeaderForm({ ...leaderForm, background: e.target.value })} />
                  </div>
                  <Button
                    onClick={handleSaveLeader}
                    disabled={createLeaderMutation.isPending || updateLeaderMutation.isPending || !leaderForm.name || !leaderForm.role}
                    className="w-full"
                  >
                    {(createLeaderMutation.isPending || updateLeaderMutation.isPending) ? "Saving..." : editingLeader ? "Save Changes" : "Add Leader"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

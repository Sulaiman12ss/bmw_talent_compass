import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, AlertTriangle, AlertOctagon, Info, X, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Alert {
  id: number;
  type: "talent_risk" | "succession_gap" | "compensation_trend" | "skill_gap";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  relatedEmployeeIds?: string | null;
  relatedRoleId?: string | null;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function Alerts() {
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<number>>(new Set());
  const [filterSeverity, setFilterSeverity] = useState<string>("all");

  // Fetch all alerts
  const { data: alerts, isLoading, refetch } = trpc.alerts.getAll.useQuery();

  // Auto-refresh alerts every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertOctagon className="w-5 h-5 text-red-600" />;
      case "high":
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case "medium":
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-blue-100 text-blue-800 border-blue-300";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "talent_risk":
        return "Talent Risk";
      case "succession_gap":
        return "Succession Gap";
      case "compensation_trend":
        return "Compensation Trend";
      default:
        return type;
    }
  };

  const handleDismiss = (alertId: number) => {
    setDismissedAlerts(new Set(Array.from(dismissedAlerts).concat(alertId)));
    toast.success("Alert dismissed");
  };

  const handleMarkAsRead = (alertId: number) => {
    toast.success("Alert marked as read");
  };

  const filteredAlerts = alerts?.filter((alert) => {
    if (filterSeverity === "all") return true;
    return alert.severity === filterSeverity;
  }) || [];

  const visibleAlerts = filteredAlerts.filter((alert) => !dismissedAlerts.has(alert.id));
  const criticalAlerts = visibleAlerts.filter((a) => a.severity === "critical");
  const highAlerts = visibleAlerts.filter((a) => a.severity === "high");
  const mediumAlerts = visibleAlerts.filter((a) => a.severity === "medium");
  const lowAlerts = visibleAlerts.filter((a) => a.severity === "low");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <AlertCircle className="w-8 h-8 text-red-600" />
              HR Alerts & Notifications
            </h1>
            <p className="text-muted-foreground mt-1">
              Real-time alerts for talent risks, succession gaps, and compensation trends
            </p>
          </div>
          <Button onClick={() => refetch()} variant="outline">
            Refresh
          </Button>
        </div>

        {/* Alert Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{criticalAlerts.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">High</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">{highAlerts.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Medium</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600">{mediumAlerts.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Low</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{lowAlerts.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Filter by Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {["all", "critical", "high", "medium", "low"].map((severity) => (
                <Button
                  key={severity}
                  variant={filterSeverity === severity ? "default" : "outline"}
                  onClick={() => setFilterSeverity(severity)}
                  className="capitalize"
                >
                  {severity}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alerts List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">Loading alerts...</p>
              </CardContent>
            </Card>
          ) : visibleAlerts.length > 0 ? (
            visibleAlerts.map((alert) => (
              <Card
                key={alert.id}
                className={`border-l-4 ${
                  alert.severity === "critical"
                    ? "border-l-red-600"
                    : alert.severity === "high"
                      ? "border-l-orange-600"
                      : alert.severity === "medium"
                        ? "border-l-yellow-600"
                        : "border-l-blue-600"
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1">
                        <CardTitle className="text-lg">{alert.title}</CardTitle>
                        <CardDescription className="mt-1">
                          <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="ml-2">
                            {getTypeLabel(alert.type)}
                          </Badge>
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDismiss(alert.id)}
                      className="ml-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">{alert.description}</p>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedAlert(alert)}
                    >
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleMarkAsRead(alert.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Addressed
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">All alerts have been addressed!</p>
                  <p className="text-sm text-gray-600 mt-2">
                    No critical talent risks or succession gaps detected.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Alert Detail Modal */}
      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent className="max-w-2xl">
          {selectedAlert && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3">
                  {getSeverityIcon(selectedAlert.severity)}
                  <div>
                    <DialogTitle>{selectedAlert.title}</DialogTitle>
                    <DialogDescription className="mt-2">
                      <Badge className={getSeverityColor(selectedAlert.severity)}>
                        {selectedAlert.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="ml-2">
                        {getTypeLabel(selectedAlert.type)}
                      </Badge>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Alert Details</h4>
                  <p className="text-gray-700">{selectedAlert.description}</p>
                </div>

                {selectedAlert.relatedEmployeeIds && (
                  <div>
                    <h4 className="font-semibold mb-2">Related Employees</h4>
                    <p className="text-sm text-gray-600">
                      Employee IDs: {selectedAlert.relatedEmployeeIds}
                    </p>
                  </div>
                )}

                {selectedAlert.relatedRoleId && (
                  <div>
                    <h4 className="font-semibold mb-2">Related Role</h4>
                    <p className="text-sm text-gray-600">
                      Role ID: {selectedAlert.relatedRoleId}
                    </p>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  Created: {new Date(selectedAlert.createdAt).toLocaleString()}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      handleMarkAsRead(selectedAlert.id);
                      setSelectedAlert(null);
                    }}
                  >
                    Mark as Addressed
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      handleDismiss(selectedAlert.id);
                      setSelectedAlert(null);
                    }}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

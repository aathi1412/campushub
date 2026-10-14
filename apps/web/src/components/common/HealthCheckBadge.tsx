import React, { useEffect, useState } from "react";
import { Chip, Tooltip, CircularProgress } from "@mui/material";
import { Activity, CheckCircle2, AlertTriangle } from "lucide-react";
import { getSystemHealth } from "../../services/api.js";
import type { SystemHealthData } from "../../types/api.js";

export const HealthCheckBadge: React.FC = () => {
  const [health, setHealth] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const res = await getSystemHealth();
      setHealth(res.data);
      setError(false);
    } catch {
      setError(true);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !health) {
    return (
      <Chip
        size="small"
        icon={<CircularProgress size={12} color="inherit" />}
        label="Connecting to API..."
        variant="outlined"
        color="default"
      />
    );
  }

  if (error || !health) {
    return (
      <Tooltip title="Click to retry connecting to CampusHub API">
        <Chip
          size="small"
          icon={<AlertTriangle size={14} className="text-amber-600" />}
          label="Backend Offline"
          color="warning"
          variant="outlined"
          onClick={checkHealth}
          clickable
        />
      </Tooltip>
    );
  }

  const isHealthy = health.status === "healthy";

  return (
    <Tooltip
      title={
        <div className="text-xs space-y-1 p-1">
          <div><strong>API Status:</strong> {health.status}</div>
          <div><strong>Database:</strong> {health.services.database.status} ({health.services.database.latencyMs ?? 0}ms)</div>
          <div><strong>Uptime:</strong> {Math.round(health.uptime)}s</div>
          <div><strong>Memory:</strong> {health.system.memory.heapUsedMb} MB</div>
        </div>
      }
    >
      <Chip
        size="small"
        icon={isHealthy ? <CheckCircle2 size={14} className="text-emerald-600" /> : <Activity size={14} className="text-amber-600" />}
        label={`API v${health.version}`}
        color={isHealthy ? "success" : "warning"}
        variant="outlined"
        onClick={checkHealth}
        clickable
      />
    </Tooltip>
  );
};

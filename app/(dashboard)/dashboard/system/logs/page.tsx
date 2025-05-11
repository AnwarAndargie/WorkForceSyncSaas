"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, ArrowDownToLine, Filter } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { getUser } from "@/lib/db/queries/users";

// Type for system log
interface SystemLog {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error";
  service: string;
  message: string;
  details?: string;
}

export default function SystemLogsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await getUser();
        setUser(user);

        // Check if the user exists and has the super_admin role
        if (!user || user.role !== "super_admin") {
          router.push("/dashboard");
          return;
        }

        // Generate mock logs for demo
        generateMockLogs();
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const generateMockLogs = () => {
    const services = ["api", "database", "auth", "storage", "email"];
    const infoMessages = [
      "User logged in",
      "Payment processed successfully",
      "Email sent to user",
      "Organization created",
      "Backup completed",
      "Scheduled task executed"
    ];
    const warnMessages = [
      "High API usage detected",
      "Low storage warning",
      "Failed login attempt",
      "Slow database query",
      "Rate limit approaching"
    ];
    const errorMessages = [
      "Database connection failed",
      "API endpoint returned 500",
      "Email delivery failed",
      "Storage quota exceeded",
      "Payment processing error"
    ];

    // Generate 50 mock logs with random data
    const mockLogs: SystemLog[] = [];
    const now = new Date();

    for (let i = 0; i < 50; i++) {
      const randomService = services[Math.floor(Math.random() * services.length)];
      const randomLevel = Math.random() < 0.7 ? "info" : (Math.random() < 0.5 ? "warn" : "error");
      
      let randomMessage;
      if (randomLevel === "info") {
        randomMessage = infoMessages[Math.floor(Math.random() * infoMessages.length)];
      } else if (randomLevel === "warn") {
        randomMessage = warnMessages[Math.floor(Math.random() * warnMessages.length)];
      } else {
        randomMessage = errorMessages[Math.floor(Math.random() * errorMessages.length)];
      }

      // Random timestamp within the last 24 hours
      const timestamp = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000);

      mockLogs.push({
        id: `log-${i}`,
        timestamp: timestamp.toISOString(),
        level: randomLevel as "info" | "warn" | "error",
        service: randomService,
        message: randomMessage,
        details: randomLevel === "error" ? "Stack trace or additional details would appear here" : undefined
      });
    }

    // Sort by timestamp (newest first)
    mockLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setLogs(mockLogs);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      generateMockLogs();
      setRefreshing(false);
    }, 1000);
  };

  const handleExport = () => {
    // Filter logs if needed
    const logsToExport = filter === "all" 
      ? logs 
      : logs.filter(log => log.level === filter);
    
    // Convert to CSV
    let csv = "ID,Timestamp,Level,Service,Message,Details\n";
    logsToExport.forEach(log => {
      csv += `${log.id},${log.timestamp},"${log.level}","${log.service}","${log.message.replace(/"/g, '""')}","${log.details?.replace(/"/g, '""') || ''}"\n`;
    });
    
    // Create and download the file
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const filteredLogs = filter === "all" 
    ? logs 
    : logs.filter(log => log.level === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-12 w-12 text-orange-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "System", href: "/dashboard/system" },
          { label: "Logs" }
        ]}
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">System Logs</h1>
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm">Filter:</span>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warn">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={handleExport} className="flex gap-2 items-center">
            <ArrowDownToLine className="h-4 w-4" />
            Export
          </Button>
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            className="flex gap-2 items-center"
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4 font-medium">Timestamp</th>
                  <th className="text-left py-3 px-4 font-medium">Level</th>
                  <th className="text-left py-3 px-4 font-medium">Service</th>
                  <th className="text-left py-3 px-4 font-medium">Message</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr 
                    key={log.id} 
                    className="border-b hover:bg-muted/30 cursor-pointer transition"
                    onClick={() => {
                      // Implement log details view here if needed
                      console.log("Log details:", log);
                    }}
                  >
                    <td className="py-3 px-4 text-xs text-gray-500">
                      {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                        log.level === "info" ? "bg-blue-100 text-blue-800" : 
                        log.level === "warn" ? "bg-yellow-100 text-yellow-800" : 
                        "bg-red-100 text-red-800"
                      }`}>
                        {log.level}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium">{log.service}</span>
                    </td>
                    <td className="py-3 px-4">{log.message}</td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-500">
                      No logs found matching the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
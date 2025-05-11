"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, Download, Loader2, Upload } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { getUser } from "@/lib/db/queries/users";

export default function ImportMembersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch current user
  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await getUser();
        setCurrentUser(user);

        if (!user || user.role !== "org_admin") {
          router.push("/dashboard");
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load user data");
        router.push("/dashboard");
      }
    };

    checkUser();
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setImportResult(null);
    const selectedFile = e.target.files?.[0];
    
    if (!selectedFile) {
      return;
    }
    
    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }
    
    setFile(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    setImportResult(null);
    
    const droppedFile = e.dataTransfer.files?.[0];
    
    if (!droppedFile) {
      return;
    }
    
    if (droppedFile.type !== 'text/csv' && !droppedFile.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }
    
    setFile(droppedFile);
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    if (!currentUser?.organizationId) {
      toast.error("Organization ID is missing");
      return;
    }
    
    setImporting(true);
    setError(null);
    setImportResult(null);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch(`/api/organization/${currentUser.organizationId}/users/import`, {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to import users');
      }
      
      const data = await res.json();
      setImportResult(data);
      toast.success(`Successfully imported ${data.totalImported} members`);
    } catch (error: any) {
      setError(error.message || 'Failed to import users');
      toast.error(error.message || 'Failed to import users');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = "email,name,role\nuser1@example.com,User One,member\nuser2@example.com,User Two,team_lead\n";
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'members-import-template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const resetForm = () => {
    setFile(null);
    setError(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-12 w-12 text-orange-500" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-10">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Members", href: "/dashboard/members" },
          { label: "Import" }
        ]}
      />

      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.push("/dashboard/members")}
          className="gap-2 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Members
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Import Members</CardTitle>
          <CardDescription>
            Upload a CSV file to import multiple members at once.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download Template
            </Button>
          </div>

          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors ${
              error ? 'border-red-500' : 'border-muted'
            }`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
            <Upload className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-lg font-medium mb-1">
              {file ? file.name : 'Drag & drop or click to upload a CSV file'}
            </p>
            <p className="text-sm text-muted-foreground mb-2">
              CSV file should have email, name (optional), and role columns
            </p>
            <p className="text-xs text-muted-foreground">
              Supported roles: member, team_lead, org_admin
            </p>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {file && !error && (
            <div className="bg-muted/50 p-4 rounded-md">
              <p className="font-semibold mb-1">Selected file:</p>
              <p className="text-sm">{file.name} ({(file.size / 1024).toFixed(2)} KB)</p>
            </div>
          )}

          {importResult && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-md">
              <p className="font-semibold text-green-800 mb-2">Import Summary:</p>
              <ul className="text-sm space-y-1 text-green-700">
                <li>Total imported: {importResult.totalImported} members</li>
                {importResult.totalErrors > 0 && (
                  <li>Errors: {importResult.totalErrors}</li>
                )}
              </ul>

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-2 pt-2 border-t border-green-200">
                  <p className="font-semibold text-amber-800 mb-1">Warnings:</p>
                  <ul className="text-xs text-amber-700 list-disc pl-4 space-y-1">
                    {importResult.errors.map((error: string, index: number) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={resetForm}
              disabled={!file || importing}
            >
              Reset
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/members")}
              disabled={importing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || importing}
              className="bg-orange-400 text-white hover:bg-orange-300"
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Importing...
                </>
              ) : (
                "Import Members"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
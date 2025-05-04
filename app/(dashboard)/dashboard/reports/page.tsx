import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function Reports() {
  return (
    <Card className="max-4xl mx-auto mt-10 shadow-md">
      <CardHeader className="flex items-center justify-center">
        <AlertCircle className="h-10 w-10 text-orange-500" />
        <CardTitle className="text-center text-lg font-semibold text-gray-900 mt-4">
          No reports yet
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center text-gray-500 text-sm">
        When report calculation is done your reports will be available here.
      </CardContent>
    </Card>
  );
}

export default Reports;

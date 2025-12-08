import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Database, Award, CreditCard, Home } from "lucide-react";

const dataTypes = [
  { id: 'profile', label: 'Profile Information', icon: Database, description: 'Personal details and account information' },
  { id: 'properties', label: 'Properties', icon: Home, description: 'Rental property details' },
  { id: 'payments', label: 'Payment History', icon: CreditCard, description: 'All rent payments and manual entries' },
  { id: 'achievements', label: 'Achievements & Badges', icon: Award, description: 'Earned badges and streaks' },
  { id: 'reports', label: 'Rent Reports', icon: FileText, description: 'Generated reports and shares' },
];

const exportFormats = [
  { value: 'json', label: 'JSON', description: 'Machine-readable format' },
  { value: 'csv', label: 'CSV', description: 'Spreadsheet format' },
  { value: 'pdf', label: 'PDF', description: 'Human-readable report' },
];

export function EnhancedDataExport() {
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['all']);
  const [format, setFormat] = useState('json');
  const { toast } = useToast();

  const exportMutation = useMutation({
    mutationFn: async ({ dataTypes, format }: { dataTypes: string[], format: string }) => {
      const response = await apiRequest("POST", "/api/data-export-enhanced", {
        dataTypes,
        format,
      });
      if (!response.ok) throw new Error("Failed to export data");
      return response.json();
    },
    onSuccess: (data) => {
      // Create downloadable file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `enoikio-data-export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Your data has been exported as ${format.toUpperCase()} format.`,
      });
    },
    onError: () => {
      toast({
        title: "Export Failed",
        description: "Failed to export your data. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleTypeToggle = (typeId: string) => {
    if (typeId === 'all') {
      setSelectedTypes(['all']);
    } else {
      const newTypes = selectedTypes.includes('all')
        ? [typeId]
        : selectedTypes.includes(typeId)
          ? selectedTypes.filter(t => t !== typeId)
          : [...selectedTypes.filter(t => t !== 'all'), typeId];

      setSelectedTypes(newTypes.length === 0 ? ['all'] : newTypes);
    }
  };

  const handleExport = () => {
    exportMutation.mutate({
      dataTypes: selectedTypes,
      format,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Download className="h-5 w-5" />
          <span>Export Your Data</span>
        </CardTitle>
        <CardDescription>
          Download your Enoíkio data in various formats. You have the right to access all your personal data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Data Type Selection */}
        <div>
          <h4 className="font-medium mb-3">Select Data to Export</h4>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="all"
                checked={selectedTypes.includes('all')}
                onCheckedChange={() => handleTypeToggle('all')}
              />
              <label htmlFor="all" className="font-medium cursor-pointer">
                Export All Data
              </label>
            </div>

            {dataTypes.map((type) => {
              const IconComponent = type.icon;
              return (
                <div key={type.id} className="flex items-start space-x-2 pl-6">
                  <Checkbox
                    id={type.id}
                    checked={selectedTypes.includes(type.id) || selectedTypes.includes('all')}
                    onCheckedChange={() => handleTypeToggle(type.id)}
                    disabled={selectedTypes.includes('all')}
                  />
                  <div className="flex items-start space-x-2 cursor-pointer" onClick={() => handleTypeToggle(type.id)}>
                    <IconComponent className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <label htmlFor={type.id} className="font-medium cursor-pointer">
                        {type.label}
                      </label>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Format Selection */}
        <div>
          <h4 className="font-medium mb-3">Export Format</h4>
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {exportFormats.map((fmt) => (
                <SelectItem key={fmt.value} value={fmt.value}>
                  <div>
                    <div className="font-medium">{fmt.label}</div>
                    <div className="text-sm text-muted-foreground">{fmt.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Privacy Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Data Privacy Notice</h5>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Your exported data will contain personal information. Please store it securely and only share with trusted parties.
            This export does not include any third-party data or sensitive authentication tokens.
          </p>
        </div>

        {/* Export Button */}
        <Button
          onClick={handleExport}
          disabled={exportMutation.isPending || selectedTypes.length === 0}
          className="w-full"
        >
          {exportMutation.isPending ? (
            "Preparing Export..."
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export Selected Data
            </>
          )}
        </Button>

        {/* Additional Information */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Exports are generated in real-time and contain current data</p>
          <p>• Large exports may take a few moments to process</p>
          <p>• Contact support if you need data older than 7 years</p>
        </div>
      </CardContent>
    </Card>
  );
}
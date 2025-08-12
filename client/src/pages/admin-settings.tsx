import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, ArrowLeft, Mail, Shield, Globe, Database, Bell } from "lucide-react";
import { useLocation } from "wouter";

interface SystemSettings {
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
  requireEmailVerification: boolean;
  defaultSubscriptionPlan: string;
  maxFreeUsers: number;
  systemEmail: string;
  supportEmail: string;
  platformName: string;
  platformDescription: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  dataRetentionDays: number;
  sessionTimeoutMinutes: number;
}

export default function AdminSettings() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [adminSession, setAdminSession] = useState<any>(null);
  const [settings, setSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    allowNewRegistrations: true,
    requireEmailVerification: true,
    defaultSubscriptionPlan: 'free',
    maxFreeUsers: 1000,
    systemEmail: 'system@enoikio.co.uk',
    supportEmail: 'support@enoikio.co.uk',
    platformName: 'Enoíkio',
    platformDescription: 'Rent payment tracking and credit building platform',
    emailNotifications: true,
    smsNotifications: false,
    dataRetentionDays: 365,
    sessionTimeoutMinutes: 60,
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    try {
      const session = localStorage.getItem('admin_session');
      if (session) {
        const parsedSession = JSON.parse(session);
        if (parsedSession.role === 'admin') {
          setAdminSession(parsedSession);
        } else {
          setLocation('/admin-login');
          return;
        }
      } else {
        setLocation('/admin-login');
        return;
      }
    } catch (error) {
      console.error('Error checking admin session:', error);
      setLocation('/admin-login');
    }
  }, [setLocation]);

  const adminQuery = (url: string) => {
    return fetch(url, {
      headers: { 'x-admin-session': JSON.stringify(adminSession) },
    }).then(res => {
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    });
  };

  const { data: currentSettings, isLoading } = useQuery<SystemSettings>({
    queryKey: ["/api/admin/settings"],
    queryFn: () => adminQuery("/api/admin/settings"),
    retry: false,
    enabled: !!adminSession,

  });

  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings: SystemSettings) => 
      fetch('/api/admin/update-settings', {
        method: 'POST',
        headers: {
          'x-admin-session': JSON.stringify(adminSession),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "System settings have been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update system settings",
        variant: "destructive",
      });
    }
  });

  const testEmailMutation = useMutation({
    mutationFn: () => 
      fetch('/api/admin/test-email', {
        method: 'POST',
        headers: {
          'x-admin-session': JSON.stringify(adminSession),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: settings.supportEmail }),
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Test Email Sent",
        description: "Test email has been sent successfully",
      });
    },
    onError: () => {
      toast({
        title: "Email Test Failed",
        description: "Failed to send test email",
        variant: "destructive",
      });
    }
  });

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(settings);
  };

  const handleSettingChange = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (!adminSession) {
    return <div className="min-h-screen bg-light-gray"><Navigation /></div>;
  }

  return (
    <div className="min-h-screen bg-light-gray">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => setLocation('/admin')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
            <div>
              <div className="flex items-center space-x-2">
                <Settings className="h-8 w-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
              </div>
              <p className="text-gray-600">Configure platform settings and preferences</p>
            </div>
          </div>
          <Button 
            onClick={handleSaveSettings}
            disabled={updateSettingsMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Save All Changes
          </Button>
        </div>

        <div className="space-y-6">
          {/* Platform Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Platform Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="platformName">Platform Name</Label>
                  <Input
                    id="platformName"
                    value={settings.platformName}
                    onChange={(e) => handleSettingChange('platformName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="systemEmail">System Email</Label>
                  <Input
                    id="systemEmail"
                    type="email"
                    value={settings.systemEmail}
                    onChange={(e) => handleSettingChange('systemEmail', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="platformDescription">Platform Description</Label>
                <Textarea
                  id="platformDescription"
                  value={settings.platformDescription}
                  onChange={(e) => handleSettingChange('platformDescription', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* User Management Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>User Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allowRegistrations">Allow New Registrations</Label>
                  <p className="text-sm text-gray-500">Enable or disable new user sign-ups</p>
                </div>
                <Switch
                  id="allowRegistrations"
                  checked={settings.allowNewRegistrations}
                  onCheckedChange={(checked) => handleSettingChange('allowNewRegistrations', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="requireVerification">Require Email Verification</Label>
                  <p className="text-sm text-gray-500">Users must verify email before access</p>
                </div>
                <Switch
                  id="requireVerification"
                  checked={settings.requireEmailVerification}
                  onCheckedChange={(checked) => handleSettingChange('requireEmailVerification', checked)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="defaultPlan">Default Subscription Plan</Label>
                  <Select 
                    value={settings.defaultSubscriptionPlan}
                    onValueChange={(value) => handleSettingChange('defaultSubscriptionPlan', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="maxFreeUsers">Max Free Users</Label>
                  <Input
                    id="maxFreeUsers"
                    type="number"
                    value={settings.maxFreeUsers}
                    onChange={(e) => handleSettingChange('maxFreeUsers', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>Email Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="supportEmail">Support Email</Label>
                <div className="flex space-x-2">
                  <Input
                    id="supportEmail"
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => handleSettingChange('supportEmail', e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={() => testEmailMutation.mutate()}
                    disabled={testEmailMutation.isPending}
                  >
                    Test Email
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-sm text-gray-500">Send system email notifications</p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* System Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Security & Data</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                  <p className="text-sm text-gray-500">Enable to restrict access during maintenance</p>
                </div>
                <Switch
                  id="maintenanceMode"
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => handleSettingChange('maintenanceMode', checked)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dataRetention">Data Retention (Days)</Label>
                  <Input
                    id="dataRetention"
                    type="number"
                    value={settings.dataRetentionDays}
                    onChange={(e) => handleSettingChange('dataRetentionDays', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="sessionTimeout">Session Timeout (Minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.sessionTimeoutMinutes}
                    onChange={(e) => handleSettingChange('sessionTimeoutMinutes', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notifications</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="smsNotifications">SMS Notifications</Label>
                  <p className="text-sm text-gray-500">Enable SMS notifications (requires Twilio setup)</p>
                </div>
                <Switch
                  id="smsNotifications"
                  checked={settings.smsNotifications}
                  onCheckedChange={(checked) => handleSettingChange('smsNotifications', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Button 
            onClick={handleSaveSettings}
            disabled={updateSettingsMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 px-8 py-2"
            size="lg"
          >
            {updateSettingsMutation.isPending ? 'Saving...' : 'Save All Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
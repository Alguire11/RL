import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Bell, BellRing, Mail, MessageSquare, Smartphone } from "lucide-react";

interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  reminderDays: number;
  reminderTime: string;
  overdueReminders: boolean;
  weeklySummary: boolean;
  landlordUpdates: boolean;
}

export function NotificationCenter() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings>({
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: false,
    reminderDays: 3,
    reminderTime: "09:00",
    overdueReminders: true,
    weeklySummary: true,
    landlordUpdates: true,
  });

  // Request push notification permission
  const requestPushPermission = async () => {
    if (!("Notification" in window)) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in this browser",
        variant: "destructive",
      });
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      toast({
        title: "Notifications Enabled",
        description: "You'll now receive push notifications for payment reminders",
      });
      return true;
    } else {
      toast({
        title: "Permission Denied",
        description: "Push notifications have been disabled",
        variant: "destructive",
      });
      return false;
    }
  };

  const { data: userPreferences } = useQuery({
    queryKey: ["/api/user/notification-preferences"],
    retry: false,
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (newSettings: NotificationSettings) => {
      const response = await apiRequest("PUT", "/api/user/notification-preferences", newSettings);
      if (!response.ok) throw new Error("Failed to update preferences");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/notification-preferences"] });
      toast({
        title: "Settings Updated",
        description: "Your notification preferences have been saved",
      });
    },
  });

  const testNotificationMutation = useMutation({
    mutationFn: async (type: string) => {
      const response = await apiRequest("POST", "/api/notifications/test", { type });
      if (!response.ok) throw new Error("Failed to send test notification");
      return response.json();
    },
    onSuccess: (data, type) => {
      toast({
        title: "Test Notification Sent",
        description: `A test ${type} notification has been sent`,
      });
    },
  });

  // Load user preferences
  useEffect(() => {
    if (userPreferences) {
      setSettings(userPreferences);
    }
  }, [userPreferences]);

  const handleSettingChange = (key: keyof NotificationSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    updatePreferencesMutation.mutate(newSettings);
  };

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestPushPermission();
      if (granted) {
        handleSettingChange("pushEnabled", true);
      }
    } else {
      handleSettingChange("pushEnabled", false);
    }
  };

  const sendTestNotification = (type: string) => {
    if (type === "push" && settings.pushEnabled) {
      new Notification("Enoíkio - Test Notification", {
        body: "This is a test push notification for payment reminders",
        icon: "/favicon.ico",
        badge: "/favicon.ico",
      });
    }
    testNotificationMutation.mutate(type);
  };

  return (
    <div className="space-y-6">
      {/* Push Notification Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BellRing className="h-5 w-5" />
            <span>Payment Reminders</span>
          </CardTitle>
          <CardDescription>
            Get notified before your rent is due to maintain your payment streak
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="reminder-days">Remind me</Label>
              <p className="text-sm text-gray-600">Days before rent is due</p>
            </div>
            <Select
              value={settings.reminderDays.toString()}
              onValueChange={(value) => handleSettingChange("reminderDays", parseInt(value))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 day</SelectItem>
                <SelectItem value="2">2 days</SelectItem>
                <SelectItem value="3">3 days</SelectItem>
                <SelectItem value="5">5 days</SelectItem>
                <SelectItem value="7">7 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="reminder-time">Reminder time</Label>
              <p className="text-sm text-gray-600">What time to send reminders</p>
            </div>
            <Select
              value={settings.reminderTime}
              onValueChange={(value) => handleSettingChange("reminderTime", value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="08:00">8:00 AM</SelectItem>
                <SelectItem value="09:00">9:00 AM</SelectItem>
                <SelectItem value="10:00">10:00 AM</SelectItem>
                <SelectItem value="12:00">12:00 PM</SelectItem>
                <SelectItem value="18:00">6:00 PM</SelectItem>
                <SelectItem value="20:00">8:00 PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-blue-600" />
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-gray-600">Receive reminders via email</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.emailEnabled}
                onCheckedChange={(checked) => handleSettingChange("emailEnabled", checked)}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendTestNotification("email")}
                disabled={!settings.emailEnabled}
              >
                Test
              </Button>
            </div>
          </div>

          {/* SMS Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageSquare className="h-5 w-5 text-green-600" />
              <div>
                <Label>SMS Notifications</Label>
                <p className="text-sm text-gray-600">Receive reminders via text message</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.smsEnabled}
                onCheckedChange={(checked) => handleSettingChange("smsEnabled", checked)}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendTestNotification("sms")}
                disabled={!settings.smsEnabled}
              >
                Test
              </Button>
            </div>
          </div>

          {/* Push Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Smartphone className="h-5 w-5 text-purple-600" />
              <div>
                <Label>Push Notifications</Label>
                <p className="text-sm text-gray-600">Receive browser push notifications</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.pushEnabled}
                onCheckedChange={handlePushToggle}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendTestNotification("push")}
                disabled={!settings.pushEnabled}
              >
                Test
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notifications</CardTitle>
          <CardDescription>
            Other notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Overdue Payment Alerts</Label>
              <p className="text-sm text-gray-600">Get notified when rent is overdue</p>
            </div>
            <Switch
              checked={settings.overdueReminders}
              onCheckedChange={(checked) => handleSettingChange("overdueReminders", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Weekly Summary</Label>
              <p className="text-sm text-gray-600">Weekly payment streak and credit score updates</p>
            </div>
            <Switch
              checked={settings.weeklySummary}
              onCheckedChange={(checked) => handleSettingChange("weeklySummary", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Landlord Updates</Label>
              <p className="text-sm text-gray-600">Notifications about landlord verification status</p>
            </div>
            <Switch
              checked={settings.landlordUpdates}
              onCheckedChange={(checked) => handleSettingChange("landlordUpdates", checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
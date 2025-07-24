import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { CheckCircle, AlertCircle, Clock, Server, Database, Shield, Zap, ArrowLeft } from "lucide-react";

export default function Status() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const services = [
    {
      name: "Core API",
      status: "operational",
      description: "Main application API",
      uptime: "99.9%",
      responseTime: "45ms",
      lastIncident: "No incidents"
    },
    {
      name: "Database",
      status: "operational",
      description: "PostgreSQL database cluster",
      uptime: "99.95%",
      responseTime: "12ms",
      lastIncident: "No incidents"
    },
    {
      name: "Authentication",
      status: "operational",
      description: "User authentication service",
      uptime: "99.8%",
      responseTime: "78ms",
      lastIncident: "No incidents"
    },
    {
      name: "Payment Processing",
      status: "operational",
      description: "Stripe payment integration",
      uptime: "99.92%",
      responseTime: "156ms",
      lastIncident: "No incidents"
    },
    {
      name: "Open Banking",
      status: "degraded",
      description: "Bank connection service",
      uptime: "98.5%",
      responseTime: "234ms",
      lastIncident: "2 hours ago"
    },
    {
      name: "Email Service",
      status: "operational",
      description: "Notification email delivery",
      uptime: "99.7%",
      responseTime: "89ms",
      lastIncident: "No incidents"
    }
  ];

  const incidents = [
    {
      id: 1,
      title: "Intermittent Open Banking Connection Issues",
      status: "investigating",
      severity: "medium",
      startTime: "2024-01-17 21:30 UTC",
      description: "Some users experiencing delays when connecting to certain bank providers.",
      updates: [
        { time: "21:45", message: "We are investigating reports of connection delays with select banking providers." },
        { time: "22:15", message: "Issue identified with third-party banking API. Working on resolution." },
        { time: "22:30", message: "Implementing temporary workaround to improve connection stability." }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'outage': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'degraded': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'outage': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational': return <Badge className="bg-green-100 text-green-800">Operational</Badge>;
      case 'degraded': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Degraded</Badge>;
      case 'outage': return <Badge variant="destructive">Outage</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"  
          onClick={() => setLocation(isAuthenticated ? "/" : "/")}
          className="mb-6 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to {isAuthenticated ? "Dashboard" : "Home"}
        </Button>
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">System Status</h1>
          <p className="text-xl text-gray-600">
            Current status of Enoíkio services and infrastructure
          </p>
        </div>

        {/* Overall Status */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Overall Status</CardTitle>
                <CardDescription>All systems operational</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-lg font-medium text-green-600">Operational</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">99.9%</div>
                <div className="text-sm text-gray-600">30-day uptime</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">67ms</div>
                <div className="text-sm text-gray-600">Average response time</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">0</div>
                <div className="text-sm text-gray-600">Active incidents</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Service Status</CardTitle>
            <CardDescription>Status of individual services and components</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {services.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(service.status)}
                    <div>
                      <h3 className="font-semibold">{service.name}</h3>
                      <p className="text-sm text-gray-600">{service.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-sm font-medium">{service.uptime}</div>
                      <div className="text-xs text-gray-500">Uptime</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">{service.responseTime}</div>
                      <div className="text-xs text-gray-500">Response</div>
                    </div>
                    {getStatusBadge(service.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Current Incidents */}
        {incidents.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Current Incidents</CardTitle>
              <CardDescription>Active incidents and service disruptions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {incidents.map((incident) => (
                  <div key={incident.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{incident.title}</h3>
                        <p className="text-sm text-gray-600">{incident.description}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="mb-2">
                          {incident.status}
                        </Badge>
                        <p className="text-xs text-gray-500">Started: {incident.startTime}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Updates:</h4>
                      {incident.updates.map((update, updateIndex) => (
                        <div key={updateIndex} className="flex space-x-3">
                          <span className="text-sm text-gray-500 min-w-[50px]">{update.time}</span>
                          <span className="text-sm">{update.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Status History</CardTitle>
            <CardDescription>Past 30 days of system uptime</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">January 17, 2024</span>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Partial outage - Open Banking</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">January 15, 2024</span>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">No incidents</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">January 12, 2024</span>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">No incidents</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">January 10, 2024</span>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm">Database maintenance - Scheduled</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">January 8, 2024</span>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">No incidents</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscribe for Updates */}
        <div className="text-center mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Stay Updated</h2>
          <p className="text-gray-600 mb-6">
            Subscribe to status updates to be notified of any service disruptions
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium">
              Subscribe to Updates
            </button>
            <button className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-medium">
              RSS Feed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
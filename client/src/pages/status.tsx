import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/navigation";
import { CheckCircle, AlertCircle, XCircle, Clock } from "lucide-react";

export default function Status() {
  const services = [
    {
      name: "API Services",
      status: "operational",
      description: "All API endpoints are functioning normally",
      uptime: "99.9%"
    },
    {
      name: "Bank Connections",
      status: "operational",
      description: "Bank account linking and payment tracking",
      uptime: "99.8%"
    },
    {
      name: "Credit Reports",
      status: "operational",
      description: "Report generation and sharing services",
      uptime: "99.9%"
    },
    {
      name: "User Dashboard",
      status: "operational",
      description: "Web application and user interface",
      uptime: "99.9%"
    },
    {
      name: "Email Notifications",
      status: "maintenance",
      description: "Email services undergoing scheduled maintenance",
      uptime: "99.7%"
    },
    {
      name: "Mobile App",
      status: "operational",
      description: "Mobile application services",
      uptime: "99.8%"
    }
  ];

  const incidents = [
    {
      title: "Scheduled Maintenance - Email Services",
      status: "ongoing",
      description: "We're performing scheduled maintenance on our email notification system. Some users may experience delays in receiving email notifications.",
      startTime: "2024-12-15 02:00 GMT",
      estimatedEnd: "2024-12-15 06:00 GMT"
    },
    {
      title: "API Rate Limiting Issues",
      status: "resolved",
      description: "Some users experienced rate limiting errors when accessing the API. This has been resolved by increasing rate limits.",
      startTime: "2024-12-14 14:30 GMT",
      endTime: "2024-12-14 15:45 GMT"
    },
    {
      title: "Database Performance Degradation",
      status: "resolved",
      description: "Users experienced slower loading times due to database performance issues. The issue has been resolved.",
      startTime: "2024-12-13 09:15 GMT",
      endTime: "2024-12-13 11:30 GMT"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "maintenance":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "degraded":
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case "outage":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "operational":
        return <Badge className="bg-green-100 text-green-800">Operational</Badge>;
      case "maintenance":
        return <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>;
      case "degraded":
        return <Badge className="bg-orange-100 text-orange-800">Degraded</Badge>;
      case "outage":
        return <Badge className="bg-red-100 text-red-800">Outage</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const getIncidentBadge = (status: string) => {
    switch (status) {
      case "ongoing":
        return <Badge className="bg-yellow-100 text-yellow-800">Ongoing</Badge>;
      case "resolved":
        return <Badge className="bg-green-100 text-green-800">Resolved</Badge>;
      case "investigating":
        return <Badge className="bg-orange-100 text-orange-800">Investigating</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
              System Status
            </h1>
            <p className="text-xl text-gray-600">
              Current status of all Enoíkio services and systems.
            </p>
          </div>

          <div className="mb-12">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">Overall Status</CardTitle>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <span className="text-lg font-semibold text-green-600">All Systems Operational</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  All core services are operating normally. Some minor maintenance is ongoing for email notifications.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Service Status</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {services.map((service, index) => (
                <Card key={index} className="border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{service.name}</CardTitle>
                      {getStatusBadge(service.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-gray-600">{service.description}</p>
                      {getStatusIcon(service.status)}
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Uptime: {service.uptime}</span>
                      <span>Last 30 days</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Recent Incidents</h2>
            <div className="space-y-4">
              {incidents.map((incident, index) => (
                <Card key={index} className="border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{incident.title}</CardTitle>
                      {getIncidentBadge(incident.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{incident.description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Started: {incident.startTime}</span>
                      {incident.endTime ? (
                        <span>Resolved: {incident.endTime}</span>
                      ) : (
                        <span>Estimated end: {incident.estimatedEnd}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Average Response Time</span>
                    <span className="font-semibold">145ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">API Success Rate</span>
                    <span className="font-semibold">99.97%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Database Query Time</span>
                    <span className="font-semibold">23ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Error Rate</span>
                    <span className="font-semibold">0.03%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Maintenance Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">Upcoming Maintenance</h3>
                    <p className="text-sm text-gray-600">
                      Database optimization scheduled for December 22, 2024, 2:00-4:00 GMT
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Regular Maintenance</h3>
                    <p className="text-sm text-gray-600">
                      System updates occur every Sunday 1:00-3:00 GMT
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Emergency Contacts</h3>
                    <p className="text-sm text-gray-600">
                      For urgent issues, contact: emergency@enoikio.com
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Subscribe to Status Updates
                </h3>
                <p className="text-gray-600 mb-6">
                  Get notified about service updates, maintenance, and incidents.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors">
                    Subscribe
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
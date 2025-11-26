import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
    FileText,
    Download,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Calendar,
    BarChart3,
    PieChart,
    Users,
    Home,
    CheckCircle,
    Clock
} from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { LandlordHeader } from "@/components/landlord-header";

export default function LandlordReports() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const { plan } = useSubscription();
    const [timeRange, setTimeRange] = useState("30");
    const [selectedProperty, setSelectedProperty] = useState("all");

    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated || user?.role !== 'landlord') {
            setLocation('/landlord-login');
        }
    }, [authLoading, isAuthenticated, user, setLocation]);

    const { data: stats } = useQuery({
        queryKey: ['/api/landlord/stats'],
    }) as { data: any; isLoading: boolean };

    const { data: properties } = useQuery({
        queryKey: ['/api/properties'],
    }) as { data: any[]; isLoading: boolean };

    const { data: financialData } = useQuery({
        queryKey: ['/api/landlord/financial-report', timeRange],
    }) as { data: any; isLoading: boolean };

    const handleExportReport = (type: string) => {
        toast({
            title: "Exporting Report",
            description: `Your ${type} report is being generated...`,
        });
        // TODO: Implement actual export functionality
    };

    if (!user) {
        return <div>Loading...</div>;
    }

    const totalRevenue = financialData?.totalRevenue || 0;
    const totalExpenses = financialData?.totalExpenses || 0;
    const netIncome = totalRevenue - totalExpenses;
    const occupancyRate = stats?.occupancyRate || 0;
    const verificationRate = stats?.verificationRate || 0;

    return (
        <div className="min-h-screen bg-white">
            <LandlordHeader user={user} plan={plan} activePage="reports" />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
                        <p className="text-gray-600 mt-2">Track performance and generate insights</p>
                    </div>
                    <div className="flex space-x-3">
                        <Select value={timeRange} onValueChange={setTimeRange}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7">Last 7 days</SelectItem>
                                <SelectItem value="30">Last 30 days</SelectItem>
                                <SelectItem value="90">Last 90 days</SelectItem>
                                <SelectItem value="365">Last year</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={() => handleExportReport('Full')}>
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">£{totalRevenue.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                <span className="text-green-600 flex items-center">
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                    +12% from last period
                                </span>
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
                            <BarChart3 className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">£{netIncome.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                <span className={netIncome >= 0 ? "text-green-600" : "text-red-600"} className="flex items-center">
                                    {netIncome >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                                    {((netIncome / totalRevenue) * 100).toFixed(1)}% profit margin
                                </span>
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
                            <Home className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{occupancyRate}%</div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                <div
                                    className="bg-purple-600 h-2 rounded-full"
                                    style={{ width: `${occupancyRate}%` }}
                                ></div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Verification Rate</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{verificationRate}%</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {stats?.totalVerifications || 0} verified payments
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Reports */}
                <Tabs defaultValue="financial" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="financial">Financial</TabsTrigger>
                        <TabsTrigger value="properties">Properties</TabsTrigger>
                        <TabsTrigger value="tenants">Tenants</TabsTrigger>
                        <TabsTrigger value="verifications">Verifications</TabsTrigger>
                    </TabsList>

                    <TabsContent value="financial" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Financial Overview</CardTitle>
                                <CardDescription>Revenue and expense breakdown for the selected period</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium">Revenue</span>
                                            <span className="text-sm font-bold text-green-600">£{totalRevenue.toLocaleString()}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div className="bg-green-600 h-3 rounded-full" style={{ width: '100%' }}></div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium">Expenses</span>
                                            <span className="text-sm font-bold text-red-600">£{totalExpenses.toLocaleString()}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className="bg-red-600 h-3 rounded-full"
                                                style={{ width: `${(totalExpenses / totalRevenue) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t">
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold">Net Income</span>
                                            <span className={`font-bold text-lg ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                £{netIncome.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    <Button className="w-full" variant="outline" onClick={() => handleExportReport('Financial')}>
                                        <Download className="h-4 w-4 mr-2" />
                                        Export Financial Report
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Revenue Sources</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm">Rent Payments</span>
                                            <Badge>£{(totalRevenue * 0.95).toLocaleString()}</Badge>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm">Late Fees</span>
                                            <Badge variant="outline">£{(totalRevenue * 0.03).toLocaleString()}</Badge>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm">Other Income</span>
                                            <Badge variant="outline">£{(totalRevenue * 0.02).toLocaleString()}</Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Expense Categories</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm">Maintenance</span>
                                            <Badge variant="destructive">£{(totalExpenses * 0.6).toLocaleString()}</Badge>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm">Property Tax</span>
                                            <Badge variant="outline">£{(totalExpenses * 0.25).toLocaleString()}</Badge>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm">Insurance</span>
                                            <Badge variant="outline">£{(totalExpenses * 0.15).toLocaleString()}</Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="properties" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Property Performance</CardTitle>
                                <CardDescription>Individual property metrics and performance</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {properties?.map((property: any) => (
                                        <div key={property.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex-1">
                                                <h4 className="font-semibold">{property.address}</h4>
                                                <p className="text-sm text-gray-600">{property.type} • {property.bedrooms} bed</p>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <div className="text-right">
                                                    <p className="text-sm text-gray-500">Monthly Rent</p>
                                                    <p className="font-semibold">£{property.rentAmount}</p>
                                                </div>
                                                {property.tenant ? (
                                                    <Badge className="bg-green-100 text-green-700">Occupied</Badge>
                                                ) : (
                                                    <Badge variant="outline">Vacant</Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Button className="w-full mt-4" variant="outline" onClick={() => handleExportReport('Properties')}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Export Property Report
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="tenants" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Tenant Statistics</CardTitle>
                                <CardDescription>Tenant payment history and performance</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div className="p-4 bg-blue-50 rounded-lg">
                                        <Users className="h-8 w-8 text-blue-600 mb-2" />
                                        <p className="text-2xl font-bold">{stats?.totalTenants || 0}</p>
                                        <p className="text-sm text-gray-600">Total Tenants</p>
                                    </div>
                                    <div className="p-4 bg-green-50 rounded-lg">
                                        <CheckCircle className="h-8 w-8 text-green-600 mb-2" />
                                        <p className="text-2xl font-bold">{stats?.onTimePayments || 0}</p>
                                        <p className="text-sm text-gray-600">On-Time Payments</p>
                                    </div>
                                    <div className="p-4 bg-yellow-50 rounded-lg">
                                        <Clock className="h-8 w-8 text-yellow-600 mb-2" />
                                        <p className="text-2xl font-bold">{stats?.latePayments || 0}</p>
                                        <p className="text-sm text-gray-600">Late Payments</p>
                                    </div>
                                </div>
                                <Button className="w-full" variant="outline" onClick={() => handleExportReport('Tenants')}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Export Tenant Report
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="verifications" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Verification Analytics</CardTitle>
                                <CardDescription>Payment verification trends and statistics</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 border rounded-lg">
                                            <p className="text-sm text-gray-500 mb-1">Total Verifications</p>
                                            <p className="text-3xl font-bold">{stats?.totalVerifications || 0}</p>
                                        </div>
                                        <div className="p-4 border rounded-lg">
                                            <p className="text-sm text-gray-500 mb-1">Pending Reviews</p>
                                            <p className="text-3xl font-bold text-yellow-600">{stats?.pendingVerifications || 0}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium mb-2">Verification Rate</p>
                                        <div className="w-full bg-gray-200 rounded-full h-4">
                                            <div
                                                className="bg-green-600 h-4 rounded-full flex items-center justify-end pr-2"
                                                style={{ width: `${verificationRate}%` }}
                                            >
                                                <span className="text-xs text-white font-medium">{verificationRate}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <Button className="w-full" variant="outline" onClick={() => handleExportReport('Verifications')}>
                                        <Download className="h-4 w-4 mr-2" />
                                        Export Verification Report
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}

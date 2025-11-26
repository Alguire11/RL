import { LandlordNavigation } from "@/components/landlord-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function LandlordAnalytics() {
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-2xl font-bold text-[#1e3a8a]">Analytics</h1>
                </div>
            </header>
            <LandlordNavigation />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <BarChart3 className="h-5 w-5 mr-2" />
                            Performance Analytics
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-500">Analytics dashboard features coming soon.</p>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

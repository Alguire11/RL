import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Calendar, CheckCircle, DollarSign, TrendingUp, Trophy } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function PublicPortfolio() {
    const { shareToken } = useParams();

    const { data: portfolio, isLoading, error } = useQuery({
        queryKey: [`/api/portfolio/${shareToken}`],
        queryFn: async () => {
            const response = await apiRequest("GET", `/api/portfolio/${shareToken}`);
            if (!response.ok) {
                throw new Error("Portfolio not found");
            }
            return response.json();
        },
        retry: false,
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    if (error || !portfolio) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <Card className="max-w-md">
                    <CardContent className="pt-6 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Portfolio Not Found</h2>
                        <p className="text-gray-600">This portfolio link may have expired or been removed.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    let badges = [];
    try {
        if (typeof portfolio.badges === 'string') {
            badges = JSON.parse(portfolio.badges);
        } else {
            badges = portfolio.badges || [];
        }
    } catch (e) {
        console.error("Failed to parse badges:", e);
    }

    let paymentHistory: { totalPayments?: number; onTimePayments?: number; averageAmount?: number } = {};
    try {
        if (typeof portfolio.paymentHistory === 'string') {
            paymentHistory = JSON.parse(portfolio.paymentHistory);
        } else {
            paymentHistory = portfolio.paymentHistory || {};
        }
    } catch (e) {
        console.error("Failed to parse paymentHistory:", e);
    }

    // Testimonials will still be strings from the DB blob unless we updated them too. The API merge only overwrote badges/history.
    // So testimonials logic remains as string parsing, which is safe due to previous fix.
    let testimonials = [];
    try {
        testimonials = portfolio.landlordTestimonials ? JSON.parse(portfolio.landlordTestimonials) : [];
    } catch (e) {
        console.error("Failed to parse landlordTestimonials:", e);
    }

    // Add Rent Score Display
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                        <Trophy className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">{portfolio.title}</h1>
                    {portfolio.description && (
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">{portfolio.description}</p>
                    )}
                    <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-500">
                        <span>Created: {formatDate(portfolio.createdAt)}</span>
                        <span>•</span>
                        <span>Expires: {formatDate(portfolio.expiresAt)}</span>
                    </div>
                </div>

                {/* Rent Score Benefit */}
                {portfolio.rentScore !== undefined && (
                    <Card className="bg-white shadow-lg border-t-4 border-t-indigo-600">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm font-medium text-gray-500 uppercase tracking-widest mb-1">Rent Score</p>
                                <div className="text-5xl font-extrabold text-indigo-600 mb-2">
                                    {portfolio.rentScore}
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-xs mx-auto mb-2">
                                    <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${(portfolio.rentScore / 1000) * 100}%` }}></div>
                                </div>
                                <p className="text-sm text-gray-600">Excellent reliability rating based on real-time data.</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Payment Performance Summary */}
                <Card className="bg-white shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                            Payment Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <div className="flex items-center justify-center mb-2">
                                    <CheckCircle className="w-6 h-6 text-blue-600 mr-2" />
                                    <span className="text-3xl font-bold text-blue-900">
                                        {paymentHistory.onTimePayments || 0}
                                    </span>
                                </div>
                                <p className="text-sm text-blue-700">On-Time Payments</p>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <div className="flex items-center justify-center mb-2">
                                    <DollarSign className="w-6 h-6 text-green-600 mr-2" />
                                    <span className="text-3xl font-bold text-green-900">
                                        {formatCurrency(paymentHistory.averageAmount || 0)}
                                    </span>
                                </div>
                                <p className="text-sm text-green-700">Average Payment</p>
                            </div>
                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                                <div className="flex items-center justify-center mb-2">
                                    <Calendar className="w-6 h-6 text-purple-600 mr-2" />
                                    <span className="text-3xl font-bold text-purple-900">
                                        {paymentHistory.totalPayments || 0}
                                    </span>
                                </div>
                                <p className="text-sm text-purple-700">Total Payments</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Achievement Badges */}
                {badges.length > 0 && (
                    <Card className="bg-white shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Award className="w-5 h-5 mr-2 text-yellow-600" />
                                Achievement Badges
                                <Badge className="ml-3 bg-yellow-100 text-yellow-800">{badges.length} Earned</Badge>
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-1">
                                Keep up the great work! You're building a strong rental history.
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-4">
                                {badges.map((badge: any, index: number) => (
                                    <div
                                        key={index}
                                        className="flex items-start space-x-4 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200"
                                    >
                                        <div className="flex-shrink-0">
                                            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                                                <Trophy className="w-6 h-6 text-yellow-600" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-gray-900 mb-1">
                                                {badge.title || badge.badgeType?.replace(/_/g, ' ')}
                                            </h4>
                                            <p className="text-sm text-gray-600 mb-2">
                                                {badge.description || badge.criteria}
                                            </p>
                                            {badge.earnedAt && (
                                                <p className="text-xs text-amber-600">
                                                    Earned {formatDate(badge.earnedAt)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Landlord Testimonials */}
                {/* Landlord Testimonials */}
                {testimonials.length > 0 && (
                    <Card className="bg-white shadow-lg">
                        <CardHeader>
                            <CardTitle>Landlord Testimonials</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {testimonials.map((testimonial: any, index: number) => (
                                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                                        <p className="text-gray-700 italic mb-2">"{testimonial.text}"</p>
                                        <p className="text-sm text-gray-600">— {testimonial.landlordName}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Footer */}
                <div className="text-center text-sm text-gray-500 mt-8">
                    <p>This portfolio is verified and authenticated by RLedger</p>
                    <p className="mt-1">Generated on {formatDate(new Date().toISOString())}</p>
                </div>
            </div>
        </div>
    );
}

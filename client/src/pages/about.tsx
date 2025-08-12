import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PublicNavigation } from "@/components/public-navigation";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/navigation";
import { Users, Target, Award, Heart } from "lucide-react";

export default function About() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {!isLoading && (isAuthenticated ? <Navigation /> : <PublicNavigation />)}
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
              About Enoíkio
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're on a mission to help UK tenants build credit through their rental payments and create better financial futures.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
              <p className="text-gray-600 mb-4">
                Founded in 2024, Enoíkio was born from a simple observation: tenants across the UK make consistent rent payments month after month, yet this reliable payment history rarely contributes to their credit score.
              </p>
              <p className="text-gray-600 mb-4">
                We recognized that this represented a massive missed opportunity for millions of renters who could be building credit through their housing expenses. Our platform bridges this gap by automatically tracking rent payments and transforming them into valuable credit history.
              </p>
              <p className="text-gray-600">
                Today, we're helping thousands of UK tenants improve their financial standing, secure better rates on loans, and achieve their homeownership dreams.
              </p>
            </div>
            
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-gray-600 mb-4">
                To democratize credit building by making rent payments count toward credit history, empowering tenants to build stronger financial futures through their housing expenses.
              </p>
              <p className="text-gray-600">
                We believe everyone deserves access to credit-building opportunities, regardless of their current financial situation or housing status.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-8 mb-16">
            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle className="text-2xl">10,000+</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Active Users</p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <Target className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle className="text-2xl">£50M+</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Rent Tracked</p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <Award className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <CardTitle className="text-2xl">25,000+</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Reports Generated</p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <Heart className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <CardTitle className="text-2xl">98%</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Customer Satisfaction</p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Our Values</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Transparency</h3>
                <p className="text-gray-600">
                  We believe in clear, honest communication about our services, pricing, and how we use your data.
                </p>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Security</h3>
                <p className="text-gray-600">
                  Your financial data is protected with bank-level security and encryption standards.
                </p>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Empowerment</h3>
                <p className="text-gray-600">
                  We're committed to giving you the tools and knowledge to take control of your financial future.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to Start Building Credit?</h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of UK tenants who are already building their credit through rent payments.
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg font-semibold rounded-xl"
              onClick={() => window.location.href = "/auth"}
            >
              Get Started Today
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
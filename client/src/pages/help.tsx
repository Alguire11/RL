import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navigation } from "@/components/navigation";
import { Search, Book, MessageSquare, Phone, ChevronDown, ChevronUp } from "lucide-react";

export default function Help() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "How does Enoíkio track my rent payments?",
      answer: "Enoíkio securely connects to your bank account through our encrypted platform. We identify recurring rent payments to your landlord and automatically track them. All connections use bank-level security with read-only access to your transaction history."
    },
    {
      question: "Will this affect my credit score immediately?",
      answer: "Building credit takes time. While we begin tracking your payments immediately, credit score improvements typically become visible after 3-6 months of consistent reporting. The impact depends on your overall credit profile and payment history."
    },
    {
      question: "What information do I need to get started?",
      answer: "You'll need your bank account details, rental agreement information, and landlord contact details. We also require identity verification to ensure accurate reporting to credit agencies."
    },
    {
      question: "Is my financial data secure?",
      answer: "Yes, we use bank-level 256-bit SSL encryption and comply with all UK financial regulations. Your data is stored securely and we never share your information without your explicit consent."
    },
    {
      question: "Can I use this if I share rent with flatmates?",
      answer: "Yes, you can use Enoíkio even if you split rent with flatmates. We'll track your portion of the rent payments and can work with shared payment arrangements."
    },
    {
      question: "How do I share my credit report with landlords?",
      answer: "Generate a report through your dashboard and use our secure sharing feature. You can send a link to landlords or download a PDF. Recipients can verify the report's authenticity through our platform."
    },
    {
      question: "What if I miss a rent payment?",
      answer: "We track all payments, including late or missed ones. However, you can add context or explanations to your payment history. One missed payment won't ruin your credit history if you have a generally good track record."
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes, you can cancel your subscription at any time through your account settings. Your data will remain accessible for 30 days after cancellation, and you can reactivate your account during this period."
    }
  ];

  const categories = [
    {
      title: "Getting Started",
      articles: [
        "Setting up your account",
        "Connecting your bank account",
        "Adding property details",
        "Verifying your identity"
      ]
    },
    {
      title: "Using Enoíkio",
      articles: [
        "Understanding your dashboard",
        "Generating credit reports",
        "Sharing reports with landlords",
        "Managing payment history"
      ]
    },
    {
      title: "Account Management",
      articles: [
        "Updating personal information",
        "Changing payment methods",
        "Managing subscriptions",
        "Deleting your account"
      ]
    },
    {
      title: "Credit Building",
      articles: [
        "How rent payments affect credit",
        "Timeline for credit improvements",
        "Understanding credit scores",
        "Tips for building credit"
      ]
    }
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
              Help Center
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Find answers to common questions and get help with Enoíkio.
            </p>
            
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search for help articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 py-3 text-lg"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="border-0 shadow-lg text-center hover:shadow-xl transition-shadow">
              <CardHeader>
                <Book className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle className="text-xl">Documentation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Comprehensive guides and tutorials to help you get the most out of Enoíkio.
                </p>
                <Button variant="outline">Browse Guides</Button>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg text-center hover:shadow-xl transition-shadow">
              <CardHeader>
                <MessageSquare className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle className="text-xl">Live Chat</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Get instant help from our support team during business hours.
                </p>
                <Button variant="outline">Start Chat</Button>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg text-center hover:shadow-xl transition-shadow">
              <CardHeader>
                <Phone className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <CardTitle className="text-xl">Phone Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Speak directly with our support team for personalized assistance.
                </p>
                <Button variant="outline">Call Us</Button>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl">Frequently Asked Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredFaqs.map((faq, index) => (
                      <div key={index} className="border-b border-gray-200 pb-4">
                        <Button
                          variant="ghost"
                          className="w-full justify-between text-left p-0 h-auto"
                          onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                        >
                          <span className="text-lg font-semibold text-gray-900">{faq.question}</span>
                          {expandedFaq === index ? (
                            <ChevronUp className="h-5 w-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-500" />
                          )}
                        </Button>
                        {expandedFaq === index && (
                          <div className="mt-3 text-gray-600 leading-relaxed">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl">Browse by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {categories.map((category, index) => (
                      <div key={index}>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          {category.title}
                        </h3>
                        <ul className="space-y-2">
                          {category.articles.map((article, articleIndex) => (
                            <li key={articleIndex}>
                              <Button
                                variant="ghost"
                                className="w-full justify-start text-left p-2 h-auto text-gray-600 hover:text-blue-600"
                              >
                                {article}
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg mt-8">
                <CardHeader>
                  <CardTitle className="text-xl">Still Need Help?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Can't find what you're looking for? Our support team is here to help.
                  </p>
                  <div className="space-y-3">
                    <Button className="w-full" onClick={() => window.location.href = "/contact"}>
                      Contact Support
                    </Button>
                    <Button variant="outline" className="w-full">
                      Report an Issue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
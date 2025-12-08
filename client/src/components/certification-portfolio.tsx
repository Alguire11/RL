import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FileText, Share2, Award, Clock, DollarSign, Star, Copy, Check, ExternalLink, Plus, Lock } from "lucide-react";
import { BadgeSystem } from "./badge-system";
import { useSubscription } from "@/hooks/useSubscription";

interface CertificationPortfolio {
  id: number;
  title: string;
  description: string;
  badges: any[];
  paymentHistory: any;
  landlordTestimonials: any[];
  shareToken: string;
  expiresAt: string;
  createdAt: string;
  isActive: boolean;
}

interface CertificationPortfolioProps {
  userId: string;
}

const portfolioSchema = z.object({
  title: z.string().min(1, "Portfolio title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
});

type PortfolioFormData = z.infer<typeof portfolioSchema>;

export function CertificationPortfolio({ userId }: CertificationPortfolioProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { plan } = useSubscription();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState<CertificationPortfolio | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const form = useForm<PortfolioFormData>({
    resolver: zodResolver(portfolioSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const { data: portfolios = [], isLoading } = useQuery<CertificationPortfolio[]>({
    queryKey: ["/api/certification-portfolios", userId],
    retry: false,
  });

  const { data: userStats } = useQuery<{
    paymentStreak: number;
    totalPaid: number;
    onTimePercentage: number;
  }>({
    queryKey: ["/api/dashboard/stats", userId],
    retry: false,
  });

  const { data: userBadges = [] } = useQuery<any[]>({
    queryKey: ["/api/user/badges", userId],
    retry: false,
  });

  const createPortfolioMutation = useMutation({
    mutationFn: async (data: PortfolioFormData) => {
      return apiRequest("POST", "/api/certification-portfolios", {
        title: data.title,
        description: data.description,
        userId,
      });
    },
    onSuccess: () => {
      toast({
        title: "Portfolio Created",
        description: "Your certification portfolio has been created successfully.",
      });
      form.reset();
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/certification-portfolios"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create portfolio",
        variant: "destructive",
      });
    },
  });

  const deletePortfolioMutation = useMutation({
    mutationFn: async (portfolioId: number) => {
      return apiRequest("DELETE", `/api/certification-portfolios/${portfolioId}`);
    },
    onSuccess: () => {
      toast({
        title: "Portfolio Deleted",
        description: "Portfolio has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/certification-portfolios"] });
      setSelectedPortfolio(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete portfolio",
        variant: "destructive",
      });
    },
  });

  const copyShareLink = async (portfolio: CertificationPortfolio) => {
    const shareUrl = `${window.location.origin}/portfolio/${portfolio.shareToken}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedToken(portfolio.shareToken);
      toast({
        title: "Link Copied",
        description: "Portfolio share link copied to clipboard.",
        variant: "default",
      });
      setTimeout(() => setCopiedToken(null), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleLockedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast({
      title: "Premium Feature",
      description: "Upgrade to Premium to create and share certification portfolios.",
      variant: "default",
      action: (
        <Button variant="outline" size="sm" onClick={() => window.location.href = '/subscribe'}>
          Upgrade
        </Button>
      ),
    });
  };

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

  const onSubmit = (data: PortfolioFormData) => {
    createPortfolioMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 rounded-lg p-6 h-40"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Certification Portfolio</h2>
          <p className="text-gray-600">
            Create professional portfolios showcasing your payment history and achievements to share with potential landlords.
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            {plan.id === 'premium' ? (
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Create Portfolio
              </Button>
            ) : (
              <Button className="bg-gray-200 text-gray-600 hover:bg-gray-300" onClick={handleLockedClick}>
                <Lock className="w-4 h-4 mr-2" />
                Unlock Portfolios
              </Button>
            )}
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Certification Portfolio</DialogTitle>
              <DialogDescription>
                Create a professional portfolio to showcase your rental payment history and achievements.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Portfolio Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Reliable Tenant Portfolio 2024" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Briefly describe your portfolio..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createPortfolioMutation.isPending}
                  >
                    {createPortfolioMutation.isPending ? "Creating..." : "Create Portfolio"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* User Stats Overview */}
      {userStats && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg text-blue-900">Your Payment Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="text-2xl font-bold text-blue-900">{userStats.paymentStreak}</span>
                </div>
                <p className="text-sm text-blue-700">Payment Streak (months)</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <DollarSign className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-2xl font-bold text-green-900">{formatCurrency(userStats.totalPaid)}</span>
                </div>
                <p className="text-sm text-green-700">Total Paid</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Award className="w-5 h-5 text-yellow-600 mr-2" />
                  <span className="text-2xl font-bold text-yellow-900">{userBadges.length}</span>
                </div>
                <p className="text-sm text-yellow-700">Achievement Badges</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Portfolios */}
      {portfolios.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No portfolios yet</h3>
            <p className="text-gray-500 mb-6">
              Create your first certification portfolio to showcase your payment history to potential landlords.
            </p>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Portfolio
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {portfolios.map((portfolio) => (
            <Card key={portfolio.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{portfolio.title}</CardTitle>
                    {portfolio.description && (
                      <p className="text-sm text-gray-600 mt-1">{portfolio.description}</p>
                    )}
                  </div>
                  <Badge
                    variant={portfolio.isActive ? "default" : "secondary"}
                  >
                    {portfolio.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Portfolio Stats */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <div className="font-medium">{formatDate(portfolio.createdAt)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Expires:</span>
                      <div className="font-medium">{formatDate(portfolio.expiresAt)}</div>
                    </div>
                  </div>
                </div>

                {/* Badges Preview */}
                {userBadges.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Included Badges ({userBadges.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {userBadges.slice(0, 3).map((badge: any) => (
                        <div key={badge.id} className="flex items-center space-x-1">
                          <Award className="w-3 h-3 text-yellow-500" />
                          <span className="text-xs">{badge.badgeType.replace('_', ' ')}</span>
                        </div>
                      ))}
                      {userBadges.length > 3 && (
                        <span className="text-xs text-gray-500">+{userBadges.length - 3} more</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between pt-2 border-t">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyShareLink(portfolio)}
                      className="flex items-center"
                    >
                      {copiedToken === portfolio.shareToken ? (
                        <Check className="w-3 h-3 mr-1" />
                      ) : (
                        <Copy className="w-3 h-3 mr-1" />
                      )}
                      {copiedToken === portfolio.shareToken ? "Copied!" : "Copy Link"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/portfolio/${portfolio.shareToken}`, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Preview
                    </Button>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deletePortfolioMutation.mutate(portfolio.id)}
                    disabled={deletePortfolioMutation.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Badge System Integration */}
      <Card>
        <CardHeader>
          <CardTitle>Achievement Badges</CardTitle>
          <p className="text-sm text-gray-600">
            These badges are automatically included in your certification portfolios.
          </p>
        </CardHeader>
        <CardContent>
          <BadgeSystem userId={userId} showHeader={false} />
        </CardContent>
      </Card>
    </div>
  );
}
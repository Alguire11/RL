import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Building2, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  CreditCard,
  TrendingUp,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";

interface OpenBankingProps {
  onConnectionSuccess?: (connectionData: any) => void;
  mode?: 'onboarding' | 'settings';
}

const SUPPORTED_BANKS = [
  {
    id: 'lloyds',
    name: 'Lloyds Bank',
    logo: '🏦',
    connectionTime: '2-3 seconds',
    features: ['Real-time transactions', 'Account balance', 'Payment categorization']
  },
  {
    id: 'barclays',
    name: 'Barclays',
    logo: '🏛️',
    connectionTime: '3-4 seconds',
    features: ['Transaction history', 'Direct debits', 'Standing orders']
  },
  {
    id: 'hsbc',
    name: 'HSBC',
    logo: '🏦',
    connectionTime: '2-3 seconds',
    features: ['Account details', 'Transaction data', 'Balance information']
  },
  {
    id: 'natwest',
    name: 'NatWest',
    logo: '🏪',
    connectionTime: '3-5 seconds',
    features: ['Full transaction history', 'Account verification', 'Payment tracking']
  },
  {
    id: 'santander',
    name: 'Santander',
    logo: '🏛️',
    connectionTime: '4-5 seconds',
    features: ['Transaction categorization', 'Balance tracking', 'Payment history']
  },
  {
    id: 'halifax',
    name: 'Halifax',
    logo: '🏦',
    connectionTime: '2-4 seconds',
    features: ['Real-time balance', 'Transaction alerts', 'Payment verification']
  }
];

export function OpenBankingSimulator({ onConnectionSuccess, mode = 'onboarding' }: OpenBankingProps) {
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [step, setStep] = useState<'select' | 'authenticate' | 'permissions' | 'connecting' | 'success'>('select');
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [connectionProgress, setConnectionProgress] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  const connectBankMutation = useMutation({
    mutationFn: async (bankData: any) => {
      const response = await apiRequest("POST", "/api/open-banking/connect", bankData);
      if (!response.ok) throw new Error("Failed to connect bank");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-connections"] });
      if (onConnectionSuccess) {
        onConnectionSuccess(data);
      }
    },
  });

  const simulateConnection = async () => {
    setStep('connecting');
    setConnectionProgress(0);
    
    // Simulate connection progress
    const progressSteps = [
      { progress: 20, message: 'Connecting to bank...' },
      { progress: 40, message: 'Authenticating credentials...' },
      { progress: 60, message: 'Verifying account access...' },
      { progress: 80, message: 'Fetching account data...' },
      { progress: 100, message: 'Connection established!' }
    ];

    for (const progressStep of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setConnectionProgress(progressStep.progress);
      
      if (progressStep.progress === 100) {
        setStep('success');
        
        // Create bank connection
        const bank = SUPPORTED_BANKS.find(b => b.id === selectedBank);
        const connectionData = {
          bankId: selectedBank,
          bankName: bank?.name,
          accountType: 'current',
          sortCode: '12-34-56',
          accountNumber: '12345678',
          balance: Math.floor(Math.random() * 5000) + 1000,
          isActive: true
        };
        
        connectBankMutation.mutate(connectionData);
        
        toast({
          title: "Bank Connected Successfully",
          description: `Your ${bank?.name} account has been connected and verified.`,
        });
        
        setTimeout(() => {
          setShowDialog(false);
          resetFlow();
        }, 3000);
      }
    }
  };

  const resetFlow = () => {
    setStep('select');
    setSelectedBank('');
    setCredentials({ username: '', password: '' });
    setConnectionProgress(0);
  };

  const startConnection = (bankId: string) => {
    setSelectedBank(bankId);
    setShowDialog(true);
    setStep('authenticate');
  };

  const handleAuth = () => {
    if (!credentials.username || !credentials.password) {
      toast({
        title: "Credentials Required",
        description: "Please enter your banking credentials",
        variant: "destructive",
      });
      return;
    }
    setStep('permissions');
  };

  const bank = SUPPORTED_BANKS.find(b => b.id === selectedBank);

  return (
    <div className="space-y-6">
      {/* Bank Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Connect Your Bank</span>
          </CardTitle>
          <CardDescription>
            Securely connect your bank account through Open Banking to automatically track rent payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SUPPORTED_BANKS.map((bank) => (
              <Card 
                key={bank.id} 
                className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-200"
                onClick={() => startConnection(bank.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-2xl">{bank.logo}</span>
                    <div>
                      <h3 className="font-semibold">{bank.name}</h3>
                      <p className="text-xs text-gray-500">Connect in {bank.connectionTime}</p>
                    </div>
                  </div>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {bank.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full mt-3" size="sm">
                    Connect {bank.name}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Bank-Level Security</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Your banking data is protected with 256-bit encryption. We use read-only access and never store your login credentials.
                </p>
                <ul className="text-xs text-blue-600 mt-2 space-y-1">
                  <li>• FCA regulated Open Banking provider</li>
                  <li>• TLS 1.3 encryption in transit</li>
                  <li>• No credential storage</li>
                  <li>• Revocable access tokens</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connection Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {bank && <span className="text-xl">{bank.logo}</span>}
              <span>Connect to {bank?.name}</span>
            </DialogTitle>
            <DialogDescription>
              Secure connection through Open Banking
            </DialogDescription>
          </DialogHeader>

          {step === 'authenticate' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username / Customer ID</Label>
                <Input
                  id="username"
                  placeholder="Enter your banking username"
                  value={credentials.username}
                  onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your banking password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Lock className="h-4 w-4" />
                <span>Your credentials are encrypted and never stored</span>
              </div>
              <Button onClick={handleAuth} className="w-full">
                Continue
              </Button>
            </div>
          )}

          {step === 'permissions' && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-semibold mb-2">Account Access Permissions</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Enoíkio is requesting access to the following data:
                </p>
              </div>
              
              <div className="space-y-3">
                {[
                  { icon: CreditCard, title: 'Account Information', desc: 'Basic account details and balance' },
                  { icon: TrendingUp, title: 'Transaction History', desc: 'Past 12 months of transaction data' },
                  { icon: CheckCircle, title: 'Payment Verification', desc: 'Verify rent payment transactions' }
                ].map((permission, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <permission.icon className="h-5 w-5 text-green-600" />
                    <div>
                      <h4 className="font-medium text-green-900">{permission.title}</h4>
                      <p className="text-xs text-green-700">{permission.desc}</p>
                    </div>
                    <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                  </div>
                ))}
              </div>
              
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This is read-only access. We cannot make payments or modify your account.
                </p>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setStep('authenticate')} className="flex-1">
                  Back
                </Button>
                <Button onClick={simulateConnection} className="flex-1">
                  Authorize Access
                </Button>
              </div>
            </div>
          )}

          {step === 'connecting' && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Connecting to {bank?.name}</h3>
                <p className="text-sm text-gray-600">Please wait while we establish a secure connection</p>
              </div>
              <Progress value={connectionProgress} className="w-full" />
              <p className="text-xs text-gray-500">{connectionProgress}% complete</p>
            </div>
          )}

          {step === 'success' && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900">Connection Successful!</h3>
                <p className="text-sm text-gray-600">
                  Your {bank?.name} account has been connected and verified
                </p>
              </div>
              <div className="space-y-2">
                <Badge className="bg-green-100 text-green-800">
                  ✓ Account Verified
                </Badge>
                <Badge className="bg-blue-100 text-blue-800">
                  ✓ Transactions Synced
                </Badge>
                <Badge className="bg-purple-100 text-purple-800">
                  ✓ Rent Tracking Active
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
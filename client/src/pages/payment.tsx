import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CreditCard, 
  Shield, 
  CheckCircle, 
  ArrowLeft,
  Calendar,
  Lock,
  Building2,
  Star,
  Zap,
  MapPin
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

const pricingPlans = {
  starter: { 
    name: "Starter", 
    price: 299, 
    originalPrice: 399,
    period: "month",
    features: [
      "Up to 100 patient interactions",
      "Basic AI chatbot",
      "Email support",
      "Standard templates",
      "Basic analytics"
    ]
  },
  professional: { 
    name: "Professional", 
    price: 699, 
    originalPrice: 899,
    period: "month",
    popular: true,
    features: [
      "Up to 1,000 patient interactions",
      "Advanced AI chatbot with face recognition",
      "Priority support & phone support",
      "Custom templates & branding",
      "Advanced analytics & reporting",
      "Multi-language support",
      "API access"
    ]
  },
  enterprise: { 
    name: "Enterprise", 
    price: 1299, 
    originalPrice: 1699,
    period: "month",
    features: [
      "Unlimited patient interactions",
      "Full AI suite with custom training",
      "Dedicated account manager",
      "White-label solution",
      "Advanced integrations",
      "Custom development",
      "SLA guarantee",
      "On-premise deployment option"
    ]
  }
};

export default function Payment() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const [clinicData, setClinicData] = useState<any>(null);
  const selectedPlan = searchParams.get('plan') || 'professional';
  const clinicId = searchParams.get('clinicId');
  
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [billingPeriod, setBillingPeriod] = useState("annual");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const plan = pricingPlans[selectedPlan as keyof typeof pricingPlans];

  // Load clinic data from localStorage
  useEffect(() => {
    const savedClinicData = localStorage.getItem('clinicRegistrationData');
    if (savedClinicData) {
      try {
        const parsedData = JSON.parse(savedClinicData);
        setClinicData(parsedData);
        console.log("Loaded clinic data from localStorage:", parsedData);
      } catch (error) {
        console.error("Error parsing clinic data from localStorage:", error);
      }
    }
  }, []);
  
  // Calculate prices based on billing period
  const getPrice = () => {
    if (billingPeriod === "annual") {
      return Math.round(plan.price * 12 * 0.8); // 20% discount for annual
    }
    return plan.price;
  };

  const getSavings = () => {
    if (billingPeriod === "annual") {
      return Math.round(plan.price * 12 * 0.2);
    }
    return 0;
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast({
        title: "Payment Successful!",
        description: "Your subscription is now active. Welcome to MedCor AI!",
      });
      
      // Redirect to dashboard or success page
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);
      
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "Please check your payment details and try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/signup">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Registration
            </Button>
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Complete Your Subscription
          </h1>
          <p className="text-lg text-gray-600">
            Secure payment powered by industry-leading encryption
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Plan Details */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{plan.name}</h3>
                      {(plan as any).popular && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                          <Star className="h-3 w-3 mr-1" />
                          Popular
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    {plan.features.slice(0, 3).map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                    {plan.features.length > 3 && (
                      <div className="text-purple-600 font-medium">
                        +{plan.features.length - 3} more features
                      </div>
                    )}
                  </div>
                </div>

                {/* Billing Period Toggle */}
                <div className="space-y-3">
                  <Label>Billing Period</Label>
                  <Select value={billingPeriod} onValueChange={setBillingPeriod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly Billing</SelectItem>
                      <SelectItem value="annual">
                        Annual Billing 
                        <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
                          Save 20%
                        </Badge>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>
                      {plan.name} Plan ({billingPeriod === "annual" ? "Annual" : "Monthly"})
                    </span>
                    <span className="font-medium">
                      ${getPrice().toLocaleString()}
                    </span>
                  </div>
                  
                  {getSavings() > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Annual Discount (20%)</span>
                      <span>-${getSavings().toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Setup Fee</span>
                    <span className="line-through">$99</span>
                  </div>
                  
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Setup Fee (Limited Time)</span>
                    <span>FREE</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-purple-600">
                    ${getPrice().toLocaleString()}
                    <span className="text-sm font-normal text-gray-500">
                      /{billingPeriod === "annual" ? "year" : "month"}
                    </span>
                  </span>
                </div>

                {billingPeriod === "annual" && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700">
                      <Zap className="h-4 w-4" />
                      <span className="font-medium text-sm">
                        You save ${getSavings().toLocaleString()} annually!
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Information
                </CardTitle>
                <CardDescription>
                  Your payment is secured with 256-bit SSL encryption
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Payment Method Selection */}
                <div className="space-y-3">
                  <Label>Payment Method</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => setPaymentMethod("card")}
                      className={`p-4 border rounded-lg text-center transition-all ${
                        paymentMethod === "card" 
                          ? "border-purple-500 bg-purple-50" 
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <CreditCard className="h-6 w-6 mx-auto mb-2" />
                      <div className="font-medium">Credit Card</div>
                    </button>
                    <button
                      onClick={() => setPaymentMethod("paypal")}
                      className={`p-4 border rounded-lg text-center transition-all ${
                        paymentMethod === "paypal" 
                          ? "border-purple-500 bg-purple-50" 
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="h-6 w-6 mx-auto mb-2 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
                        PP
                      </div>
                      <div className="font-medium">PayPal</div>
                    </button>
                    <button
                      onClick={() => setPaymentMethod("bank")}
                      className={`p-4 border rounded-lg text-center transition-all ${
                        paymentMethod === "bank" 
                          ? "border-purple-500 bg-purple-50" 
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Building2 className="h-6 w-6 mx-auto mb-2" />
                      <div className="font-medium">Bank Transfer</div>
                    </button>
                  </div>
                </div>

                {/* Credit Card Form */}
                {paymentMethod === "card" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="cardName">Cardholder Name</Label>
                        <Input id="cardName" placeholder="John Doe" />
                      </div>
                      
                      <div>
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="expiry">Expiry Date</Label>
                          <Input id="expiry" placeholder="MM/YY" />
                        </div>
                        <div>
                          <Label htmlFor="cvv">CVV</Label>
                          <Input id="cvv" placeholder="123" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PayPal */}
                {paymentMethod === "paypal" && (
                  <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
                    <div className="text-blue-700 mb-2">
                      You will be redirected to PayPal to complete your payment
                    </div>
                    <div className="text-sm text-blue-600">
                      Secure payment processing by PayPal
                    </div>
                  </div>
                )}

                {/* Bank Transfer */}
                {paymentMethod === "bank" && (
                  <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="text-gray-700 mb-3 font-medium">
                      Bank Transfer Instructions
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div>Account: MedCor AI Ltd.</div>
                      <div>Bank: Chase Business Bank</div>
                      <div>Account Number: 1234567890</div>
                      <div>Routing: 021000021</div>
                      <div className="mt-3 text-orange-600">
                        Note: Bank transfers may take 3-5 business days to process
                      </div>
                    </div>
                  </div>
                )}

                {/* Billing Address */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Billing Address
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="billingAddress">Street Address</Label>
                      <Input id="billingAddress" placeholder="123 Main St" />
                    </div>
                    <div>
                      <Label htmlFor="billingCity">City</Label>
                      <Input id="billingCity" placeholder="New York" />
                    </div>
                    <div>
                      <Label htmlFor="billingState">State</Label>
                      <Input id="billingState" placeholder="NY" />
                    </div>
                    <div>
                      <Label htmlFor="billingZip">ZIP Code</Label>
                      <Input id="billingZip" placeholder="10001" />
                    </div>
                  </div>
                </div>

                {/* Security Features */}
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3 text-green-700">
                    <Shield className="h-5 w-5" />
                    <div>
                      <div className="font-medium">Secure Payment</div>
                      <div className="text-sm">256-bit SSL encryption • PCI DSS compliant</div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button 
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing Payment...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Lock className="h-5 w-5" />
                      Complete Payment - ${getPrice().toLocaleString()}
                    </div>
                  )}
                </Button>

                <div className="text-center text-sm text-gray-500">
                  By completing this purchase, you agree to our Terms of Service and Privacy Policy
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
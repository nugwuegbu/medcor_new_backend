import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check, Zap, Crown, Rocket, Users, MessageCircle, Shield, Phone, BarChart3, Calendar } from "lucide-react";
import { Link } from "wouter";

const pricingPlans = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for small clinics getting started with AI",
    price: 299,
    originalPrice: 399,
    discount: "25% OFF",
    icon: Zap,
    color: "from-blue-500 to-cyan-500",
    features: [
      "AI Chatbot for up to 500 patients/month",
      "Basic HeyGen Avatar (1 standard voice)",
      "Email support",
      "Patient appointment booking",
      "Basic analytics dashboard",
      "Multi-language support (5 languages)",
      "Face recognition login",
      "Mobile responsive design"
    ],
    limitations: [
      "No custom avatar",
      "Limited to 2 doctors",
      "Basic reporting only"
    ]
  },
  {
    id: "professional",
    name: "Professional",
    description: "Ideal for growing clinics with advanced needs",
    price: 699,
    originalPrice: 899,
    discount: "22% OFF",
    icon: Crown,
    color: "from-purple-500 to-pink-500",
    isPopular: true,
    features: [
      "AI Chatbot for up to 2,000 patients/month",
      "Custom HeyGen Avatar with your branding",
      "Multiple voice options (10+ voices)",
      "Priority email & chat support",
      "Advanced appointment management",
      "Comprehensive analytics & reporting",
      "Multi-language support (15+ languages)",
      "Face recognition + voice authentication",
      "Custom domain integration",
      "API access for integrations",
      "Patient health records management",
      "Automated follow-up campaigns"
    ],
    limitations: [
      "Limited to 5 doctors"
    ]
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large hospitals and healthcare networks",
    price: 1299,
    originalPrice: 1699,
    discount: "24% OFF",
    icon: Rocket,
    color: "from-orange-500 to-red-500",
    features: [
      "Unlimited AI Chatbot interactions",
      "Multiple custom HeyGen Avatars",
      "Premium voice library (50+ voices)",
      "24/7 phone & dedicated support",
      "Complete hospital management suite",
      "Advanced AI analytics & insights",
      "Unlimited languages & localization",
      "Multi-factor authentication",
      "White-label solution",
      "Full API access & webhooks",
      "HIPAA compliance & security",
      "Multi-location support",
      "Custom integrations",
      "Dedicated account manager",
      "Training & onboarding included"
    ],
    limitations: []
  }
];

const additionalFeatures = [
  { icon: Users, title: "Patient Management", description: "Comprehensive patient database and tracking" },
  { icon: MessageCircle, title: "AI Conversations", description: "Natural language processing for medical queries" },
  { icon: Shield, title: "HIPAA Compliant", description: "Enterprise-grade security and privacy" },
  { icon: Phone, title: "24/7 Support", description: "Round-the-clock technical assistance" },
  { icon: BarChart3, title: "Analytics", description: "Detailed insights and performance metrics" },
  { icon: Calendar, title: "Smart Scheduling", description: "AI-powered appointment optimization" }
];

export default function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isYearly, setIsYearly] = useState(false);

  // Calculate price based on billing period
  const getPrice = (price: number) => {
    if (isYearly) {
      return Math.round(price * 12 * 0.8); // 20% discount for yearly
    }
    return price;
  };

  const getOriginalPrice = (originalPrice: number) => {
    if (isYearly) {
      return originalPrice * 12;
    }
    return originalPrice;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              🚀 Limited Time Offer - Save up to 25%
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-6">
              Revolutionize Your Healthcare
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Transform patient experience with AI-powered avatars, intelligent chatbots, and comprehensive healthcare management tools
            </p>
            <div className="flex justify-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-1" />
                No setup fees
              </span>
              <span className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-1" />
                30-day free trial
              </span>
              <span className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-1" />
                Cancel anytime
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center mb-12">
          <div className="flex items-center space-x-4 bg-white rounded-full p-2 shadow-lg border">
            <Label 
              htmlFor="billing-toggle" 
              className={`px-4 py-2 rounded-full font-medium transition-all cursor-pointer ${
                !isYearly ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-blue-600"
            />
            <Label 
              htmlFor="billing-toggle" 
              className={`px-4 py-2 rounded-full font-medium transition-all cursor-pointer ${
                isYearly ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Yearly
              <Badge className="ml-2 bg-green-500 text-white text-xs">
                Save 20%
              </Badge>
            </Label>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid md:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => {
            const IconComponent = plan.icon;
            return (
              <Card 
                key={plan.id}
                className={`relative overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-2xl cursor-pointer border-2 flex flex-col h-full ${
                  plan.isPopular 
                    ? 'border-purple-500 shadow-purple-200 shadow-lg' 
                    : selectedPlan === plan.id 
                      ? 'border-blue-500 shadow-blue-200 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{
                  animationDelay: `${index * 0.2}s`,
                  animation: 'fadeInUp 0.8s ease-out forwards'
                }}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.isPopular && (
                  <div className="absolute -top-0 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center text-white`}>
                    <IconComponent className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-gray-600 mt-2">
                    {plan.description}
                  </CardDescription>
                  
                  <div className="mt-6">
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-4xl font-bold text-gray-900">
                        ${getPrice(plan.price).toLocaleString()}
                      </span>
                      <span className="text-lg text-gray-500 line-through">
                        ${getOriginalPrice(plan.originalPrice).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">per {isYearly ? 'year' : 'month'}</div>
                    <Badge variant="secondary" className="mt-2 bg-green-100 text-green-800">
                      {isYearly ? 'Save 20%' : plan.discount}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-3">What's included:</h4>
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start text-sm">
                          <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {plan.limitations.length > 0 && (
                    <div className="mt-auto">
                      <h4 className="font-semibold text-gray-700 mb-2 text-sm">Limitations:</h4>
                      <ul className="space-y-1">
                        {plan.limitations.map((limitation, idx) => (
                          <li key={idx} className="flex items-start text-xs text-gray-500">
                            <span className="mr-2">•</span>
                            <span>{limitation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="mt-auto pt-6">
                  <Link href={`/signup?plan=${plan.id}`} className="w-full">
                    <Button 
                      className={`w-full h-12 font-semibold transition-all duration-300 text-white ${
                        plan.isPopular
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg'
                          : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                      }`}
                    >
                      Start Free Trial
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Additional Features Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need for Modern Healthcare
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our comprehensive platform includes all the tools you need to provide exceptional patient care
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-8">
            {additionalFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div 
                  key={index}
                  className="text-center group hover:scale-105 transition-transform duration-300"
                  style={{
                    animationDelay: `${index * 0.1}s`,
                    animation: 'fadeInUp 0.6s ease-out forwards'
                  }}
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white group-hover:shadow-lg transition-shadow">
                    <IconComponent className="h-8 w-8" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-900 via-purple-900 to-pink-900 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Practice?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of healthcare providers already using MedCor AI
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50 hover:text-blue-900 font-semibold px-8 border-0">
                Start Your Free Trial
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-blue-900 font-semibold px-8">
              Schedule Demo
            </Button>
          </div>
          <p className="text-sm text-blue-200 mt-4">
            No credit card required • Setup in minutes • Cancel anytime
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
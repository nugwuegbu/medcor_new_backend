import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FaqSection() {
  const faqs = [
    {
      question: "How do I book an appointment?",
      answer: "You can book an appointment online through our website by selecting a doctor, choosing an available time slot, and filling out the required information. You can also call our office directly."
    },
    {
      question: "What should I bring to my appointment?",
      answer: "Please bring a valid ID, your insurance card, a list of current medications, and any relevant medical records or test results. Arrive 15 minutes early for check-in."
    },
    {
      question: "How can the AI assistant help me?",
      answer: "Our AI assistant can help answer general health questions, provide information about symptoms, guide you through the appointment booking process, and connect you with the right healthcare professionals."
    },
    {
      question: "What insurance plans do you accept?",
      answer: "We accept most major insurance plans including Medicare, Medicaid, and private insurance. Please contact our office to verify your specific coverage before your appointment."
    },
    {
      question: "Can I cancel or reschedule my appointment?",
      answer: "Yes, you can cancel or reschedule your appointment up to 24 hours in advance. Please call our office or use our online portal to make changes to your appointment."
    },
    {
      question: "Is the AI assistant available 24/7?",
      answer: "Yes, our AI assistant is available 24/7 to help answer your questions and provide guidance. For urgent medical concerns, please call 911 or visit the nearest emergency room."
    },
    {
      question: "How long will my appointment take?",
      answer: "Appointment times vary depending on the type of visit. Initial consultations typically take 45-60 minutes, while follow-up visits usually take 15-30 minutes. We'll provide an estimated duration when you book."
    },
    {
      question: "Do you offer telemedicine appointments?",
      answer: "Yes, we offer telemedicine appointments for certain types of consultations. This option will be available when booking if your condition is suitable for a virtual visit."
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-4">Frequently Asked Questions</h3>
          <p className="text-lg text-muted-foreground">
            Find answers to common questions about our services
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Common Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

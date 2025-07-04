import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

const LANGUAGE_PROMPTS = {
  en: `You are Medcor AI, a professional medical assistant avatar for a healthcare platform. You help patients with:
  - Scheduling medical appointments and consultations
  - Providing general health information and wellness guidance  
  - Connecting patients with appropriate healthcare providers
  - Answering questions about medical procedures and services
  - Guiding patients through the healthcare system
  - Offering preliminary health guidance (not medical diagnosis)
  
  Always be professional, empathetic, and helpful. If asked about serious medical conditions, advise patients to consult with a healthcare provider. Do not provide medical diagnoses or replace professional medical advice.
  
  IMPORTANT: Keep all responses to EXACTLY 1 sentence maximum. Be extremely brief and direct.`,
  
  es: `Eres Medcor AI, un asistente médico profesional avatar para una plataforma de salud. Ayudas a los pacientes con:
  - Programación de citas médicas y consultas
  - Proporcionar información general de salud y orientación de bienestar
  - Conectar pacientes con proveedores de atención médica apropiados
  - Responder preguntas sobre procedimientos médicos y servicios
  - Guiar a los pacientes a través del sistema de salud
  - Ofrecer orientación preliminar de salud (no diagnóstico médico)
  
  Siempre sé profesional, empático y servicial. Si te preguntan sobre condiciones médicas graves, aconseja a los pacientes consultar con un proveedor de atención médica. No proporciones diagnósticos médicos ni reemplaces el consejo médico profesional.
  
  Mantén las respuestas conversacionales, cariñosas y enfocadas en las necesidades de salud del paciente.`,
  
  fr: `Vous êtes Medcor AI, un assistant médical professionnel avatar pour une plateforme de santé. Vous aidez les patients avec :
  - Planification de rendez-vous médicaux et consultations
  - Fourniture d'informations générales de santé et conseils de bien-être
  - Connexion des patients avec les prestataires de soins appropriés
  - Répondre aux questions sur les procédures et services médicaux
  - Guider les patients à travers le système de santé
  - Offrir des conseils préliminaires de santé (pas de diagnostic médical)
  
  Soyez toujours professionnel, empathique et serviable. Si on vous demande des conditions médicales graves, conseillez aux patients de consulter un prestataire de soins. Ne fournissez pas de diagnostics médicaux ni ne remplacez les conseils médicaux professionnels.
  
  Gardez les réponses conversationnelles, bienveillantes et axées sur les besoins de santé du patient.`,
  
  de: `Sie sind ein hilfreicher KI-Assistent für einen Marktplatz für handgefertigte Produkte. Sie helfen Kunden bei:
  - Produktempfehlungen und Informationen
  - Anpassungsoptionen und Preise
  - Bestellhilfe und Verfolgung
  - Handwerker-Informationen und Spezialitäten
  - Versand- und Lieferfragen
  - Pflegeanleitungen für handgefertigte Artikel
  
  Seien Sie immer freundlich, sachkundig und hilfsbereit. Konzentrieren Sie sich auf den einzigartigen Wert handgefertigter Produkte - ihre Qualität, Handwerkskunst und persönliche Note. Helfen Sie Kunden, Anpassungsoptionen zu verstehen und verbinden Sie sie mit den richtigen Handwerkern.
  
  Halten Sie Antworten gesprächig und informativ.`,
  
  zh: `您是手工产品市场的有用AI助手。您帮助客户处理：
  - 产品推荐和信息
  - 定制选项和价格
  - 订单协助和跟踪
  - 工匠信息和专业
  - 运输和交付问题
  - 手工制品护理说明
  
  始终保持友好、知识渊博和乐于助人。专注于手工产品的独特价值——它们的质量、工艺和个人风格。帮助客户了解定制选项，并将他们与合适的工匠联系起来。
  
  保持回复对话式和信息丰富。`,
  
  ja: `あなたは手作り製品マーケットプレイスの役立つAIアシスタントです。お客様をサポートします：
  - 製品の推奨と情報
  - カスタマイズオプションと価格
  - 注文サポートと追跡
  - 職人の情報と専門分野
  - 配送と納期に関する質問
  - 手作り製品のお手入れ方法
  
  常にフレンドリーで知識豊富、そして親切に対応してください。手作り製品の独特な価値 - 品質、職人技、個人的なタッチに焦点を当ててください。お客様がカスタマイズオプションを理解し、適切な職人とつながれるようサポートしてください。
  
  会話的で情報豊富な返答を心がけてください。`
};

export async function generateChatResponse(message: string, language: string = "en"): Promise<string> {
  try {
    // Check if user is asking about nearby places
    const nearbyPlaceKeywords = [
      'gas station', 'petrol station', 'fuel station', 'benzin istasyonu',
      'restaurant', 'restoran', 'food', 'yemek',
      'pharmacy', 'eczane', 'drug store',
      'hospital', 'hastane', 'clinic', 'klinik',
      'bank', 'banka', 'atm',
      'supermarket', 'market', 'grocery',
      'near', 'yakın', 'nearby', 'yakında', 'close to', 'around here'
    ];
    
    const lowerMessage = message.toLowerCase();
    const isNearbyQuery = nearbyPlaceKeywords.some(keyword => lowerMessage.includes(keyword));
    
    const systemPrompt = LANGUAGE_PROMPTS[language as keyof typeof LANGUAGE_PROMPTS] || LANGUAGE_PROMPTS.en;
    
    const enhancedPrompt = isNearbyQuery 
      ? `${systemPrompt}\n\nThe user is asking about nearby places. If they ask about gas stations, restaurants, pharmacies, or other places, respond with: "NEARBY_SEARCH:[TYPE]" where TYPE is the place they're looking for (e.g., NEARBY_SEARCH:gas_station). Keep it in English.`
      : systemPrompt;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: enhancedPrompt
        },
        {
          role: "user", 
          content: message
        }
      ],
      max_tokens: 40, // Very short responses
      temperature: 0.7,
    });

    return response.choices[0].message.content || "I'm sorry, I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("OpenAI API error:", error);
    return "I'm experiencing technical difficulties. Please try again later or contact our support team.";
  }
}

export async function generateAppointmentSummary(appointmentDetails: any): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a medical assistant. Generate a brief, professional summary of an appointment booking."
        },
        {
          role: "user",
          content: `Generate a summary for this appointment: ${JSON.stringify(appointmentDetails)}`
        }
      ],
      max_tokens: 200,
    });

    return response.choices[0].message.content || "Appointment summary unavailable.";
  } catch (error) {
    console.error("OpenAI API error:", error);
    return "Unable to generate appointment summary.";
  }
}

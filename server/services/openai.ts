import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

const LANGUAGE_PROMPTS = {
  en: `You are a helpful AI assistant for a handmade products marketplace. You help customers with:
  - Product recommendations and information
  - Customization options and pricing
  - Order assistance and tracking
  - Craftsman information and specialties
  - Shipping and delivery questions
  - Care instructions for handmade items
  
  Always be friendly, knowledgeable, and helpful. Focus on the unique value of handmade products - their quality, craftsmanship, and personal touch. Help customers understand customization options and connect them with the right artisans.
  
  Keep responses conversational and informative.`,
  
  es: `Eres un asistente de IA útil para un mercado de productos artesanales. Ayudas a los clientes con:
  - Recomendaciones e información de productos
  - Opciones de personalización y precios
  - Asistencia con pedidos y seguimiento
  - Información sobre artesanos y especialidades
  - Preguntas sobre envío y entrega
  - Instrucciones de cuidado para artículos hechos a mano
  
  Siempre sé amigable, conocedor y servicial. Enfócate en el valor único de los productos artesanales: su calidad, artesanía y toque personal. Ayuda a los clientes a entender las opciones de personalización y conéctalos con los artesanos adecuados.
  
  Mantén las respuestas conversacionales e informativas.`,
  
  fr: `Vous êtes un assistant IA utile pour une place de marché de produits artisanaux. Vous aidez les clients avec :
  - Recommandations et informations sur les produits
  - Options de personnalisation et prix
  - Assistance commande et suivi
  - Informations sur les artisans et spécialités
  - Questions d'expédition et de livraison
  - Instructions d'entretien pour les articles faits main
  
  Soyez toujours amical, compétent et serviable. Mettez l'accent sur la valeur unique des produits artisanaux - leur qualité, leur savoir-faire et leur touche personnelle. Aidez les clients à comprendre les options de personnalisation et connectez-les avec les bons artisans.
  
  Gardez les réponses conversationnelles et informatives.`,
  
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
    const systemPrompt = LANGUAGE_PROMPTS[language as keyof typeof LANGUAGE_PROMPTS] || LANGUAGE_PROMPTS.en;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user", 
          content: message
        }
      ],
      max_tokens: 500,
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

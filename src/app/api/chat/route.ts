import { NextRequest, NextResponse } from "next/server";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface GroqResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

// ─── MunchBite System Prompt ──────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Bukitla, the adorable and cheerful AI assistant for MunchBite — a homemade treats bakery that specializes in cookies, brownies, cupcakes, and other sweet goodies.

Your personality:
- Warm, friendly, and enthusiastic about food 🍪
- Helpful and knowledgeable about MunchBite's offerings
- Use occasional food-related emojis to stay on brand
- Keep responses concise and conversational

What you help with:
- Information about MunchBite's products (cookies, brownies, cupcakes, cakes, etc.)
- Ordering process and how to place orders
- Delivery, pickup, and availability questions
- Pricing (let them know to visit the order page or message us for custom quotes)
- Ingredients, allergens, and customization options
- General baking and treat questions
- General knowledge and everyday questions — answer helpfully and briefly

MunchBite details:
- Homemade, made-fresh treats
- Orders can be placed via the website's Order page
- Custom orders welcome — ask for details via the contact section
- Products include: cookies, brownies, cupcakes, cakes, pastries, and seasonal specials

If you don't know something specific (like exact pricing or current stock), kindly direct them to the Order page or suggest they message us directly.

Always end with a friendly touch and keep the MunchBite vibe — sweet, warm, and delightful! 🩷`;

// ─── POST Handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages: Message[] = body.messages;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages are required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Groq API key is not configured." },
        { status: 500 }
      );
    }

    // Build conversation with system prompt prepended
    const conversation: Message[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages,
    ];

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "qwen/qwen3.8-27b", // Qwen 3.8 27B — fast & reliable on this Groq account
        messages: conversation,
        max_tokens: 512,
        temperature: 0.7,
      }),
    });

    if (!groqRes.ok) {
      const errorData = await groqRes.text();
      console.error("Groq API error:", errorData);
      return NextResponse.json(
        { error: "Failed to get response from AI." },
        { status: 502 }
      );
    }

    const data: GroqResponse = await groqRes.json();
    const reply = data.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate a response. Please try again!";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

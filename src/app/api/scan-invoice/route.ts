import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Anthropic API key not configured" },
      { status: 500 }
    );
  }

  try {
    const { image, mimeType } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType || "image/jpeg",
                data: image,
              },
            },
            {
              type: "text",
              text: `You are reading a handwritten mechanic shop invoice/receipt. This is typically on a pre-printed form template with labeled fields.

Extract the following information and return it as a JSON object. Only return the JSON object, nothing else.

{
  "customerName": "the customer's full name",
  "customerPhone": "the customer's phone number",
  "carModel": "the car year, make, and model (e.g., 2020 Honda Civic)",
  "date": "the date in YYYY-MM-DD format",
  "lineItems": [
    { "description": "work item description", "price": 0.00 },
    { "description": "another work item", "price": 0.00 }
  ],
  "warranty": "warranty info if written, or null",
  "notes": "any notes or recommendations written, or null"
}

Rules:
- For prices, extract the numeric value only (no $ sign)
- If a field is not readable or not present, use an empty string "" for text fields or null
- For the date, if only month/day is written, assume the current year (2026)
- For line items, include ALL work items you can read, even if prices are hard to read
- Do your best to read the handwriting — it's okay to make reasonable guesses
- Return ONLY the JSON object, no markdown formatting, no backticks`,
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No text response from AI" },
        { status: 500 }
      );
    }

    // Parse the JSON from Claude's response
    const jsonText = textBlock.text.trim();
    const parsed = JSON.parse(jsonText);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Scan invoice error:", err);
    const message =
      err instanceof SyntaxError
        ? "AI could not read the invoice clearly. Try a clearer photo."
        : "Failed to process the image.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

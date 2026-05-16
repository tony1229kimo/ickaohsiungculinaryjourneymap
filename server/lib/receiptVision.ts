/**
 * Receipt OCR via OpenAI gpt-4o-mini vision.
 *
 * Used by /api/invoice/redeem-receipt for the 載具客 (carrier-bound invoice)
 * flow — those customers don't get a printed 電子發票證明聯, only the POS
 * "small white slip" with no QR / barcode. We let them photograph the slip
 * and extract { invoice_no, total, date, is_ic_kaohsiung } structured.
 *
 * Why gpt-4o-mini:
 *   - Cheapest vision-capable model that produces reliable structured JSON
 *   - $0.000165 per image at 1024px → ~NT$30/month at 5 restaurants × 200 c/day
 *   - response_format=json_object eliminates fragile string parsing
 *
 * Failure modes:
 *   - Blurry photo → confidence < 0.9, we reject "請重拍清楚一點"
 *   - Wrong receipt (Starbucks etc) → is_ic_kaohsiung=false, we reject
 *   - Malicious user crops out "INTERCONTINENTAL" header → vision marks
 *     is_ic_kaohsiung=false (header is the visual fingerprint we rely on)
 *
 * Cost guardrail: image must be < 1.5MB base64. Anything larger is rejected
 * before the API call to prevent runaway costs from spam.
 */

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MAX_IMAGE_BYTES_BASE64 = 1_500_000; // ~1.1MB raw image after base64
const MIN_CONFIDENCE = 0.85;

export interface ReceiptAnalysis {
  ok: boolean;
  reason?:
    | "image_too_large"
    | "vision_unavailable"
    | "vision_error"
    | "low_confidence"
    | "not_ic_kaohsiung"
    | "not_a_receipt";
  isIcKaohsiung?: boolean;
  looksLikeReceipt?: boolean;
  invoiceNo?: string | null;
  internalOrderNo?: string | null;
  totalAmount?: number | null;
  dateIso?: string | null;
  restaurantName?: string | null;
  confidence?: number;
  raw?: unknown; // for debug logging
}

interface VisionJsonOutput {
  is_ic_kaohsiung: boolean;
  looks_like_receipt: boolean;
  invoice_no: string | null;
  internal_order_no: string | null;
  total_amount: number | null;
  date_iso: string | null;
  restaurant_name: string | null;
  confidence: number;
}

const SYSTEM_PROMPT = `You are an OCR analyzer for InterContinental Kaohsiung restaurant receipts (高雄洲際酒店).

The hotel has 5 restaurants: Zhan Lu (湛露中餐廳), Seeds (大地全日餐廳), WA-RA (日式餐廳), HAWKER (南洋料理), BLT33 (大廳酒吧).

A genuine IC Kaohsiung receipt has these visual markers:
- "InterContinental" or "INTERCONTINENTAL" header with the IC logo (a stylized "I" in a diamond)
- "KAOHSIUNG" or "高雄洲際酒店" subtitle
- Restaurant name (one of the five above)
- 桌號 (table number), 日期 (date), 員工 (staff name), 單號# (order number), 發票號碼 (invoice number, e.g. "BM-36258862")
- 總計 (total amount), 服務費 (service charge), 小計 (subtotal)

Extract the data and return JSON ONLY with this exact schema (no markdown, no prose):
{
  "is_ic_kaohsiung": boolean,        // Does this clearly show IC Kaohsiung branding?
  "looks_like_receipt": boolean,     // Does it look like a restaurant receipt at all?
  "invoice_no": string | null,       // 發票號碼 field, e.g. "BM-36258862" — keep the dash
  "internal_order_no": string | null, // 單號# field, e.g. "360397"
  "total_amount": number | null,     // 總計 as integer, no commas. If you can only see subtotal, use null.
  "date_iso": string | null,         // 日期 in YYYY-MM-DD format
  "restaurant_name": string | null,  // e.g. "Zhan Lu"
  "confidence": number               // 0-1, how confident in the extraction
}

If the image is blurry, dark, cropped, or shows something else (not a receipt), set looks_like_receipt=false and confidence < 0.5. Be strict — false positives cost the hotel money.`;

export async function analyzeReceipt(imageBase64DataUrl: string): Promise<ReceiptAnalysis> {
  if (imageBase64DataUrl.length > MAX_IMAGE_BYTES_BASE64) {
    return { ok: false, reason: "image_too_large" };
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { ok: false, reason: "vision_unavailable" };
  }

  try {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        temperature: 0,
        max_tokens: 400,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this receipt photo:" },
              { type: "image_url", image_url: { url: imageBase64DataUrl, detail: "low" } },
            ],
          },
        ],
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error(`[receiptVision] OpenAI ${res.status}: ${errText.slice(0, 300)}`);
      return { ok: false, reason: "vision_error", raw: errText.slice(0, 300) };
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content ?? "{}";

    let parsed: VisionJsonOutput;
    try {
      parsed = JSON.parse(content);
    } catch (err) {
      console.error("[receiptVision] non-JSON response:", content);
      return { ok: false, reason: "vision_error", raw: content };
    }

    const result: ReceiptAnalysis = {
      ok: true,
      isIcKaohsiung: !!parsed.is_ic_kaohsiung,
      looksLikeReceipt: !!parsed.looks_like_receipt,
      invoiceNo: parsed.invoice_no,
      internalOrderNo: parsed.internal_order_no,
      totalAmount: parsed.total_amount,
      dateIso: parsed.date_iso,
      restaurantName: parsed.restaurant_name,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0,
      raw: parsed,
    };

    if (!result.looksLikeReceipt) {
      return { ...result, ok: false, reason: "not_a_receipt" };
    }
    if (!result.isIcKaohsiung) {
      return { ...result, ok: false, reason: "not_ic_kaohsiung" };
    }
    if ((result.confidence ?? 0) < MIN_CONFIDENCE) {
      return { ...result, ok: false, reason: "low_confidence" };
    }
    return result;
  } catch (err) {
    console.error("[receiptVision] uncaught:", err);
    return { ok: false, reason: "vision_error" };
  }
}

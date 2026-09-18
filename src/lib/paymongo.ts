// PayMongo API Client Helper

export interface PayMongoLineItem {
  name: string;
  amount: number; // in centavos (e.g. 100 PHP = 10000 centavos)
  currency: string;
  quantity: number;
  description?: string;
  images?: string[];
}

export interface PayMongoBilling {
  name: string;
  email?: string;
  phone: string;
  address?: {
    line1?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
}

export interface CreateCheckoutSessionParams {
  orderId: string;
  lineItems: PayMongoLineItem[];
  billing: PayMongoBilling;
  successUrl: string;
  cancelUrl: string;
  description?: string;
}

export interface CheckoutSessionResponse {
  data: {
    id: string;
    type: string;
    attributes: {
      checkout_url: string;
      payment_method_types: string[];
      payments: Array<{
        id: string;
        type: string;
        attributes: {
          amount: number;
          status: string;
          payment_method_type: string;
        };
      }>;
      status: string;
      client_key: string;
    };
  };
}

const PAYMONGO_API_URL = "https://api.paymongo.com/v1";

export async function createPayMongoCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<CheckoutSessionResponse> {
  const secretKey = process.env.PAYMONGO_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      "PAYMONGO_SECRET_KEY is not configured in environment variables."
    );
  }

  const authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;

  const payload = {
    data: {
      attributes: {
        billing: {
          name: params.billing.name,
          email: params.billing.email || undefined,
          phone: params.billing.phone,
          address: params.billing.address?.line1
            ? {
                line1: params.billing.address.line1,
                country: "PH",
              }
            : undefined,
        },
        line_items: params.lineItems,
        payment_method_types: [
          "gcash",
          "paymaya",
          "card",
          "grab_pay",
          "dob",
          "billease",
        ],
        send_email_receipt: true,
        show_description: true,
        show_line_items: true,
        description:
          params.description || `MunchBite Order #${params.orderId.slice(0, 8).toUpperCase()}`,
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: {
          order_id: params.orderId,
        },
      },
    },
  };

  const response = await fetch(`${PAYMONGO_API_URL}/checkout_sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg =
      data.errors?.[0]?.detail ||
      data.errors?.[0]?.code ||
      "Failed to create PayMongo checkout session.";
    throw new Error(errorMsg);
  }

  return data as CheckoutSessionResponse;
}

export async function retrievePayMongoCheckoutSession(
  sessionId: string
): Promise<CheckoutSessionResponse> {
  const secretKey = process.env.PAYMONGO_SECRET_KEY;

  if (!secretKey) {
    throw new Error("PAYMONGO_SECRET_KEY is not configured.");
  }

  const authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;

  const response = await fetch(
    `${PAYMONGO_API_URL}/checkout_sessions/${sessionId}`,
    {
      method: "GET",
      headers: {
        Authorization: authHeader,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error("Failed to retrieve PayMongo checkout session.");
  }

  return data as CheckoutSessionResponse;
}

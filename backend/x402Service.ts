/**
 * x402 Payment Service for Flash.Mob
 *
 * Implements x402 protocol flow for HTTP-native payments:
 * 1. Client requests resource
 * 2. Server returns 402 with payment details
 * 3. Client signs payment payload
 * 4. Server verifies and settles
 *
 * @see https://docs.cdp.coinbase.com/x402/welcome
 */

import { ethers } from "ethers";

// x402 Payment Request (sent in 402 response headers)
export interface X402PaymentRequest {
  // CAIP-2 network identifier (e.g., "eip155:10143" for Monad)
  network: string;
  // Payment amount in smallest unit
  amount: string;
  // Token contract address (e.g., AP Token)
  asset: string;
  // Recipient address (backend wallet)
  recipient: string;
  // Unique request ID
  requestId: string;
  // Valid until timestamp
  validUntil: number;
  // Resource being requested
  resource: string;
}

// x402 Payment Response (sent by client in headers)
export interface X402PaymentResponse {
  // EIP-712 signature authorizing payment
  signature: string;
  // Sender address
  sender: string;
  // Original request ID
  requestId: string;
  // Timestamp of signature
  timestamp: number;
}

// x402 Verification Result
export interface X402VerificationResult {
  valid: boolean;
  sender?: string;
  amount?: string;
  error?: string;
}

// EIP-712 Domain for x402 payments
const X402_DOMAIN = {
  name: "FlashMob-x402",
  version: "1",
  chainId: parseInt(process.env.EXPO_PUBLIC_CHAIN_ID || "10143"),
  verifyingContract: process.env.EXPO_PUBLIC_AP_TOKEN_ADDRESS || "",
};

// EIP-712 Types for x402 payment
const X402_TYPES = {
  Payment: [
    { name: "requestId", type: "bytes32" },
    { name: "sender", type: "address" },
    { name: "recipient", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "validUntil", type: "uint256" },
  ],
};

/**
 * Create x402 payment request for 402 response
 */
export function createPaymentRequest(
  amount: string,
  recipient: string,
  resource: string,
  validitySeconds: number = 300,
): X402PaymentRequest {
  const requestId = ethers.id(`${Date.now()}-${Math.random()}`);

  return {
    network: `eip155:${process.env.EXPO_PUBLIC_CHAIN_ID || "10143"}`,
    amount,
    asset: process.env.EXPO_PUBLIC_AP_TOKEN_ADDRESS || "",
    recipient,
    requestId,
    validUntil: Math.floor(Date.now() / 1000) + validitySeconds,
    resource,
  };
}

/**
 * Verify x402 payment signature
 */
export async function verifyPayment(
  request: X402PaymentRequest,
  response: X402PaymentResponse,
): Promise<X402VerificationResult> {
  try {
    // Check request ID matches
    if (request.requestId !== response.requestId) {
      return { valid: false, error: "Request ID mismatch" };
    }

    // Check validity
    if (Math.floor(Date.now() / 1000) > request.validUntil) {
      return { valid: false, error: "Payment expired" };
    }

    // Reconstruct the message that was signed
    const requestIdBytes32 = ethers.id(request.requestId);

    const message = {
      requestId: requestIdBytes32,
      sender: response.sender,
      recipient: request.recipient,
      amount: ethers.parseEther(request.amount),
      validUntil: BigInt(request.validUntil),
    };

    // Verify EIP-712 signature
    const recoveredAddress = ethers.verifyTypedData(
      X402_DOMAIN,
      X402_TYPES,
      message,
      response.signature,
    );

    if (recoveredAddress.toLowerCase() !== response.sender.toLowerCase()) {
      return { valid: false, error: "Invalid signature" };
    }

    return {
      valid: true,
      sender: response.sender,
      amount: request.amount,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Verification failed",
    };
  }
}

/**
 * Format payment request as HTTP headers (402 response)
 */
export function formatPaymentRequiredHeaders(
  request: X402PaymentRequest,
): Record<string, string> {
  return {
    "X-Payment-Required": "true",
    "X-Payment-Network": request.network,
    "X-Payment-Amount": request.amount,
    "X-Payment-Asset": request.asset,
    "X-Payment-Recipient": request.recipient,
    "X-Payment-Request-Id": request.requestId,
    "X-Payment-Valid-Until": request.validUntil.toString(),
    "X-Payment-Resource": request.resource,
  };
}

/**
 * Parse payment response from HTTP headers
 */
export function parsePaymentHeaders(
  headers: Record<string, string>,
): X402PaymentResponse | null {
  const signature = headers["x-payment-signature"];
  const sender = headers["x-payment-sender"];
  const requestId = headers["x-payment-request-id"];
  const timestamp = headers["x-payment-timestamp"];

  if (!signature || !sender || !requestId) {
    return null;
  }

  return {
    signature,
    sender,
    requestId,
    timestamp: parseInt(timestamp) || Date.now(),
  };
}

/**
 * Express middleware for x402 payment verification
 */
export function x402Middleware(
  requiredAmount: string,
  recipient: string,
  resource: string,
) {
  return async (req: any, res: any, next: any) => {
    // Check for payment header
    const paymentSignature = req.headers["x-payment-signature"];

    if (!paymentSignature) {
      // Return 402 Payment Required
      const paymentRequest = createPaymentRequest(
        requiredAmount,
        recipient,
        resource,
      );

      // Store request for verification
      (req as any).x402Request = paymentRequest;

      res.status(402);
      res.set(formatPaymentRequiredHeaders(paymentRequest));
      return res.json({
        error: "Payment Required",
        message: `This endpoint requires ${requiredAmount} AP tokens`,
        paymentDetails: paymentRequest,
      });
    }

    // Parse payment response
    const paymentResponse = parsePaymentHeaders(req.headers);

    if (!paymentResponse) {
      return res.status(400).json({ error: "Invalid payment headers" });
    }

    // Get stored request (in production, use Redis/DB)
    const storedRequest =
      (req as any).x402Request ||
      createPaymentRequest(requiredAmount, recipient, resource);
    storedRequest.requestId = paymentResponse.requestId;

    // Verify payment
    const verification = await verifyPayment(storedRequest, paymentResponse);

    if (!verification.valid) {
      return res.status(402).json({
        error: "Payment verification failed",
        details: verification.error,
      });
    }

    // Attach verified payment to request
    (req as any).x402Payment = {
      sender: verification.sender,
      amount: verification.amount,
      verified: true,
    };

    next();
  };
}

export default {
  createPaymentRequest,
  verifyPayment,
  formatPaymentRequiredHeaders,
  parsePaymentHeaders,
  x402Middleware,
};

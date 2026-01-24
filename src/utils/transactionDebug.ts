/**
 * @file transactionDebug.ts
 * @description Utility functions for debugging blockchain transactions
 */

/**
 * Decode transaction data to see what's being sent
 */
export function decodeTransactionData(data: string) {
  try {
    console.log("🔍 Decoding transaction data...");
    console.log(`   📦 Raw data: ${data}`);
    console.log(`   📦 Length: ${data.length} characters`);

    // Function selector (first 4 bytes / 10 chars including 0x)
    const selector = data.slice(0, 10);
    console.log(`   🎯 Function selector: ${selector}`);

    // Known function selectors
    const selectors: { [key: string]: string } = {
      "0xa94c1106": "purchaseAP(uint256)",
      "0x095ea7b3": "approve(address,uint256)",
      "0x2e7ba6ef": "claimInitialAirdrop()",
    };

    if (selectors[selector]) {
      console.log(`   ✅ Recognized function: ${selectors[selector]}`);
    }

    // Decode parameters
    if (selector === "0xa94c1106") {
      // purchaseAP(uint256 monAmount)
      const amountHex = data.slice(10);
      const amountWei = BigInt("0x" + amountHex);
      const amountMON = Number(amountWei) / 1e18;

      console.log(`   📊 Parameter breakdown:`);
      console.log(`      - Raw hex: ${amountHex}`);
      console.log(`      - Wei: ${amountWei.toString()}`);
      console.log(`      - MON: ${amountMON}`);
      console.log(`      - Is multiple of 100? ${amountMON % 100 === 0}`);
      console.log(`      - Expected AP: ${(amountMON / 100) * 1000}`);

      return {
        function: "purchaseAP" as const,
        parameters: {
          monAmount: amountWei,
          monAmountFormatted: amountMON,
          isValidAmount: amountMON >= 100 && amountMON % 100 === 0,
          expectedAP: (amountMON / 100) * 1000,
        },
      };
    }

    if (selector === "0x095ea7b3") {
      // approve(address spender, uint256 amount)
      const spender = "0x" + data.slice(10, 74);
      const amountHex = data.slice(74);
      const amountWei = BigInt("0x" + amountHex);
      const amountMON = Number(amountWei) / 1e18;

      console.log(`   📊 Parameter breakdown:`);
      console.log(`      - Spender: ${spender}`);
      console.log(`      - Amount (wei): ${amountWei.toString()}`);
      console.log(`      - Amount (MON): ${amountMON}`);

      return {
        function: "approve" as const,
        parameters: {
          spender,
          amount: amountWei,
          amountFormatted: amountMON,
        },
      };
    }

    return { function: "unknown" as const, selector, data };
  } catch (error) {
    console.error("❌ Failed to decode transaction data:", error);
    return null;
  }
}

/**
 * Log complete transaction details for debugging
 */
export function logTransactionDetails(
  txType: string,
  to: string,
  data: string,
  from?: string,
) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`📋 TRANSACTION DEBUG: ${txType}`);
  console.log(`${"=".repeat(60)}`);

  if (from) {
    console.log(`   👤 From: ${from}`);
  }
  console.log(`   📍 To: ${to}`);
  console.log(`   📦 Data: ${data}`);

  const decoded = decodeTransactionData(data);

  if (decoded && decoded.function === "purchaseAP" && decoded.parameters) {
    console.log(`\n   🎯 PURCHASE VALIDATION:`);
    console.log(`      ✓ Function: purchaseAP`);
    console.log(`      ✓ MON Amount: ${decoded.parameters.monAmountFormatted}`);
    console.log(
      `      ✓ Valid Amount: ${decoded.parameters.isValidAmount ? "YES" : "NO"}`,
    );
    console.log(`      ✓ Expected AP: ${decoded.parameters.expectedAP}`);

    if (!decoded.parameters.isValidAmount) {
      console.log(
        `\n   ⚠️  WARNING: Amount ${decoded.parameters.monAmountFormatted} MON is INVALID!`,
      );
      console.log(`      - Must be >= 100 MON`);
      console.log(`      - Must be multiple of 100`);
      console.log(`      - This transaction will likely revert!`);
    }
  }

  console.log(`${"=".repeat(60)}\n`);

  return decoded;
}

/**
 * Validate purchase amount before sending transaction
 */
export function validatePurchaseAmount(monAmount: number): {
  isValid: boolean;
  error?: string;
  expectedAP?: number;
} {
  if (monAmount < 100) {
    return {
      isValid: false,
      error: "Amount must be at least 100 MON (contract requirement)",
    };
  }

  if (monAmount % 100 !== 0) {
    return {
      isValid: false,
      error: `Amount must be a multiple of 100 MON. Try: ${Math.floor(monAmount / 100) * 100} or ${Math.ceil(monAmount / 100) * 100}`,
    };
  }

  const expectedAP = (monAmount / 100) * 1000;

  return {
    isValid: true,
    expectedAP,
  };
}

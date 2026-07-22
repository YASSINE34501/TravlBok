import { randomUUID } from "node:crypto";
import type { PaymentProvider, PaymentIntentInput, PaymentIntentResult, RefundResult } from "./types";

/**
 * Bank transfer, manual, and cash-at-property are fully live immediately —
 * no external dependency. Each creates a PENDING payment with instructions;
 * staff confirm it later via the payments dashboard (bank transfer/manual)
 * or the PMS check-out workflow (cash at property).
 */
function makeInstructionProvider(
  code: "BANK_TRANSFER" | "MANUAL" | "CASH_AT_PROPERTY"
): PaymentProvider {
  return {
    code,
    isLive: true,
    async createPaymentIntent(input: PaymentIntentInput): Promise<PaymentIntentResult> {
      return {
        providerReference: `${code.toLowerCase()}_${randomUUID()}`,
        status: "PENDING",
        raw: { instructions: input.description },
      };
    },
    async refund(): Promise<RefundResult> {
      return {
        providerRefundReference: `${code.toLowerCase()}_refund_${randomUUID()}`,
        status: "COMPLETED",
      };
    },
  };
}

export const bankTransferProvider = makeInstructionProvider("BANK_TRANSFER");
export const manualProvider = makeInstructionProvider("MANUAL");
export const cashAtPropertyProvider = makeInstructionProvider("CASH_AT_PROPERTY");

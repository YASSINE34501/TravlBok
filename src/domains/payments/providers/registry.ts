import type { PaymentProviderCode } from "@/generated/prisma/client";
import type { PaymentProvider } from "./types";
import { stripeProvider } from "./stripe";
import { paypalProvider } from "./paypal";
import { bankTransferProvider, manualProvider, cashAtPropertyProvider } from "./manual-providers";

const providers: Record<PaymentProviderCode, PaymentProvider> = {
  STRIPE: stripeProvider,
  PAYPAL: paypalProvider,
  BANK_TRANSFER: bankTransferProvider,
  MANUAL: manualProvider,
  CASH_AT_PROPERTY: cashAtPropertyProvider,
};

export function getProvider(code: PaymentProviderCode): PaymentProvider {
  return providers[code];
}

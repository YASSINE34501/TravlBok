import "server-only";

export function enumerateNights(checkIn: Date, checkOut: Date): Date[] {
  const nights: Date[] = [];
  const cursor = new Date(checkIn);
  while (cursor < checkOut) {
    nights.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return nights;
}

export function isWeekendNight(date: Date): boolean {
  const day = date.getDay();
  return day === 5 || day === 6; // Friday, Saturday
}

type SeasonalPrice = {
  startDate: Date;
  endDate: Date;
  price: number;
  weekendPrice: number | null;
};

type AvailabilityOverride = {
  date: Date;
  priceOverride: number | null;
  closedForBooking: boolean;
};

export function resolveNightlyPrice(
  date: Date,
  basePrice: number,
  weekendPrice: number | null,
  seasonalPrices: SeasonalPrice[],
  overrides: AvailabilityOverride[]
): number {
  const override = overrides.find((o) => isSameDay(o.date, date));
  if (override?.priceOverride != null) {
    return override.priceOverride;
  }

  const season = seasonalPrices.find((s) => date >= s.startDate && date < s.endDate);
  if (season) {
    return isWeekendNight(date) && season.weekendPrice != null
      ? season.weekendPrice
      : season.price;
  }

  return isWeekendNight(date) && weekendPrice != null ? weekendPrice : basePrice;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function calculateHotelPriceBreakdown(params: {
  checkIn: Date;
  checkOut: Date;
  quantity: number;
  basePrice: number;
  weekendPrice: number | null;
  taxRatePercent: number;
  cleaningFee: number;
  seasonalPrices: SeasonalPrice[];
  overrides: AvailabilityOverride[];
  commissionRate: number;
  discountAmount: number;
}) {
  const nights = enumerateNights(params.checkIn, params.checkOut);
  const nightlySubtotal = nights.reduce(
    (sum, night) =>
      sum +
      resolveNightlyPrice(
        night,
        params.basePrice,
        params.weekendPrice,
        params.seasonalPrices,
        params.overrides
      ),
    0
  );

  const basePriceAmount = round2(nightlySubtotal * params.quantity);
  const feeAmount = round2(params.cleaningFee * params.quantity);
  const taxAmount = round2((basePriceAmount + feeAmount) * (params.taxRatePercent / 100));
  const discountAmount = round2(Math.min(params.discountAmount, basePriceAmount + feeAmount + taxAmount));
  const totalAmount = round2(basePriceAmount + taxAmount + feeAmount - discountAmount);
  const commissionAmount = round2(totalAmount * params.commissionRate);

  return {
    nights: nights.length,
    basePriceAmount,
    taxAmount,
    feeAmount,
    discountAmount,
    totalAmount,
    commissionAmount,
  };
}

export function calculateCarPriceBreakdown(params: {
  pickupAt: Date;
  returnAt: Date;
  pricePerDay: number;
  commissionRate: number;
  discountAmount: number;
}) {
  const days = Math.max(
    1,
    Math.ceil((params.returnAt.getTime() - params.pickupAt.getTime()) / (1000 * 60 * 60 * 24))
  );
  const basePriceAmount = round2(days * params.pricePerDay);
  const taxAmount = 0;
  const feeAmount = 0;
  const discountAmount = round2(Math.min(params.discountAmount, basePriceAmount));
  const totalAmount = round2(basePriceAmount - discountAmount);
  const commissionAmount = round2(totalAmount * params.commissionRate);

  return {
    days,
    basePriceAmount,
    taxAmount,
    feeAmount,
    discountAmount,
    totalAmount,
    commissionAmount,
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/db";
import { requireOrganizationAccess, ROLE_GROUPS } from "@/lib/rbac";
import { hasFeature } from "@/domains/subscriptions/limits";
import { toCsv } from "@/lib/export/csv";
import {
  getOccupancyReport,
  getArrivalsReport,
  getDeparturesReport,
  getNoShowsReport,
  getCancellationsReport,
  getRoomStatusReport,
} from "@/domains/pms/reports";

export const runtime = "nodejs";

type ReportRow = (string | number)[];

async function buildReport(type: string, hotelId: string, searchParams: URLSearchParams) {
  const start = searchParams.get("start")
    ? new Date(searchParams.get("start")!)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = searchParams.get("end") ? new Date(searchParams.get("end")!) : new Date();

  switch (type) {
    case "occupancy": {
      const rows = await getOccupancyReport(hotelId, start, end);
      return {
        header: ["Date", "Rooms sold", "Revenue", "Occupancy %", "ADR", "RevPAR"],
        rows: rows.map(
          (r): ReportRow => [
            r.day,
            r.roomsSold,
            r.revenue.toFixed(2),
            r.occupancyPercent.toFixed(1),
            r.adr.toFixed(2),
            r.revpar.toFixed(2),
          ]
        ),
      };
    }
    case "arrivals": {
      const rows = await getArrivalsReport(hotelId, start);
      return {
        header: ["Reference", "Guest", "Room type", "Check-in", "Status"],
        rows: rows.map(
          (r): ReportRow => [
            r.bookingReference,
            `${r.guestFirstName} ${r.guestLastName}`,
            r.roomItems.map((i) => i.roomType.name).join(", "),
            r.checkInDate?.toISOString() ?? "",
            r.status,
          ]
        ),
      };
    }
    case "departures": {
      const rows = await getDeparturesReport(hotelId, start);
      return {
        header: ["Reference", "Guest", "Room type", "Check-out", "Status"],
        rows: rows.map(
          (r): ReportRow => [
            r.bookingReference,
            `${r.guestFirstName} ${r.guestLastName}`,
            r.roomItems.map((i) => i.roomType.name).join(", "),
            r.checkOutDate?.toISOString() ?? "",
            r.status,
          ]
        ),
      };
    }
    case "no-shows": {
      const rows = await getNoShowsReport(hotelId);
      return {
        header: ["Reference", "Guest", "Check-in", "Total"],
        rows: rows.map(
          (r): ReportRow => [
            r.bookingReference,
            `${r.guestFirstName} ${r.guestLastName}`,
            r.checkInDate?.toISOString() ?? "",
            r.totalAmount.toString(),
          ]
        ),
      };
    }
    case "cancellations": {
      const rows = await getCancellationsReport(hotelId);
      return {
        header: ["Reference", "Guest", "Status", "Cancelled at", "Reason"],
        rows: rows.map(
          (r): ReportRow => [
            r.bookingReference,
            `${r.guestFirstName} ${r.guestLastName}`,
            r.status,
            r.cancelledAt?.toISOString() ?? "",
            r.cancelledReason ?? "",
          ]
        ),
      };
    }
    case "room-status": {
      const rows = await getRoomStatusReport(hotelId);
      return {
        header: ["Unit", "Room type", "Status", "Active"],
        rows: rows.map(
          (r): ReportRow => [r.unitNumber, r.roomType.name, r.operationalStatus, r.isActive ? "Yes" : "No"]
        ),
      };
    }
    default:
      return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  const { searchParams } = new URL(request.url);
  const hotelId = searchParams.get("hotelId");
  const format = searchParams.get("format") === "excel" ? "excel" : "csv";
  const locale = searchParams.get("locale") ?? "en";

  if (!hotelId) {
    return NextResponse.json({ error: "hotelId is required" }, { status: 400 });
  }

  const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
  if (!hotel) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await requireOrganizationAccess(locale, hotel.organizationId, [
    ...ROLE_GROUPS.partnerOwners,
    ...ROLE_GROUPS.hotelStaff,
  ]);
  const pmsEnabled = await hasFeature(hotel.organizationId, "featurePms");
  if (!pmsEnabled) {
    return NextResponse.json({ error: "PMS is not enabled" }, { status: 403 });
  }

  const report = await buildReport(type, hotelId, searchParams);
  if (!report) {
    return NextResponse.json({ error: "Unknown report type" }, { status: 400 });
  }

  if (format === "csv") {
    const csv = toCsv(report.header, report.rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${type}.csv"`,
      },
    });
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(type);
  sheet.addRow(report.header);
  for (const row of report.rows) {
    sheet.addRow(row);
  }
  sheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(new Uint8Array(buffer as ArrayBuffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${type}.xlsx"`,
    },
  });
}

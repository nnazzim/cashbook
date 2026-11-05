import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "in_out"; // "in_out" or "amount_type"
    const fileType = searchParams.get("type") || "xlsx"; // "xlsx" or "csv"

    let data: any[] = [];
    if (format === "in_out") {
      data = [
        {
          Date: "2026-11-01",
          Time: "10:30",
          Remark: "Opening Cash in Hand",
          "Cash In": 10000,
          "Cash Out": "",
          Category: "Sales",
          "Payment Mode": "Cash",
          "Party Name": "Store Float",
          Balance: 10000,
        },
        {
          Date: "2026-11-01",
          Time: "12:15",
          Remark: "Wholesale Grocery Stock",
          "Cash In": "",
          "Cash Out": 3500,
          Category: "Inventory",
          "Payment Mode": "UPI",
          "Party Name": "Gupta Wholesalers",
          Balance: 6500,
        },
        {
          Date: "2026-11-01",
          Time: "16:45",
          Remark: "Afternoon Counter Sales",
          "Cash In": 5200,
          "Cash Out": "",
          Category: "Sales",
          "Payment Mode": "Cash",
          "Party Name": "Walk-in",
          Balance: 11700,
        },
        {
          Date: "2026-11-02",
          Time: "11:00",
          Remark: "Staff Lunch & Tea",
          "Cash In": "",
          "Cash Out": 240,
          Category: "Tea & Refreshments",
          "Payment Mode": "Cash",
          "Party Name": "Raju Tea Stall",
          Balance: 11460,
        },
      ];
    } else {
      data = [
        {
          Date: "01/11/2026",
          Time: "10:00",
          Description: "Counter Collections",
          Amount: 8500,
          Type: "IN",
          Category: "Sales",
          "Payment Mode": "UPI",
          Party: "Retail Customers",
        },
        {
          Date: "01/11/2026",
          Time: "14:30",
          Description: "Shop Rent Payment",
          Amount: 12000,
          Type: "OUT",
          Category: "Rent & Bills",
          "Payment Mode": "Bank Transfer",
          Party: "Landlord",
        },
        {
          Date: "02/11/2026",
          Time: "11:20",
          Description: "Customer Credit Settlement",
          Amount: 4200,
          Type: "IN",
          Category: "Customer Payment",
          "Payment Mode": "Cash",
          Party: "Ramesh Sharma",
        },
      ];
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

    if (fileType === "csv") {
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      return new Response(csv, {
        headers: {
          "Content-Disposition": 'attachment; filename="CashBook_Template.csv"',
          "Content-Type": "text/csv; charset=utf-8",
        },
      });
    }

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return new Response(buffer, {
      headers: {
        "Content-Disposition": 'attachment; filename="CashBook_Template.xlsx"',
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

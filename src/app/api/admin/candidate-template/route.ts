import { NextResponse } from "next/server";

export async function GET() {
  const csvContent = [
    "name,email,phone",
    "John Doe,john.doe@example.com,+1234567890",
    "Jane Smith,jane.smith@example.com,+1987654321",
    "Alex Johnson,alex.j@example.com,+1555123456",
  ].join("\n");

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="candidate_template.csv"',
    },
  });
}

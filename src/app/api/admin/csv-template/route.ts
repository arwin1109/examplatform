import { NextResponse } from "next/server";
import { stringify } from "csv-stringify/sync";

export async function GET() {
  const sampleRows = [
    {
      questionText: "Which HTML tag is used to create a hyperlink?",
      options: "<link> | <a> | <href> | <url>",
      correctAnswer: "<a>",
      category: "Frontend",
      topic: "HTML",
      difficulty: "easy",
      marks: "1",
      explanation: "The <a> tag (anchor element) defines a hyperlink using its href attribute.",
      isEnabled: "true",
    },
    {
      questionText: "Which SQL JOIN clause returns all rows from the left table and matched rows from the right table?",
      options: "INNER JOIN | LEFT JOIN | RIGHT JOIN | FULL OUTER JOIN",
      correctAnswer: "LEFT JOIN",
      category: "Database",
      topic: "SQL Joins",
      difficulty: "medium",
      marks: "2",
      explanation: "LEFT JOIN returns all records from the left table regardless of right table matches.",
      isEnabled: "true",
    },
    {
      questionText: "What is the worst-case time complexity of Binary Search on a sorted array of size N?",
      options: "O(1) | O(N) | O(log N) | O(N^2)",
      correctAnswer: "O(log N)",
      category: "Algorithms",
      topic: "Search Complexity",
      difficulty: "hard",
      marks: "3",
      explanation: "Binary search halves the dataset at each step resulting in logarithmic O(log N) complexity.",
      isEnabled: "true",
    },
  ];

  const csvContent = stringify(sampleRows, {
    header: true,
  });

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="questions-template.csv"',
    },
  });
}

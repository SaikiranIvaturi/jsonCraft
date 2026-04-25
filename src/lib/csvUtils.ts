function flatten(obj: Record<string, unknown>, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, val] of Object.entries(obj)) {
    const k = prefix ? `${prefix}.${key}` : key;
    if (val !== null && typeof val === "object" && !Array.isArray(val)) {
      Object.assign(result, flatten(val as Record<string, unknown>, k));
    } else {
      result[k] =
        val === null || val === undefined
          ? ""
          : Array.isArray(val)
            ? JSON.stringify(val)
            : String(val);
    }
  }
  return result;
}

function escape(s: string): string {
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function jsonToCsv(jsonStr: string): string {
  const data: unknown = JSON.parse(jsonStr);
  if (!Array.isArray(data)) throw new Error("Input must be a JSON array of objects");
  if (!data.length) return "";

  const rows = data.map((item) =>
    typeof item === "object" && item !== null && !Array.isArray(item)
      ? flatten(item as Record<string, unknown>)
      : { value: String(item) },
  );

  const headers = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const lines = [
    headers.map(escape).join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h] ?? "")).join(",")),
  ];
  return lines.join("\n");
}

function inferValue(s: string): unknown {
  if (s === "") return null;
  if (s === "true") return true;
  if (s === "false") return false;
  if (s === "null") return null;
  const n = Number(s);
  if (s.trim() !== "" && !isNaN(n)) return n;
  if ((s.startsWith("[") && s.endsWith("]")) || (s.startsWith("{") && s.endsWith("}"))) {
    try {
      return JSON.parse(s);
    } catch { /* not JSON */ }
  }
  return s;
}

function parseRow(line: string): string[] {
  const fields: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { fields.push(field); field = ""; }
      else field += ch;
    }
  }
  fields.push(field);
  return fields;
}

export function csvToJson(csvStr: string): string {
  const lines = csvStr.trim().split("\n").filter((l) => l.trim());
  if (!lines.length) return "[]";
  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const vals = parseRow(line);
    const obj: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      obj[h] = inferValue(vals[i] ?? "");
    });
    return obj;
  });
  return JSON.stringify(rows, null, 2);
}

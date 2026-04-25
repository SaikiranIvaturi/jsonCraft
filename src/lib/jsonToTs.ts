export function jsonToTypeScript(jsonStr: string): string {
  const parsed: unknown = JSON.parse(jsonStr);
  const defs = new Map<string, string>();
  const used = new Set<string>();

  function pascal(s: string): string {
    return s
      .replace(/[-_.\s]+(.)/g, (_, c: string) => c.toUpperCase())
      .replace(/^[a-z]/, (c) => c.toUpperCase()) || "Item";
  }

  function uniqueName(base: string): string {
    if (!used.has(base)) { used.add(base); return base; }
    let n = 2;
    while (used.has(`${base}${n}`)) n++;
    const name = `${base}${n}`;
    used.add(name);
    return name;
  }

  function isObj(v: unknown): v is Record<string, unknown> {
    return v !== null && typeof v === "object" && !Array.isArray(v);
  }

  function safeProp(key: string): string {
    return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
  }

  function typeOf(val: unknown, hint: string): string {
    if (val === null) return "null";
    if (typeof val !== "object") return typeof val;
    if (Array.isArray(val)) return arrayType(val, hint);
    return objInterface(val as Record<string, unknown>, hint);
  }

  function arrayType(arr: unknown[], hint: string): string {
    if (!arr.length) return "unknown[]";
    const objs = arr.filter(isObj);
    const others = arr.filter((v) => !isObj(v));
    const parts = new Set<string>(
      others.map((v) =>
        Array.isArray(v) ? arrayType(v as unknown[], hint) : v === null ? "null" : typeof v,
      ),
    );
    if (objs.length) parts.add(mergeObjs(objs, pascal(hint)));
    const list = [...parts];
    return (list.length === 1 ? list[0] : `(${list.join(" | ")})`) + "[]";
  }

  function mergeObjs(objs: Record<string, unknown>[], name: string): string {
    const ifName = uniqueName(name);
    const allKeys = [...new Set(objs.flatMap((o) => Object.keys(o)))];
    const fields: string[] = [];
    for (const key of allKeys) {
      const vals = objs.filter((o) => key in o).map((o) => o[key]);
      const opt = vals.length < objs.length ? "?" : "";
      let typeStr: string;
      if (vals.length && vals.every(isObj)) {
        typeStr = mergeObjs(vals as Record<string, unknown>[], pascal(key));
      } else if (vals.length && vals.every(Array.isArray)) {
        typeStr = arrayType((vals as unknown[][]).flat(), pascal(key));
      } else {
        const types = [...new Set(vals.map((v) => typeOf(v, pascal(key))))];
        typeStr = types.length === 1 ? types[0] : types.join(" | ");
      }
      fields.push(`  ${safeProp(key)}${opt}: ${typeStr};`);
    }
    defs.set(ifName, `interface ${ifName} {\n${fields.join("\n")}\n}`);
    return ifName;
  }

  function objInterface(obj: Record<string, unknown>, hint: string): string {
    const ifName = uniqueName(pascal(hint));
    const fields = Object.entries(obj).map(
      ([key, val]) => `  ${safeProp(key)}: ${typeOf(val, pascal(key))};`,
    );
    defs.set(ifName, `interface ${ifName} {\n${fields.join("\n")}\n}`);
    return ifName;
  }

  if (isObj(parsed)) {
    objInterface(parsed, "Root");
    const names = [...defs.keys()];
    const ri = names.indexOf("Root");
    if (ri > 0) { names.splice(ri, 1); names.push("Root"); }
    return names.map((n) => defs.get(n)!).join("\n\n");
  }
  if (Array.isArray(parsed)) {
    const t = arrayType(parsed, "Root");
    const names = [...defs.keys()];
    const extra = names.map((n) => defs.get(n)!).join("\n\n");
    return extra ? `${extra}\n\ntype Root = ${t};` : `type Root = ${t};`;
  }
  return `type Root = ${parsed === null ? "null" : typeof parsed};`;
}

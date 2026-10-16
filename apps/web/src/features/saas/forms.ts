/** A text field from a form, trimmed. Anything that is not text (a file, a missing field) is empty. */
export function formText(data: FormData, name: string): string {
  const value = data.get(name);
  return typeof value === "string" ? value.trim() : "";
}

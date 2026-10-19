const EMAIL = /^[^\s@,;|]+@[^\s@,;|]+\.[^\s@,;|]+$/;

export interface ParsedEmails {
  emails: string[];
  errors: string[];
}

/**
 * Reads a pasted list of email addresses: one per line, or separated by commas
 * or semicolons. Lower-cases them, ignores blank lines, and reports repeats and
 * anything that is not an address, naming the line.
 */
export function parseEmails(text: string): ParsedEmails {
  const emails: string[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  text.split(/\r?\n/).forEach((line, index) => {
    for (const raw of line.split(/[,;]/)) {
      const email = raw.trim().toLowerCase();
      if (!email) continue;
      if (!EMAIL.test(email)) errors.push(`Line ${index + 1}: "${raw.trim()}" is not an email address.`);
      else if (seen.has(email)) errors.push(`Line ${index + 1}: ${email} is listed more than once.`);
      else {
        seen.add(email);
        emails.push(email);
      }
    }
  });
  return { emails, errors };
}

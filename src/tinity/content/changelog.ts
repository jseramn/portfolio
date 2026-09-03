import changelog from "./changelog.json" with { type: "json" };

export type ChangelogEntry = {
  version: string;
  date: string | null;
  highlights: string[];
};

export const CHANGELOG: ChangelogEntry[] = changelog;

export function datedChangelog(entries: ChangelogEntry[] = CHANGELOG) {
  return entries.filter((entry) => entry.date);
}

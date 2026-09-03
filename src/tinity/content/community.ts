export type CommunityLink = {
  id: string;
  label: string;
  href: string;
  status: "live" | "coming";
  dek: string;
};

export const COMMUNITY: readonly CommunityLink[] = [
  {
    id: "issues",
    label: "GitHub Issues",
    href: "https://github.com/jseramn/tinity/issues",
    status: "live",
    dek: "Bugs, ideas, and the public trail.",
  },
  {
    id: "contributing",
    label: "Contributing",
    href: "https://github.com/jseramn/tinity/blob/main/CONTRIBUTING.md",
    status: "live",
    dek: "Ground rules. MIT. No secrets in PRs.",
  },
  {
    id: "conduct",
    label: "Code of Conduct",
    href: "https://github.com/jseramn/tinity/blob/main/CODE_OF_CONDUCT.md",
    status: "live",
    dek: "Contributor Covenant 2.1.",
  },
  {
    id: "orch",
    label: "@tinityorch",
    href: "https://x.com/tinityorch",
    status: "live",
    dek: "Project account.",
  },
  {
    id: "jr",
    label: "@jseramn_",
    href: "https://x.com/jseramn_",
    status: "live",
    dek: "Builder.",
  },
  {
    id: "slack",
    label: "Slack bus",
    href: "https://github.com/jseramn/tinity",
    status: "coming",
    dek: "Channels are reserved (#tinity-ops and kin). The bus is not open to the public yet.",
  },
];

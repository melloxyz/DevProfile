import type {
  Certificate,
  EventItem,
  ProfileData,
  Project,
  QuickLink,
} from "@/types/profile";

export const DEFAULT_PROFILE: ProfileData = {
  displayName: "Mello",
  username: "melloxyz",
  bio: "Desenvolvedor apaixonado por criar produtos que as pessoas amam.",
  statusText: "Disponivel para oportunidades",
  statusColor: "green",
  bannerUrl: null,
};

export const DEFAULT_LINKS: QuickLink[] = [
  {
    id: "github",
    label: "GitHub",
    url: "https://github.com/melloxyz",
    iconText: "GH",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    url: "https://www.linkedin.com/in/joaomellodev/",
    iconText: "IN",
  },
  {
    id: "twitter",
    label: "Twitter/X",
    url: "https://x.com/mxrvit",
    iconText: "X",
  },
];

export const DEFAULT_PROJECTS: Project[] = [];

export const DEFAULT_CERTIFICATES: Certificate[] = [];

export const DEFAULT_EVENTS: EventItem[] = [];

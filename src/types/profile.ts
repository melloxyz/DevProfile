export type TabId = "projects" | "certificates" | "events";

export type StatusColor = "green" | "yellow" | "blue" | "red";

export interface ProfileData {
  displayName: string;
  username: string;
  bio: string;
  statusText: string;
  statusColor: StatusColor;
  bannerUrl: string | null;
}

export interface QuickLink {
  id: string;
  label: string;
  url: string;
  iconText: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  stack: string[];
  repoUrl: string;
  demoUrl?: string;
}

export interface Certificate {
  id: string;
  title: string;
  issuer: string;
  date: string;
  verificationUrl: string;
  imageUrl?: string;
}

export interface EventItem {
  id: string;
  name: string;
  date: string;
  location: string;
  url?: string;
  description: string;
}

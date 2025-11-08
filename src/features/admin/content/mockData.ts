export interface AdminContentItem {
  id: string;
  title: string;
  category: "Blog" | "Announcement" | "Doctor profile";
  status: "draft" | "published" | "archived";
  author: string;
  updatedAt: string;
  createdAt: string;
  summary: string;
  body: string;
}

export const ADMIN_CONTENT_MOCK: AdminContentItem[] = [
  {
    id: "content-1",
    title: "Cryo Storage Protocol Update",
    category: "Announcement",
    status: "published",
    author: "Admin",
    createdAt: "2025-10-30T08:30:00Z",
    updatedAt: "2025-11-05T08:30:00Z",
    summary: "Policy change for cryo tank monitoring and consent renewals.",
    body:
      "Effective immediately, all cryo storage units must be inspected every 12 hours and recorded in the audit log. Consent renewals are automated and notify patients 30 days before expiry.",
  },
  {
    id: "content-2",
    title: "Understanding Embryo Grading",
    category: "Blog",
    status: "draft",
    author: "Dr. Nguyen",
    createdAt: "2025-10-31T09:00:00Z",
    updatedAt: "2025-11-03T14:00:00Z",
    summary: "Educational post explaining grading scales for patients.",
    body:
      "Embryo grading helps us determine implantation potential. Grades are based on cell uniformity, fragmentation, and development speed. This draft requires review from the medical council before publishing.",
  },
  {
    id: "content-3",
    title: "Meet Dr. Tran – Senior Embryologist",
    category: "Doctor profile",
    status: "published",
    author: "Marketing",
    createdAt: "2025-09-20T10:15:00Z",
    updatedAt: "2025-10-28T10:15:00Z",
    summary: "Staff spotlight featuring achievements and patient accolades.",
    body:
      "Dr. Tran has over 12 years of embryology experience and leads the cryo quality team. Highlights include keynote speaker roles and a 92% embryo thaw survival rate across Q1 2025.",
  },
];


export type LegalSection = {
  title: string;
  paragraphs: string[];
};

export const privacyPolicySections: LegalSection[] = [
  {
    title: "1. Introduction",
    paragraphs: [
      "EventPilot AI (also referred to as CamRSVP) is an event operations platform that helps organizers manage guest RSVP, transport (cab) coordination, hotel room allocation, QR and manual check-in, and real-time event dashboards.",
      "This Privacy Policy describes how EventPilot AI (“EventPilot”, “we”, “us”, or “our”) collects, uses, stores, shares, and protects personal information when you use our web application, APIs, background workers, and related services (collectively, the “Service”).",
      "By creating an account, signing in, or using the Service on behalf of an organization, you acknowledge that you have read this Privacy Policy. If you do not agree, please do not use the Service.",
    ],
  },
  {
    title: "2. Roles & Whose Data We Process",
    paragraphs: [
      "Organizer accounts: Event planners, agencies, venue teams, and staff who sign in with email and one-time password (OTP) to create events and manage operations. We process organizer email addresses, role assignments (e.g. Admin or Staff), authentication tokens, and activity connected to their workspace.",
      "Guest data (controlled by organizers): Information about event attendees that organizers add manually, import via CSV, or collect through RSVP and logistics workflows. Organizers are responsible for ensuring they have a lawful basis to collect and upload guest data. EventPilot processes this data on the organizer’s instructions to deliver the Service.",
      "We do not sell personal information. We act as a service provider to organizers for guest data and as a controller for account and platform security data.",
    ],
  },
  {
    title: "3. Information We Collect",
    paragraphs: [
      "Account & authentication: Email address, one-time passwords (hashed at rest), JWT session tokens, user role, account creation and update timestamps.",
      "Event information: Event name, date, location, event settings (such as QR check-in and IVR enablement), and linkage to the organizer who created the event.",
      "Guest & RSVP data: Full name, phone number, optional email, guest category (VIP, Family, General), RSVP status (Pending, Confirmed, Declined), group size, unique QR code identifiers, and optional pickup location details including coordinates when provided.",
      "Logistics & operations: Cab assignments (driver name, vehicle number, capacity, guest assignments), hotel and room records, room assignments, check-in records (method: QR scan or manual entry; location type: event gate or hotel), and timestamps for attendance and IVR responses.",
      "Communications & automation: IVR call logs and response metadata when voice confirmation workflows are triggered for guests, queue job metadata processed by our background workers, and transactional emails or messages required to deliver OTP login.",
      "Technical & usage data: IP address, browser and device type, API request logs, audit trail entries (actions performed, entity type, entity ID, associated user and event), and error diagnostics used to maintain security and reliability.",
    ],
  },
  {
    title: "4. How We Use Information",
    paragraphs: [
      "Provide and operate the Service, including guest list management, bulk CSV import, dashboard summaries, live activity feeds, QR check-in at event gates and hotels, cab and hotel assignment workflows, and optional IVR guest confirmation.",
      "Authenticate users, issue and validate session tokens, prevent unauthorized access, and enforce role-based permissions for Admin and Staff users.",
      "Process background jobs (e.g. via BullMQ workers) for asynchronous tasks such as notifications and operational workflows without blocking the main application.",
      "Maintain audit logs so organizers can review who changed guest, logistics, or check-in records within an event workspace.",
      "Improve performance, troubleshoot issues, detect abuse, and comply with legal obligations.",
    ],
  },
  {
    title: "5. Legal Bases (Where Applicable)",
    paragraphs: [
      "Where required by law (such as GDPR), we rely on: (a) performance of a contract—to provide the Service to organizers; (b) legitimate interests—to secure the platform, prevent fraud, and improve operations, balanced against your rights; (c) consent—where organizers have obtained appropriate consent for guest communications such as IVR; and (d) legal obligation—when we must retain or disclose data to comply with law.",
      "Organizers must ensure they have valid grounds under applicable privacy laws before uploading guest contact details or enabling outreach features.",
    ],
  },
  {
    title: "6. How We Share Information",
    paragraphs: [
      "Infrastructure providers: Cloud hosting, managed PostgreSQL databases (including connection pooling where configured), email delivery for OTP and operational messages, and queue infrastructure used to run workers.",
      "Organizer-directed sharing: Guest QR codes, assignment details, and check-in status are visible to authorized users within the organizer’s event workspace according to their role.",
      "Legal and safety: We may disclose information if required by law, court order, or governmental request, or when necessary to protect rights, safety, and integrity of the Service and its users.",
      "Business transfers: In connection with a merger, acquisition, or sale of assets, personal information may transfer subject to continued protection consistent with this policy.",
    ],
  },
  {
    title: "7. Data Retention",
    paragraphs: [
      "Account data is retained while your account is active and for a limited period thereafter to resolve disputes, enforce agreements, and meet legal requirements.",
      "OTP tokens are stored only until verified or expired, then marked consumed or deleted according to our retention schedule.",
      "Event, guest, logistics, check-in, and audit data are retained for the duration of the organizer’s use of the Service and may be deleted when an event or account is removed, subject to backup cycles and legal hold requirements.",
      "Organizers may request export or deletion of data they control, subject to technical capabilities and applicable law.",
    ],
  },
  {
    title: "8. Security",
    paragraphs: [
      "We implement administrative, technical, and organizational measures including HTTPS encryption in transit, hashed OTP storage, JWT-based API authentication, role-based access controls, validated API inputs, and audit logging for sensitive operations.",
      "Access to production systems is restricted to authorized personnel. Database credentials and secrets are stored in environment configuration, not in client-side code.",
      "No system is completely secure. You are responsible for safeguarding your email account, OTP codes, and device used to access the Service.",
    ],
  },
  {
    title: "9. International Transfers",
    paragraphs: [
      "Your information may be processed in countries other than your own, including where our hosting or subprocessors operate. Where required, we use appropriate safeguards such as standard contractual clauses or equivalent mechanisms.",
    ],
  },
  {
    title: "10. Your Rights & Choices",
    paragraphs: [
      "Depending on your jurisdiction, you may have the right to access, correct, delete, restrict, or port personal information, and to object to certain processing or withdraw consent where processing is consent-based.",
      "Organizers should direct guest data subject requests to their own privacy notices where they act as controllers. Account holders may contact us regarding organizer account data.",
      "You may stop using the Service at any time. Deletion requests can be submitted to the contact below; we will respond within timeframes required by applicable law.",
    ],
  },
  {
    title: "11. Children’s Privacy",
    paragraphs: [
      "The Service is intended for business use by event organizers and is not directed at children under 16. We do not knowingly collect personal information from children. If you believe a child’s data was submitted, contact us for prompt removal.",
    ],
  },
  {
    title: "12. Changes to This Policy",
    paragraphs: [
      "We may update this Privacy Policy to reflect product, legal, or operational changes. The “Last updated” date at the top of this page will be revised accordingly. Material changes will be communicated through the Service or by email where appropriate. Continued use after the effective date constitutes acceptance of the updated policy.",
    ],
  },
  {
    title: "13. Contact Us",
    paragraphs: [
      "For privacy inquiries, data subject requests, or security reports:",
      "Email: privacy@eventpilot.ai",
      "Product: EventPilot AI · Guest & event logistics management platform",
    ],
  },
];

export const termsSections: LegalSection[] = [
  {
    title: "1. Agreement to Terms",
    paragraphs: [
      "These Terms of Service (“Terms”) govern access to and use of EventPilot AI (CamRSVP), including our web application, REST APIs, authentication services, background job workers, and all related features (the “Service”).",
      "By accessing or using the Service, you agree to these Terms and our Privacy Policy. If you use the Service on behalf of an organization, you represent that you have authority to bind that organization. If you do not agree, you must not use the Service.",
    ],
  },
  {
    title: "2. Description of the Service",
    paragraphs: [
      "EventPilot AI is a software-as-a-service platform for event organizers to manage end-to-end guest operations, including:",
      "Guest management: Create and edit guest profiles, import guest lists via CSV, categorize guests (VIP, Family, General), and track RSVP status (Pending, Confirmed, Declined).",
      "Check-in: Generate unique QR codes per guest; record attendance via QR scan or manual check-in at event gates and hotel locations.",
      "Logistics: Assign guests to cabs (driver, vehicle, capacity) and to hotel rooms; monitor pickup and assignment status through operational dashboards.",
      "Communications: Optional IVR (interactive voice) workflows to confirm guest attendance or logistics, processed through queued background jobs.",
      "Administration: Multi-event workspaces, role-based access for Admin and Staff users, dashboard summaries (totals, confirmed, checked-in, pending pickups), and audit activity feeds.",
      "Features may be added, modified, or discontinued as the product evolves. Beta or preview features may be offered without warranty.",
    ],
  },
  {
    title: "3. Eligibility & Accounts",
    paragraphs: [
      "You must be at least 18 years old and capable of forming a binding contract to use the Service for commercial or organizational purposes.",
      "Access is provided through email-based OTP authentication and JWT-secured API sessions. You must provide accurate email information and keep access to your inbox secure.",
      "You are responsible for all activity under your account and for ensuring that Staff users you authorize comply with these Terms.",
      "We may suspend or terminate accounts that violate these Terms, pose security risks, or remain inactive for extended periods, subject to applicable notice requirements.",
    ],
  },
  {
    title: "4. Organizer Responsibilities",
    paragraphs: [
      "Lawful use of guest data: You are solely responsible for obtaining any required consents, permissions, and legal bases before collecting, uploading, or contacting guests through the Service, including phone numbers used for IVR.",
      "Accuracy: Guest names, contact details, pickup locations, and assignment data you provide must be accurate and kept up to date.",
      "Event operations: You are responsible for on-site execution, staff training, QR distribution, transport and hotel coordination, and guest communications beyond what the software automates.",
      "Compliance: You must comply with applicable laws governing events, data protection, telecommunications, and consumer rights in each jurisdiction where your event operates.",
    ],
  },
  {
    title: "5. Acceptable Use",
    paragraphs: [
      "You agree not to: (a) use the Service for unlawful, fraudulent, or harmful purposes; (b) upload malware, corrupted CSV files, or content that infringes third-party rights; (c) attempt to bypass authentication, scrape the API without authorization, reverse engineer the Service, or probe for vulnerabilities except through our coordinated disclosure process; (d) overload or interfere with infrastructure, workers, or queues; (e) resell or sublicense the Service without written permission; (f) use guest data for unsolicited marketing unrelated to the event you are managing.",
      "We may investigate violations and cooperate with law enforcement where required.",
    ],
  },
  {
    title: "6. Guest Data & QR Codes",
    paragraphs: [
      "QR codes issued through the Service are unique to guests and events. You must distribute them securely and treat scanned check-in data as operational records subject to your privacy obligations.",
      "EventPilot does not guarantee guest attendance, transport punctuality, or room availability—these depend on your planning and third-party providers.",
      "Deletion of an event or guest record may cascade to related assignments, check-ins, and logs as implemented in the platform; confirm exports before deletion where records are required for compliance.",
    ],
  },
  {
    title: "7. Third-Party Services",
    paragraphs: [
      "The Service may integrate with or rely on third-party providers (hosting, databases, email, telephony/IVR carriers). Your use of those features may be subject to additional third-party terms. We are not responsible for outages or acts of third-party providers beyond our reasonable control.",
      "Optional “Continue with Google” or similar sign-in methods, when enabled, are governed by the respective provider’s terms in addition to these Terms.",
    ],
  },
  {
    title: "8. Intellectual Property",
    paragraphs: [
      "EventPilot AI, including its software, design, documentation, and trademarks, is owned by EventPilot or its licensors. We grant you a limited, non-exclusive, non-transferable license to use the Service for your internal event operations during an active subscription or permitted trial.",
      "You retain ownership of content you submit (event details, guest lists, operational notes). You grant us a worldwide license to host, process, transmit, and display that content solely to provide and improve the Service.",
      "Feedback you provide may be used without restriction or compensation to improve the product.",
    ],
  },
  {
    title: "9. Confidentiality & Audit Logs",
    paragraphs: [
      "Operational data within your workspace is visible to users you authorize. Audit logs may record user actions (create, update, assign, check-in) for accountability. Treat workspace access credentials as confidential.",
    ],
  },
  {
    title: "10. Disclaimers",
    paragraphs: [
      "THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE.” TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.",
      "We do not warrant uninterrupted, error-free, or secure operation, or that QR check-in, IVR calls, CSV imports, or dashboard metrics will be free from delays or inaccuracies.",
    ],
  },
  {
    title: "11. Limitation of Liability",
    paragraphs: [
      "TO THE MAXIMUM EXTENT PERMITTED BY LAW, EVENTPILOT AND ITS AFFILIATES, OFFICERS, EMPLOYEES, AND SUPPLIERS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR LOSS OF PROFITS, DATA, GOODWILL, OR EVENT REVENUE, ARISING FROM YOUR USE OF THE SERVICE.",
      "OUR TOTAL LIABILITY FOR ANY CLAIM ARISING OUT OF THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE GREATER OF (A) AMOUNTS YOU PAID US IN THE TWELVE (12) MONTHS BEFORE THE CLAIM, OR (B) ONE HUNDRED U.S. DOLLARS (USD $100), EXCEPT WHERE LIABILITY CANNOT BE LIMITED BY LAW.",
    ],
  },
  {
    title: "12. Indemnification",
    paragraphs: [
      "You agree to indemnify and hold harmless EventPilot from claims, damages, losses, and expenses (including reasonable legal fees) arising from your use of the Service, your guest data, your events, your violation of these Terms, or your violation of any law or third-party rights.",
    ],
  },
  {
    title: "13. Termination",
    paragraphs: [
      "You may stop using the Service at any time. We may suspend or terminate access immediately for breach, security risk, or non-payment where applicable.",
      "Upon termination, your right to access the Service ends. Provisions that by nature should survive (intellectual property, disclaimers, limitation of liability, indemnification, governing law) will survive.",
    ],
  },
  {
    title: "14. Governing Law & Disputes",
    paragraphs: [
      "These Terms are governed by the laws of India, without regard to conflict-of-law principles, unless mandatory local law requires otherwise.",
      "Disputes shall first be addressed through good-faith negotiation. If unresolved within thirty (30) days, disputes may be submitted to the competent courts in India, unless applicable law provides otherwise for consumers.",
    ],
  },
  {
    title: "15. Changes to Terms",
    paragraphs: [
      "We may modify these Terms at any time. Updated Terms will be posted with a revised “Last updated” date. Material changes may be notified via the Service or email. Continued use after the effective date constitutes acceptance.",
    ],
  },
  {
    title: "16. Contact",
    paragraphs: [
      "For questions about these Terms or the Service:",
      "Email: legal@eventpilot.ai",
      "Product: EventPilot AI · Guest RSVP, logistics, and check-in platform",
    ],
  },
];

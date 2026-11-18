import type { ParsedResume } from "../types";

export const SAMPLE_RESUME_RAW_TEXT = `MAYA LIN
maya.lin.dev@example.com | San Francisco, CA | github.com/mayalin-eng

SUMMARY
Full-Stack Software Engineer with 4+ years of experience building high-throughput web applications, RESTful backend services, and real-time analytics dashboards using TypeScript, React, Node.js, and PostgreSQL.

EXPERIENCE
Senior Software Engineer — Northstar Ledger (2023 – Present)
• Architected and maintained REST services and GraphQL gateways handling billing reconciliation and webhook ingestion for B2B merchants.
• Led frontend migration from legacy SPA to modular React 18 + TypeScript architecture, improving developer velocity and cutting bundle size.
• Built automated CI/CD checks with GitHub Actions and Docker containers deployed on AWS ECS.
• Mentored two junior engineers through weekly design reviews and pairing sessions.

Software Engineer — PulseGrid Analytics (2021 – 2023)
• Built interactive data visualization dashboards in React and Recharts for customer retention telemetry.
• Designed PostgreSQL schemas and optimized slow analytical queries using composite indexes and Redis caching.
• Collaborated with product managers and designers to ship self-serve onboarding workflows.

PROJECTS
OpenTrace Log Explorer — TypeScript, Node.js, PostgreSQL, Redis, Docker
• Built an open-source structured log ingestion pipeline with full-text search and live stream filtering.

FormCraft Schema Studio — React, TypeScript, Tailwind CSS
• Created a visual JSON schema form builder supporting nested validation rules and live preview.

EDUCATION
B.S. in Computer Science — University of California, Davis (2017 – 2021)

CERTIFICATIONS
AWS Certified Developer – Associate`;

export const SAMPLE_PARSED_RESUME: ParsedResume = {
  name: "Maya Lin",
  email: "maya.lin.dev@example.com",
  summary:
    "Full-Stack Software Engineer with 4+ years of experience building high-throughput web applications, RESTful backend services, and real-time analytics dashboards using TypeScript, React, Node.js, and PostgreSQL.",
  education: [
    "B.S. in Computer Science — University of California, Davis (2017 – 2021)",
  ],
  technical_skills: [
    "TypeScript",
    "React",
    "Node.js",
    "PostgreSQL",
    "REST APIs",
    "GraphQL",
    "Redis",
    "Docker",
    "AWS ECS",
    "GitHub Actions",
    "Tailwind CSS",
    "Recharts",
  ],
  soft_skills: [
    "Technical Mentorship",
    "Cross-functional Collaboration",
    "System Design",
    "Code Review",
  ],
  projects: [
    {
      title: "OpenTrace Log Explorer",
      description:
        "Built an open-source structured log ingestion pipeline with full-text search and live stream filtering.",
      technologies: ["TypeScript", "Node.js", "PostgreSQL", "Redis", "Docker"],
    },
    {
      title: "FormCraft Schema Studio",
      description:
        "Created a visual JSON schema form builder supporting nested validation rules and live preview.",
      technologies: ["React", "TypeScript", "Tailwind CSS"],
    },
  ],
  experience: [
    {
      role: "Senior Software Engineer",
      company: "Northstar Ledger",
      duration: "2023 – Present",
      highlights: [
        "Architected and maintained REST services and GraphQL gateways handling billing reconciliation and webhook ingestion for B2B merchants.",
        "Led frontend migration from legacy SPA to modular React 18 + TypeScript architecture, improving developer velocity and cutting bundle size.",
        "Built automated CI/CD checks with GitHub Actions and Docker containers deployed on AWS ECS.",
        "Mentored two junior engineers through weekly design reviews and pairing sessions.",
      ],
    },
    {
      role: "Software Engineer",
      company: "PulseGrid Analytics",
      duration: "2021 – 2023",
      highlights: [
        "Built interactive data visualization dashboards in React and Recharts for customer retention telemetry.",
        "Designed PostgreSQL schemas and optimized slow analytical queries using composite indexes and Redis caching.",
        "Collaborated with product managers and designers to ship self-serve onboarding workflows.",
      ],
    },
  ],
  certifications: ["AWS Certified Developer – Associate"],
};

export interface SampleJobPreset {
  title: string;
  company: string;
  rawText: string;
}

export const SAMPLE_JOBS: SampleJobPreset[] = [
  {
    title: "Senior Full-Stack Engineer",
    company: "Veloce Cloud",
    rawText: `Senior Full-Stack Engineer — Veloce Cloud

About the Role:
We are looking for a Senior Full-Stack Engineer to own core customer-facing analytics workflows and resilient API development. You will work across our React + TypeScript frontend and Node.js backend services.

Required Qualifications:
- 4+ years of production software engineering experience.
- Deep proficiency in TypeScript, React, and modern CSS frameworks (Tailwind CSS).
- Proven experience in API development (RESTful services and/or GraphQL).
- Strong relational database design skills with PostgreSQL and caching layers like Redis.
- Experience with Docker and CI/CD automation pipelines.
- Strong collaboration and mentorship skills.

Preferred Qualifications:
- Experience with Kubernetes (EKS) and Terraform infrastructure-as-code.
- Familiarity with OpenTelemetry or observability pipelines.
- Bachelor's degree in Computer Science or equivalent practical experience.

Responsibilities:
- Design and ship scalable customer telemetry dashboards and self-serve workflows.
- Architect reliable backend APIs and optimize database query performance.
- Mentor junior engineers and partner closely with Product and Design.`,
  },
  {
    title: "Staff Platform Infrastructure Engineer",
    company: "Kestrel Systems",
    rawText: `Staff Platform Infrastructure Engineer — Kestrel Systems

About the Role:
Join our Core Infrastructure team to build multi-region Kubernetes clusters, distributed streaming pipelines, and Go microservices powering global financial settlement.

Required Qualifications:
- 7+ years of systems or infrastructure engineering experience.
- Production mastery of Go (Golang) or Rust for low-latency backend services.
- Deep hands-on expertise with Kubernetes operators, Helm, and Terraform.
- Experience operating Apache Kafka or distributed event streaming at scale.
- Strong background in Linux networking, Prometheus, and Grafana observability.
- Incident leadership and cross-team technical strategy.

Preferred Qualifications:
- Experience with AWS networking (VPC peering, Transit Gateway) and security compliance (SOC 2).
- B.S. or M.S. in Computer Science.

Responsibilities:
- Architect high-availability Kubernetes control planes across multiple AWS regions.
- Build internal developer platforms and automated failover tooling in Go.
- Lead reliability reviews and establish SLO governance across engineering.`,
  },
  {
    title: "Frontend Design Systems Engineer",
    company: "Atelier Metrics",
    rawText: `Frontend Design Systems Engineer — Atelier Metrics

About the Role:
We are seeking a Frontend Engineer specializing in accessible component libraries, data visualization interfaces, and frontend build performance.

Required Qualifications:
- 3+ years building production React and TypeScript applications.
- Expertise in Tailwind CSS, CSS architecture, and WCAG AA accessibility standards.
- Experience building interactive charts and data-dense SaaS dashboards.
- Experience with automated testing using Playwright and Vitest/Jest.
- Strong eye for interaction polish and collaborative communication with designers.

Preferred Qualifications:
- Experience maintaining Storybook component documentation and Figma design tokens.
- Familiarity with REST or GraphQL API integration.

Responsibilities:
- Own and evolve our shared React + TypeScript UI component system.
- Partner with product designers to deliver responsive analytics views and keyboard-accessible workflows.
- Optimize frontend bundle sizes, rendering performance, and automated visual regression tests.`,
  },
];

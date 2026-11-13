This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## User access demo

On the first visit, create the initial Super Admin account. A Super Admin can create accounts with one of four roles:

- **Basic User** — view, add, and edit content in one assigned mode; no delete or approval actions.
- **Mode-Admin** — content CRUD and approve/reject actions in one assigned mode.
- **Admin** — content CRUD across all modes, without user-access management.
- **Super Admin** — all-mode access, user management, and CSV export.

User records are stored as JSON in the browser's local storage. Passwords are salted and hashed, but all authentication and authorization run in the browser, so this is a demonstration only and must not be used to protect production data or real credentials. Production use requires server-side authentication, authorization, and a trusted database. Clear this site's local storage to restart first-time setup.

Views, lists, and libraries are not implemented as application modules yet; their planned Super Admin access is represented in the role definition only.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

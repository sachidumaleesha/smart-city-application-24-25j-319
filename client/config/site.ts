import { pages } from "@/config/pages"

export type SiteConfig = typeof siteConfig

export const siteConfig = {
  name: "Movies App",
  description:
    "Millions of movies, TV shows and people to discover. Explore now.",
  mainNav: [
    {
      title: "Home",
      href: "/",
    },
  ],
  links: {
    github: "https://github.com/oktay/movies",
    next: "https://nextjs.org",
    vercel: "https://vercel.com",
    tmdb: "https://www.themoviedb.org",
    shadcn: "https://ui.shadcn.com/",
  },
  author: {
    name: "Oktay Colakoglu",
    web: "https://oktaycolakoglu.com",
  },
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://13.201.219.73:5000"
  }
}
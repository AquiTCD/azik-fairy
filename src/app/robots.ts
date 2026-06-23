import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "Twitterbot",
        allow: "/",
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: "/share",
      },
    ],
    sitemap: "https://azik-fairy.solunita.net/sitemap.xml",
  };
}

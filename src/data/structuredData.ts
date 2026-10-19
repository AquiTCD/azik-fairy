import { SITE_DESCRIPTION } from "./siteMetadata";

export const videoGameJsonLd = {
  "@context": "https://schema.org",
  "@type": "VideoGame",
  name: "AZIK-Fairy",
  description: SITE_DESCRIPTION,
  genre: "Typing",
  applicationCategory: "Game",
  operatingSystem: "Web",
  url: "https://azik-fairy.solunita.net/",
  image: "https://azik-fairy.solunita.net/images/og_image.png",
  inLanguage: "ja",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "JPY",
  },
} as const;

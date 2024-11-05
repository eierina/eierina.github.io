import type { Site, SocialObjects } from "./types";

export const SITE: Site = {
  website: "https://block-zero.io/", // replace this with your deployed domain
  author: "Edoardo Ierina",
  profile: "https://block-zero.io/about",
  desc: "A developer's take on mastery and exploration of blockchain technology for fun and profit.",
  title: "Block::ZERO",
  ogImage: "astropaper-og.jpg",
  lightAndDarkMode: true,
  postPerIndex: 4,
  postPerPage: 3,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: true,
  editPost: {
    url: "https://github.com/eierina/eierina.github.io/edit/main/src/content/blog",
    text: "Suggest Changes",
    appendFilePath: true,
  },
};

export const LOCALE = {
  lang: "en", // html lang code. Set this empty and default will be "en"
  langTag: ["en-EN"], // BCP 47 Language Tags. Set this empty [] to use the environment default
} as const;

export const LOGO_IMAGE = {
  enable: false,
  svg: true,
  width: 216,
  height: 46,
};

export const SOCIALS: SocialObjects = [
  {
    name: "Github",
    href: "https://github.com/eierina",
    linkTitle: `Github`,
    active: true,
  },
  {
    name: "LinkedIn",
    href: "https://github.com/in/edoardoierina",
    linkTitle: `LinkedIn`,
    active: true,
  },
  {
    name: "Mail",
    href: "mailto:edoardo@block-zero.com",
    linkTitle: `Email`,
    active: false,
  },
  {
    name: "Twitter",
    href: "https://github.com/eierina",
    linkTitle: `Twitter`,
    active: true,
  },
];

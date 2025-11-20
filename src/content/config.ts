import { SITE } from "@config";
import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";
import type { SocialObjects, AuthorData } from "../types"

const blog = defineCollection({
  type: "content_layer",
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: ({ image }) =>
    z.object({
      author: z.string().default(SITE.author),
      pubDatetime: z.date(),
      modDatetime: z.date().optional().nullable(),
      title: z.string(),
      featured: z.boolean().optional(),
      draft: z.boolean().optional(),
      tags: z.array(z.string()).default(["others"]),
      category: z.enum(["Research", "Deep Dive", "Tutorial"]).default("Tutorial"),
      ogImage: image()
        .refine(img => img.width >= 1200 && img.height >= 630, {
          message: "OpenGraph image must be at least 1200 X 630 pixels!",
        })
        .or(z.string())
        .optional(),
      description: z.string(),
      canonicalURL: z.string().optional(),
      editPost: z
        .object({
          disabled: z.boolean().optional(),
          url: z.string().optional(),
          text: z.string().optional(),
          appendFilePath: z.boolean().optional(),
        })
        .optional(),
    }),
});

const authors = defineCollection({
  type: "content_layer",
  loader: glob({ pattern: "**/*.md", base: "./src/content/authors" }),
  schema: () =>
    z
      .object({
        name: z.string(),
        avatar: z.string(),
        occupation: z.string(),
        company: z.string(),
        email: z.string(),
        twitter: z.string().url().optional(),
        linkedin: z.string().url().optional(),
        github: z.string().url().optional(),
      })
      .transform(({ twitter, linkedin, github, ...rest }) => ({
        ...rest,
        socials: [
          twitter && {
            name: "Twitter",
            href: twitter,
            linkTitle: "Twitter",
            active: !!twitter,
          },
          linkedin && {
            name: "LinkedIn",
            href: linkedin,
            linkTitle: "LinkedIn",
            active: !!linkedin,
          },
          github && {
            name: "Github",
            href: github,
            linkTitle: "Github",
            active: !!github,
          },
        ].filter(Boolean) as SocialObjects,
      })),
});


export const collections = { blog, authors };
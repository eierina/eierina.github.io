import { slugifyStr } from "@utils/slugify";
import Datetime from "./Datetime";
import type { CollectionEntry } from "astro:content";

export interface Props {
  href?: string;
  frontmatter: CollectionEntry<"blog">["data"];
  secHeading?: boolean;
}

export default function Card({ href, frontmatter, secHeading = true }: Props) {
  const { title, pubDatetime, modDatetime, description, tags } = frontmatter;
  
  return (
    <li className="border-b border-skin-line py-10 transition-opacity hover:opacity-80 first:pt-0">
      <a
        href={href}
        className="block group"
      >
        <Datetime 
          pubDatetime={pubDatetime} 
          modDatetime={modDatetime} 
          tags={tags} 
          size="sm" 
          className="mb-3"
        />
        
        {secHeading ? (
          <h2 
            style={{ viewTransitionName: slugifyStr(title) }}
            className="mb-3 text-[32px] font-bold leading-[1.2] tracking-[-0.02em] text-skin-base"
          >
            {title}
          </h2>
        ) : (
          <h3 
            style={{ viewTransitionName: slugifyStr(title) }}
            className="mb-3 text-[32px] font-bold leading-[1.2] tracking-[-0.02em] text-skin-base"
          >
            {title}
          </h3>
        )}
        
        <p className="max-w-[800px] text-[17px] leading-[1.6] text-skin-muted">
          {description}
        </p>
      </a>
    </li>
  );
}

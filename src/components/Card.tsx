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
  const headerProps = {
    style: { viewTransitionName: slugifyStr(title) },
    className:
      "font-semibold tracking-tight transition-colors leading-tight text-balance",
  };

  return (
    <li className="my-10 first:mt-0 last:mb-0">
      <a
        href={href}
        className="group block rounded-2xl border border-skin-line bg-skin-card px-8 py-10 transition-all duration-200 hover:-translate-y-0.5 hover:border-skin-accent/20 hover:shadow-xl hover:shadow-black/[0.03] accent-bar"
      >
        <article className="flex flex-col">
          {/* Title with perfect hierarchy */}
          {secHeading ? (
            <h2
              {...headerProps}
              className="text-[28px] sm:text-[32px] font-semibold text-skin-base transition-colors group-hover:text-skin-accent leading-[1.2] mb-4"
            >
              {title}
            </h2>
          ) : (
            <h3
              {...headerProps}
              className="text-[28px] sm:text-[32px] font-semibold text-skin-base transition-colors group-hover:text-skin-accent leading-[1.2] mb-4"
            >
              {title}
            </h3>
          )}

          {/* Metadata with subtle styling */}
          <Datetime
            pubDatetime={pubDatetime}
            modDatetime={modDatetime}
            className="text-[14px] tracking-wide uppercase text-skin-muted mb-5"
            tags={tags}
          />

          {/* Description with optimal readability */}
          <p className="text-skin-base/75 leading-[1.7] text-[17px] mb-6 font-normal">
            {description}
          </p>

          {/* Call to action */}
          <div className="flex items-center gap-2 text-[15px] font-medium text-skin-accent pt-2">
            <span className="group-hover:underline decoration-2 underline-offset-4 transition-all">
              Read article
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </article>
      </a>
    </li>
  );
}

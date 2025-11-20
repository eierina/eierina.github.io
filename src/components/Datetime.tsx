import { LOCALE, SITE } from "@config";
import type { CollectionEntry } from "astro:content";

interface DatetimesProps {
  pubDatetime: string | Date;
  modDatetime: string | Date | undefined | null;
}

interface EditPostProps {
  editPost?: CollectionEntry<"blog">["data"]["editPost"];
  postId?: CollectionEntry<"blog">["id"];
}

interface TagProps {
  tags?: string[];
  category?: string;
}

interface Props extends DatetimesProps, EditPostProps, TagProps {
  size?: "sm" | "lg";
  className?: string;
}

export default function Datetime({
  pubDatetime,
  modDatetime,
  size = "sm",
  className = "",
  editPost,
  postId,
  tags = [],
  category
}: Props) {
  const myDatetime = new Date(
    modDatetime && modDatetime > pubDatetime ? modDatetime : pubDatetime
  );

  const date = myDatetime.toLocaleDateString(LOCALE.langTag, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (size === "sm") {
    // V4 Listing Style: [Category] [Date] [Tag 0] - [Tag 1]...
    return (
      <div className={`flex items-center gap-4 text-[13px] text-skin-muted mb-3 ${className}`}>
        {category && (
          <span className="font-semibold uppercase tracking-[0.08em] text-skin-accent">
            {category}
          </span>
        )}
        <span className="text-skin-muted">{date}</span>
        {tags.length > 0 && (
          <div className="flex gap-2 text-skin-muted">
            {tags.map((tag, index) => (
              <span key={tag} className="flex items-center gap-2 transition-colors hover:text-skin-accent">
                {index === 0 ? "" : <span>-</span>}
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Size "lg" (Post Details) - V5 Style with Icons
  return (
    <div className={`flex items-center gap-6 text-sm text-skin-muted ${className}`}>
      <div className="flex items-center gap-1.5">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <time dateTime={myDatetime.toISOString()}>{date}</time>
      </div>
      
      {/* Placeholder for Read Time if we had it, or Author */}
      {/* <div className="flex items-center gap-1.5">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
           <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
           <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span>{SITE.author}</span>
      </div> */}

      {size === "lg" && <EditPost editPost={editPost} postId={postId} />}
    </div>
  );
}

const EditPost = ({ editPost, postId }: EditPostProps) => {
  let editPostUrl = editPost?.url ?? SITE?.editPost?.url ?? "";
  const showEditPost = !editPost?.disabled && editPostUrl.length > 0;
  const appendFilePath =
    editPost?.appendFilePath ?? SITE?.editPost?.appendFilePath ?? false;
  if (appendFilePath && postId) {
    editPostUrl += `/${postId}`;
  }
  const editPostText = editPost?.text ?? SITE?.editPost?.text ?? "Edit";

  return (
    showEditPost && (
      <>
        <span aria-hidden="true"> | </span>
        <a
          className="hover:opacity-75"
          href={editPostUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          <span className="italic">{editPostText}</span>
        </a>
      </>
    )
  );
};




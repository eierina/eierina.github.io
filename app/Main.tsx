import Link from '@/components/Link'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import { formatDate } from '@block0/pliny/utils/formatDate'
import NewsletterForm from '@block0/pliny/ui/NewsletterForm'

const MAX_DISPLAY = 5

export default function Home({ posts }) {
  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-2 pb-8 pt-6 md:space-y-5">
          <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
            {siteMetadata.description}
          </p>
        </div>
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {!posts.length && 'No posts found.'}
          {posts.slice(0, MAX_DISPLAY).map((post) => {
            const { slug, date, title, summary, tags, readingTime } = post
            return (
              <Link key={slug} href={`/blog/${slug}`} className="block py-8">
                <article>
                  <div className="space-y-2 xl:grid xl:grid-cols-4 xl:items-baseline xl:space-y-0">
                    <dl>
                      <dt className="sr-only"></dt>
                      <dd className="text-base font-medium leading-6 text-gray-500 dark:text-gray-400">
                        {/* TODO: add post image here */}
                      </dd>
                    </dl>
                    <div className="space-y-5 xl:col-span-3">
                      <div className="space-y-6">
                        <div>
                          <h2 className="text-2xl font-bold leading-8 tracking-tight">
                            <Link href={`/blog/${slug}`} className="text-gray-900 dark:text-gray-100">
                              {title}
                            </Link>
                          </h2>
                        </div>
                        <div className="prose max-w-none text-gray-500 dark:text-gray-400">
                          {summary}
                        </div>
                      </div>
                      <dl className="flex items-center gap-2.5 text-gray-500 dark:text-gray-400">
                        <dt className="sr-only">Published on</dt>
                        <dd className="text-base text-sm font-medium leading-6 text-gray-500 dark:text-gray-400">
                          <time dateTime={date}>{formatDate(date, siteMetadata.locale)}</time>
                        </dd>
                        <div className="dark:bg-gray-6500 h-4 w-px bg-gray-300 opacity-30"></div>{' '}
                        {/* Separator */}
                        <dt className="sr-only">Estimated reading time</dt>
                        <dd className="text-base text-sm font-medium leading-6 text-gray-500 dark:text-gray-400">
                          {readingTime.text}
                        </dd>
                      </dl>
                      <div className="text-base font-medium leading-6">
                        <div className="flex flex-wrap">
                          {tags.map((tag) => (
                            <Tag key={tag} text={tag} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            )
          })}
        </ul>
      </div>
      {posts.length > MAX_DISPLAY && (
        <div className="flex justify-end text-base font-medium leading-6">
          <Link
            href="/blog"
            className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
            aria-label="All posts"
          >
            All Posts &rarr;
          </Link>
        </div>
      )}
      {siteMetadata.newsletter?.provider && (
        <div className="flex items-center justify-center pt-4">
          <NewsletterForm />
        </div>
      )}
    </>
  )
}

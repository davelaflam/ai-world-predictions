export function getTitle(article: any): string {
  return (
    article.title ||
    article.headline ||
    article.subtitle ||
    article?.main_article?.title ||
    article?.main_article_details?.headline ||
    'Untitled'
  )
}

export function getAuthor(article: any): string {
  return article.author || article.byline || article?.main_article_details?.author || 'Unknown'
}

export function getDate(article: any): string {
  return (
    article.date ||
    article.publication_date ||
    article?.main_article?.publication_date ||
    article?.main_article_details?.date ||
    article?.key_dates?.[0]?.date ||
    'Unknown'
  )
}

export function getUrl(article: any): string {
  return (
    article.url ||
    article.link ||
    article?.source_urls?.[0] ||
    article?.source_links?.[0] ||
    article?.main_article_details?.publications?.[0]?.link ||
    'https://unknown-source'
  )
}

export function getSummary(article: any): string {
  const summary =
    article.summary || article.content || article.content_summary || article.description || JSON.stringify(article)
  return typeof summary === 'string' ? summary : JSON.stringify(summary)
}

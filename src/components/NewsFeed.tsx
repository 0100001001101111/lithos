'use client';

import { News } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface NewsFeedProps {
  news: News[];
  limit?: number;
}

function getSourceIcon(source: string) {
  // Simple icon based on source
  const icons: Record<string, string> = {
    'Mining.com': 'M',
    'Reuters': 'R',
    'USGS': 'U',
    'Bloomberg': 'B',
  };
  return icons[source] || source.charAt(0).toUpperCase();
}

export default function NewsFeed({ news, limit = 10 }: NewsFeedProps) {
  const displayNews = news.slice(0, limit);

  if (displayNews.length === 0) {
    return (
      <div className="text-[var(--text-secondary)] text-sm py-4">
        No news available
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {displayNews.map((item) => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="news-item block px-3 py-2 rounded-lg"
        >
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded bg-[var(--border)] flex items-center justify-center text-xs font-medium text-[var(--text-secondary)] flex-shrink-0 mt-0.5">
              {getSourceIcon(item.source)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-[var(--text-primary)] line-clamp-2 leading-tight">
                {item.title}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-[var(--text-secondary)]">
                  {item.source}
                </span>
                <span className="text-xs text-[var(--text-secondary)]">·</span>
                <span className="text-xs text-[var(--text-secondary)]">
                  {item.published_at
                    ? formatDistanceToNow(new Date(item.published_at), { addSuffix: true })
                    : 'Recently'}
                </span>
              </div>
              {item.material_tags && item.material_tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.material_tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-1.5 py-0.5 rounded bg-[var(--border)] text-[var(--text-secondary)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

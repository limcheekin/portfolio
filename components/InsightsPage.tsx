
import React, { useState } from 'react';
import { SectionWrapper, ExternalLinkIcon, Button } from './Layout'; 
import { ARTICLES_DATA } from '../constants';
import { Article, SectionProps } from '../types';

interface ArticleListItemProps {
  article: Article;
}
const ArticleListItem: React.FC<ArticleListItemProps> = ({ article }) => {
  return (
    <li className="mb-5 group relative transition-all duration-250 ease-custom-ease hover:!opacity-100 lg:hover:!opacity-100 lg:group-hover:opacity-100">
      <a 
        href={article.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block p-5 rounded-md transition-all duration-250 ease-custom-ease hover:bg-light-navy hover:shadow-xl focus-visible:bg-light-navy focus-visible:shadow-xl"
        aria-label={`Read article: ${article.title}`}
      >
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-lg font-semibold text-lightest-slate group-hover:text-green-accent transition-colors duration-250">
            {article.title}
          </h3>
          <ExternalLinkIcon className="w-4 h-4 text-slate-text group-hover:text-green-accent transition-colors duration-250 flex-shrink-0 ml-2" />
        </div>
        <p className="text-sm text-slate-text leading-relaxed line-clamp-2 mb-1">
          {article.summary}
        </p>
        <p className="text-xs font-mono text-green-accent/80">
            {article.type} {article.platform && `· ${article.platform}`}
        </p>
      </a>
    </li>
  );
};

export const BlogSection: React.FC<SectionProps> = ({ id }) => {
  const [showAllArticles, setShowAllArticles] = useState(false);
  const initialArticleCount = 3;
  const articles = ARTICLES_DATA || [];
  const displayedArticles = showAllArticles ? articles : articles.slice(0, initialArticleCount);

  return (
    <SectionWrapper id={id} title="Writing" titleNumber="03" contentClassName="max-w-2xl mx-auto">
      {articles.length > 0 ? (
        <>
          <ul className="space-y-1">
            {displayedArticles.map((article: Article) => (
              <ArticleListItem key={article.id} article={article} />
            ))}
          </ul>
          {articles.length > initialArticleCount && (
            <div className="mt-10 text-center">
              <Button
                onClick={() => setShowAllArticles(!showAllArticles)}
                variant="secondary"
                aria-expanded={showAllArticles}
              >
                {showAllArticles ? 'Show Fewer Articles' : 'Show More Articles'}
              </Button>
            </div>
          )}
        </>
      ) : (
        <p className="text-center text-slate-text text-lg">No articles yet. "Exploratory Thoughts" and "Work-in-Progress" pieces coming soon!</p>
      )}
      {/* Optional: Link to a dedicated blog page or Medium profile */}
      {/* <div className="mt-12 text-center">
        <Button href="https://medium.com/@yourprofile" size="md">
          View All Posts
        </Button>
      </div> */}
    </SectionWrapper>
  );
};

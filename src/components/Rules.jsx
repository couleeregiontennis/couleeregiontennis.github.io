import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '../styles/Rules.css';
import { LoadingSpinner } from './LoadingSpinner';

export const Rules = () => {
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/rules_context.md')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch rules');
        return res.text();
      })
      .then((text) => {
        setMarkdown(text);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load rules content.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="rules-page" style={{ display: 'flex', justifyContent: 'center', paddingTop: '50px' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rules-page">
        <div className="rules-header">
           <h1>Rules</h1>
        </div>
        <div className="rules-content">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rules-page">
      <div className="rules-markdown-container">
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                h1: ({node, ...props}) => <div className="rules-header"><h1 {...props} /></div>,
                h2: ({node, ...props}) => <h2 className="rules-section-title" {...props} />,
            }}
        >
            {markdown}
        </ReactMarkdown>
      </div>
    </div>
  );
};

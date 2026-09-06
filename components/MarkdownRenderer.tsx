
import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const renderContent = () => {
    // Process bold, links, and newlines
    const processedContent = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-400 hover:underline">$1</a>')
      .replace(/\n/g, '<br />');

    return { __html: processedContent };
  };

  return <div dangerouslySetInnerHTML={renderContent()} className="prose prose-invert max-w-none text-gray-300" />;
};

export default MarkdownRenderer;

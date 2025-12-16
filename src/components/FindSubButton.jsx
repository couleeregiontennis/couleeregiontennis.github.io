import useCopyToClipboard from '../scripts/CopyToClipboard';

export const FindSubButton = ({ message, url }) => {
  const { copyToClipboard, copied } = useCopyToClipboard();

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="find-sub-icon"
      onClick={() => copyToClipboard(message)}
      aria-label={copied ? "Message copied to clipboard" : "Find substitute on GroupMe"}
      style={{
        marginLeft: '0.5em',
        fontSize: '1.2em',
        color: copied ? '#4CAF50' : '#00aff0',
        textDecoration: 'none',
        display: 'inline-block',
        verticalAlign: 'middle',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
      title="Find Sub"
    >
      <span aria-hidden="true">{copied ? '✅' : '🆘'}</span>
    </a>
  );
};

import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Reusable EmptyState Component
 * 
 * Renders a consistent, premium card layout for blank or unconfigured views.
 */
const EmptyState = ({
  title,
  description,
  icon,
  primaryActionLabel,
  primaryActionTo,
  primaryActionOnClick,
  secondaryActionLabel,
  secondaryActionTo,
  secondaryActionOnClick,
  note,
  plain
}) => {
  const renderPrimaryAction = () => {
    if (!primaryActionLabel) return null;

    if (primaryActionTo) {
      return (
        <Link
          to={primaryActionTo}
          className="btn-primary"
          style={{ padding: '12px 24px', fontWeight: 700, textDecoration: 'none' }}
        >
          {primaryActionLabel}
        </Link>
      );
    }

    return (
      <button
        type="button"
        onClick={primaryActionOnClick}
        className="btn-primary"
        style={{ padding: '12px 24px', fontWeight: 700 }}
      >
        {primaryActionLabel}
      </button>
    );
  };

  const renderSecondaryAction = () => {
    if (!secondaryActionLabel) return null;

    if (secondaryActionTo) {
      return (
        <Link
          to={secondaryActionTo}
          className="btn-secondary"
          style={{ padding: '10px 24px', fontWeight: 700, textDecoration: 'none' }}
        >
          {secondaryActionLabel}
        </Link>
      );
    }

    return (
      <button
        type="button"
        onClick={secondaryActionOnClick}
        className="btn-secondary"
        style={{ padding: '10px 24px', fontWeight: 700 }}
      >
        {secondaryActionLabel}
      </button>
    );
  };

  return (
    <div
      className={plain ? "animate-fade-in-scale" : "medical-card animate-fade-in-scale"}
      style={plain ? {
        padding: '16px 8px',
        textAlign: 'center',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      } : {
        padding: '40px 32px',
        textAlign: 'center',
        maxWidth: '560px',
        width: '100%',
        margin: '24px auto',
        background: 'white',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* Icon/Emoji */}
      {icon && (
        <div
          style={{
            width: '64px',
            height: '64px',
            background: 'var(--primary-50)',
            color: 'var(--primary)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
            marginBottom: '20px',
            boxShadow: '0 4px 12px rgba(13, 148, 136, 0.05)'
          }}
        >
          {icon}
        </div>
      )}

      {/* Title */}
      <h3
        style={{
          fontSize: '1.25rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
          marginBottom: '10px',
          lineHeight: 1.4
        }}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        style={{
          fontSize: '0.9rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          marginBottom: (primaryActionLabel || secondaryActionLabel) ? '28px' : '0px',
          maxWidth: '440px'
        }}
      >
        {description}
      </p>

      {/* Action Buttons */}
      {(primaryActionLabel || secondaryActionLabel) && (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
          {renderPrimaryAction()}
          {renderSecondaryAction()}
        </div>
      )}

      {/* Note */}
      {note && (
        <div
          style={{
            marginTop: '20px',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            fontWeight: 600,
            lineHeight: 1.4
          }}
        >
          {note}
        </div>
      )}
    </div>
  );
};

export default EmptyState;

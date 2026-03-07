import React from 'react';

export default function PredictionBadge({ source }) {
    if (source === 'ml_model') {
        return (
            <span className="badge badge-info" title="AI Predicted">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                AI Model
            </span>
        );
    }
    return (
        <span className="badge badge-warning" title="Rule-Based Estimate">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
            Rule-based
        </span>
    );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-brand-charcoal text-white flex flex-col justify-center items-center px-6">
      <div className="max-w-md text-center space-y-6 animate-fade-in">
        <div className="inline-flex p-4 rounded-full bg-brand-surface border border-brand-surface-hover text-brand-lime">
          <AlertCircle size={48} />
        </div>
        <h1 className="text-4xl font-extrabold font-mono tracking-tight">404 - Not Found</h1>
        <p className="text-brand-text-muted text-sm leading-relaxed max-w-xs mx-auto">
          The parking slot or page you are looking for has expired or does not exist.
        </p>
        <button
          onClick={() => navigate('/')}
          className="bg-brand-lime hover:bg-brand-lime-hover text-black px-6 py-2.5 rounded-lg text-sm font-semibold transition-all inline-flex items-center space-x-2"
        >
          <ArrowLeft size={16} />
          <span>Return Home</span>
        </button>
      </div>
    </div>
  );
};

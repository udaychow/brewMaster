import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="text-6xl font-bold text-brand-600 mb-4">404</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Page not found</h1>
          <p className="text-gray-600 mb-8">
            Sorry, we couldn't find the page you're looking for.
          </p>
          <Link
            to="/dashboard"
            className="btn-primary"
          >
            Go back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};
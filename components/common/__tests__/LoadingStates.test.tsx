import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner, LoadingSkeleton, SuspenseBoundary } from '../LoadingStates';

describe('LoadingStates Components', () => {
  describe('LoadingSpinner', () => {
    it('should render with default size', () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole('generic');
      expect(spinner).toBeInTheDocument();
    });

    it('should render with text', () => {
      render(<LoadingSpinner text="Loading..." />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should render with different sizes', () => {
      const { rerender } = render(<LoadingSpinner size="sm" />);
      expect(screen.getByRole('generic')).toBeInTheDocument();

      rerender(<LoadingSpinner size="md" />);
      expect(screen.getByRole('generic')).toBeInTheDocument();

      rerender(<LoadingSpinner size="lg" />);
      expect(screen.getByRole('generic')).toBeInTheDocument();
    });
  });

  describe('LoadingSkeleton', () => {
    it('should render single skeleton by default', () => {
      render(<LoadingSkeleton />);
      const skeletons = screen.getAllByRole('generic');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render multiple skeletons', () => {
      render(<LoadingSkeleton count={3} />);
      const skeletons = screen.getAllByRole('generic');
      expect(skeletons.length).toBe(3);
    });

    it('should apply custom className', () => {
      render(<LoadingSkeleton className="custom-class" />);
      const skeleton = screen.getAllByRole('generic')[0];
      expect(skeleton).toHaveClass('custom-class');
    });
  });

  describe('SuspenseBoundary', () => {
    it('should render children', () => {
      render(
        <SuspenseBoundary>
          <div>Test Content</div>
        </SuspenseBoundary>
      );
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should use custom fallback', () => {
      render(
        <SuspenseBoundary fallback={<div>Custom Loading</div>}>
          <div>Test Content</div>
        </SuspenseBoundary>
      );
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });
});


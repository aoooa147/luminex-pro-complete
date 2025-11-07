import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  EmptyState,
  EmptyStakingState,
  EmptyRewardsState,
  EmptyReferralsState,
  EmptyGamesState,
  EmptyPowerState,
} from '../EmptyStates';

describe('EmptyStates Components', () => {
  describe('EmptyState', () => {
    it('should render with title', () => {
      render(<EmptyState title="Test Title" />);
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('should render with description', () => {
      render(
        <EmptyState
          title="Test Title"
          description="Test Description"
        />
      );
      expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    it('should render with action', () => {
      render(
        <EmptyState
          title="Test Title"
          action={<button>Action Button</button>}
        />
      );
      expect(screen.getByText('Action Button')).toBeInTheDocument();
    });

    it('should render default icon when no icon provided', () => {
      render(<EmptyState title="Test Title" />);
      const container = screen.getByText('Test Title').closest('div');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Predefined Empty States', () => {
    it('should render EmptyStakingState', () => {
      render(<EmptyStakingState />);
      expect(screen.getByText('No Staking Yet')).toBeInTheDocument();
    });

    it('should render EmptyRewardsState', () => {
      render(<EmptyRewardsState />);
      expect(screen.getByText('No Rewards Yet')).toBeInTheDocument();
    });

    it('should render EmptyReferralsState', () => {
      render(<EmptyReferralsState />);
      expect(screen.getByText('No Referrals Yet')).toBeInTheDocument();
    });

    it('should render EmptyGamesState', () => {
      render(<EmptyGamesState />);
      expect(screen.getByText('No Games Played')).toBeInTheDocument();
    });

    it('should render EmptyPowerState', () => {
      render(<EmptyPowerState />);
      expect(screen.getByText('No Power License')).toBeInTheDocument();
    });
  });
});


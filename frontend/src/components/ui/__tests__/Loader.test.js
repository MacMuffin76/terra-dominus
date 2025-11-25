import React from 'react';
import { render, screen } from '@testing-library/react';
import Loader from '../Loader';

describe('Loader', () => {
  it('rend le label et les classes associées', () => {
    render(<Loader label="Chargement des données" size="lg" center />);

    const loader = screen.getByRole('status');
    expect(loader).toHaveClass('ui-loader', 'ui-loader-lg', 'ui-loader-center');
    expect(screen.getByText('Chargement des données')).toBeInTheDocument();
  });

  it('gère un label vide et conserve le spinner accessible', () => {
    render(<Loader label="" />);

    const loader = screen.getByRole('status');
    expect(loader).toHaveAttribute('aria-live', 'polite');
    expect(loader.querySelector('.ui-loader-spinner')).toBeTruthy();
  });
});
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Alert from '../Alert';

describe('Alert', () => {
  it('affiche le titre, le message et une icône par défaut', () => {
    render(<Alert type="info" title="Succès" message="Opération terminée" />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Succès')).toBeInTheDocument();
    expect(screen.getByText('Opération terminée')).toBeInTheDocument();
    expect(screen.getByText('ℹ️')).toBeInTheDocument();
  });

  it('affiche les actions et déclenche les callbacks', () => {
    const onAction = jest.fn();
    const onClose = jest.fn();

    render(
      <Alert
        type="error"
        title="Erreur"
        message="Une erreur est survenue"
        onAction={onAction}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
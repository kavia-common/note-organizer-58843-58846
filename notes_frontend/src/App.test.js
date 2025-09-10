import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Note Organizer brand', () => {
  render(<App />);
  const brandElement = screen.getByText(/Note Organizer/i);
  expect(brandElement).toBeInTheDocument();
});

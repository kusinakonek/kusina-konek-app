import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import FoodCard from '../../components/FoodCard';

describe('FoodCard (Donation Listing)', () => {
  it('renders title and triggers Claim press', () => {
    const onPress = jest.fn();

    const props = {
      title: 'Surplus Bagels',
      distance: '1.2km',
      type: 'bakery',
      expiry: '2h',
    };

    const { getByText } = render(<FoodCard {...props} onPress={onPress} />);

    expect(getByText('Surplus Bagels')).toBeTruthy();

    fireEvent.press(getByText('Claim'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

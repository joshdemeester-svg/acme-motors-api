import stockImage1 from '@assets/stock_images/luxury_sports_car_ex_2a1585ad.jpg';
import stockImage2 from '@assets/stock_images/luxury_sports_car_ex_fa8b841b.jpg';
import stockImage3 from '@assets/stock_images/luxury_sports_car_ex_01348157.jpg';

export interface Car {
  id: number;
  year: number;
  make: string;
  model: string;
  price: number;
  mileage: number;
  image: string;
  status: 'Available' | 'Sold' | 'Pending';
}

export const MOCK_INVENTORY: Car[] = [
  {
    id: 1,
    year: 2023,
    make: "Porsche",
    model: "911 GT3 RS",
    price: 325000,
    mileage: 1200,
    image: stockImage1,
    status: 'Available'
  },
  {
    id: 2,
    year: 2022,
    make: "Ferrari",
    model: "F8 Tributo",
    price: 295000,
    mileage: 4500,
    image: stockImage2,
    status: 'Available'
  },
  {
    id: 3,
    year: 2024,
    make: "Lamborghini",
    model: "Huracán Sterrato",
    price: 340000,
    mileage: 500,
    image: stockImage3,
    status: 'Pending'
  },
  {
    id: 4,
    year: 2021,
    make: "Aston Martin",
    model: "DBS Superleggera",
    price: 245000,
    mileage: 8900,
    image: stockImage1, // Reusing for mock
    status: 'Available'
  }
];

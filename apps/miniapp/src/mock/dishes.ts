import { DishDetail, DishSummary } from '../api/dish';

export const mockDishes: DishSummary[] = [
  {
    id: 'demo-braised-chicken-rice',
    name: 'Braised Chicken Leg Rice',
    category: 'Hot meal',
    station: 'Hot kitchen',
    description: 'High-frequency lunch set with low operation threshold.',
    ingredientCost: 12.8,
    isActive: true,
  },
  {
    id: 'demo-black-pepper-beef',
    name: 'Black Pepper Beef Pasta',
    category: 'Western',
    station: 'Pasta station',
    description: 'Premium pasta line for higher ticket customers.',
    ingredientCost: 16.5,
    isActive: true,
  },
  {
    id: 'demo-caesar-salad',
    name: 'Caesar Chicken Salad',
    category: 'Light meal',
    station: 'Cold kitchen',
    description: 'Cold-chain friendly salad for grab-and-go lines.',
    ingredientCost: 10.2,
    isActive: true,
  },
];

const mockDishDetails: Record<string, DishDetail> = {
  'demo-braised-chicken-rice': {
    ...mockDishes[0],
    description: 'Suitable for lunch peak output with stable prep and fast serving.',
    ingredients: [
      { ingredientId: 'chicken-leg', quantity: 1, unit: 'pc', wasteRate: 0.06 },
      { ingredientId: 'rice', quantity: 220, unit: 'g', wasteRate: 0.01 },
      { ingredientId: 'soy-sauce', quantity: 18, unit: 'ml', wasteRate: 0.02 },
    ],
    steps: [
      {
        id: 1,
        title: 'Prep',
        description: 'Thaw the chicken leg, dry the surface, and prepare the ingredients.',
        duration: 5,
        station: 'Hot kitchen',
      },
      {
        id: 2,
        title: 'Simmer',
        description: 'Cook the chicken leg with sauce over low heat until fully infused.',
        duration: 18,
        station: 'Hot kitchen',
      },
      {
        id: 3,
        title: 'Plate',
        description: 'Serve rice, place the chicken leg, and finish the plate with sides.',
        duration: 3,
        station: 'Pickup counter',
      },
    ],
  },
  'demo-black-pepper-beef': {
    ...mockDishes[1],
    description: 'Good for a premium menu with tighter sauce and heat control.',
    ingredients: [
      { ingredientId: 'beef', quantity: 150, unit: 'g', wasteRate: 0.08 },
      { ingredientId: 'pasta', quantity: 160, unit: 'g', wasteRate: 0.01 },
      { ingredientId: 'black-pepper-sauce', quantity: 30, unit: 'ml', wasteRate: 0.02 },
    ],
    steps: [
      {
        id: 1,
        title: 'Prep',
        description: 'Slice and marinate the beef, then par-cook the pasta.',
        duration: 8,
        station: 'Prep area',
      },
      {
        id: 2,
        title: 'Stir fry',
        description: 'Quickly sear the beef and reduce the black pepper sauce.',
        duration: 10,
        station: 'Hot kitchen',
      },
      {
        id: 3,
        title: 'Assemble',
        description: 'Mix the pasta with the beef sauce and plate it.',
        duration: 4,
        station: 'Pickup counter',
      },
    ],
  },
  'demo-caesar-salad': {
    ...mockDishes[2],
    description: 'Built for light-meal lines with standardized prep and cold chain stability.',
    ingredients: [
      { ingredientId: 'chicken-breast', quantity: 100, unit: 'g', wasteRate: 0.05 },
      { ingredientId: 'lettuce', quantity: 80, unit: 'g', wasteRate: 0.1 },
      { ingredientId: 'caesar-dressing', quantity: 25, unit: 'ml', wasteRate: 0.02 },
    ],
    steps: [
      {
        id: 1,
        title: 'Cut',
        description: 'Wash and drain the lettuce, then slice the chicken breast.',
        duration: 6,
        station: 'Cold kitchen',
      },
      {
        id: 2,
        title: 'Toss',
        description: 'Add the dressing using the standard ratio and mix gently.',
        duration: 4,
        station: 'Cold kitchen',
      },
      {
        id: 3,
        title: 'Serve',
        description: 'Check the portion and plating before sending it out.',
        duration: 2,
        station: 'Pickup counter',
      },
    ],
  },
};

export function getMockDishDetail(id: string | undefined): DishDetail {
  if (id && mockDishDetails[id]) {
    return mockDishDetails[id];
  }

  return mockDishDetails['demo-braised-chicken-rice'];
}

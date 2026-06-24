export function calculateIngredientCost(unitCost: number, quantity: number, wasteRate = 0) {
  return Number((unitCost * quantity * (1 + wasteRate)).toFixed(2));
}

/** Estimate gross margin based on ingredient cost and store price per liang */
export function estimateGrossMargin(ingredientCost: number, pricePerLiang: number, servingLiangWeight = 2.5) {
  if (pricePerLiang <= 0 || ingredientCost <= 0) return 0.5;
  const revenue = pricePerLiang * servingLiangWeight;
  return Math.min(Math.max(1 - ingredientCost / revenue, 0.05), 0.95);
}

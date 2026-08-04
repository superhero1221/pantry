/**
 * Food composition, so a calorie count is computed rather than guessed.
 *
 * Every `per` block in the cookbook used to be written by hand next to the
 * recipe. Hand-written numbers drift: a review of the original fourteen found
 * nine of them understating energy by twenty to thirty-five per cent, always in
 * the same direction, because the oil and the cheese are the easy things to
 * forget when you are eyeballing a total. A number nobody can recompute is a
 * number nobody can correct.
 *
 * So `per` and `micro` are no longer authored. They are derived from `items`
 * by `scripts/nutrition.mjs`, and `nutrition.test.ts` fails the build if the
 * cookbook and this table disagree. Adding a recipe means listing what goes in
 * it; the energy follows.
 *
 * WHAT THESE NUMBERS ARE. Typical published values for the raw ingredient per
 * 100 g of edible matter, rounded, drawn from the kind of food composition
 * tables supermarkets and government datasets publish (USDA FoodData Central,
 * McCance and Widdowson). They are not measurements of the specific product you
 * will buy. Brands vary, a tin drains differently every time, and a "medium
 * onion" is a range rather than a weight. Treat the output as a good estimate
 * with an honest method behind it, which is all a recipe app can offer and more
 * than most do.
 *
 * Columns, in order:
 *   kcal, protein g, carbohydrate g, fat g, fibre g, iron mg, calcium mg,
 *   vitamin B12 µg, vitamin C mg, salt g          — all per 100 g edible.
 *
 * Dry goods are dry. Rice, pasta, lentils and noodles are listed as they are
 * bought and as the recipe weighs them, before they take on water. Cooked
 * values would be roughly a third of these and using them by mistake is the
 * single easiest way to publish a recipe that claims to be a diet meal.
 */

/** kcal, protein, carb, fat, fibre, iron, calcium, B12, vitC, salt — per 100 g. */
export const FOODS = {
  // ---- Grains, flours and starches (dry as sold) -------------------------
  'Basmati rice': [349, 7.5, 78, 0.9, 1.3, 0.8, 10, 0, 0, 0.01],
  'Long grain rice': [349, 7.3, 78, 1, 1.4, 0.8, 9, 0, 0, 0.01],
  'Brown rice': [356, 7.9, 73, 2.8, 3.5, 1.5, 23, 0, 0, 0.01],
  'Arborio rice': [349, 7, 79, 0.6, 1.4, 1.2, 10, 0, 0, 0.01],
  'Sushi rice': [349, 6.6, 79, 0.6, 1.1, 0.8, 8, 0, 0, 0.01],
  Pasta: [371, 13, 75, 1.5, 3.2, 1.3, 21, 0, 0, 0.01],
  Spaghetti: [371, 13, 75, 1.5, 3.2, 1.3, 21, 0, 0, 0.01],
  Macaroni: [371, 13, 75, 1.5, 3.2, 1.3, 21, 0, 0, 0.01],
  'Lasagne sheets': [371, 13, 75, 1.5, 3.2, 1.3, 21, 0, 0, 0.01],
  'Rice noodles': [364, 6, 82, 0.6, 1.6, 0.7, 18, 0, 0, 0.05],
  'Egg noodles': [384, 14, 71, 4.4, 3.3, 3.1, 35, 0.1, 0, 0.4],
  'Udon noodles': [270, 8, 56, 0.8, 2.4, 0.9, 18, 0, 0, 0.6],
  'Soba noodles': [336, 14, 71, 0.7, 3.5, 2.2, 24, 0, 0, 0.9],
  Couscous: [376, 13, 77, 0.6, 5, 1.1, 24, 0, 0, 0.02],
  'Bulgur wheat': [342, 12, 76, 1.3, 12.5, 2.5, 35, 0, 0, 0.02],
  Quinoa: [368, 14, 64, 6, 7, 4.6, 47, 0, 0, 0.01],
  Oats: [379, 13, 67, 7, 10, 4.2, 52, 0, 0, 0.01],
  'Plain flour': [341, 10, 72, 1.2, 2.7, 1.2, 15, 0, 0, 0.01],
  'Gram flour': [387, 22, 58, 6.7, 11, 4.9, 45, 0, 0, 0.06],
  Cornflour: [381, 0.3, 91, 0.1, 0.9, 0.5, 2, 0, 0, 0.02],
  Polenta: [362, 8, 79, 1.8, 3.9, 1.1, 7, 0, 0, 0.01],
  Semolina: [360, 12, 73, 1.1, 3.9, 1.2, 17, 0, 0, 0.01],
  Bread: [265, 9, 49, 3.2, 2.7, 2.4, 150, 0, 0, 1.1],
  Sourdough: [270, 9.5, 52, 2, 2.9, 2.5, 90, 0, 0, 1.2],
  'Corn tortillas': [218, 5.7, 45, 2.9, 5.2, 1.2, 81, 0, 0, 0.11],
  'Flour tortillas': [306, 8, 51, 7.7, 3, 3.2, 100, 0, 0, 1.2],
  Flatbread: [290, 9, 50, 5.5, 2.4, 2.6, 80, 0, 0, 1.1],
  'Pitta bread': [275, 9, 55, 1.2, 2.2, 2.4, 86, 0, 0, 1.1],
  'Burger buns': [279, 9.5, 50, 4, 2.3, 2.9, 110, 0, 0, 1.1],
  Breadcrumbs: [350, 12, 66, 4, 4, 3.4, 130, 0, 0, 1.6],
  'Filo pastry': [312, 8, 53, 7, 1.9, 2.5, 20, 0, 0, 1.2],
  'Puff pastry': [381, 5.2, 33, 25, 1.3, 1.4, 12, 0, 0, 0.8],
  'Wonton wrappers': [291, 9.9, 59, 1.5, 1.8, 3.5, 32, 0, 0, 1.2],
  Potatoes: [77, 2, 17, 0.1, 2.2, 0.8, 12, 0, 19, 0.01],
  'Sweet potato': [86, 1.6, 20, 0.05, 3, 0.6, 30, 0, 2.4, 0.05],

  // ---- Pulses -----------------------------------------------------------
  'Red lentils': [352, 25, 60, 1.1, 11, 7.5, 35, 0, 0, 0.01],
  'Green lentils': [353, 25, 63, 1, 11, 6.5, 35, 0, 0, 0.01],
  'Chickpeas, tinned': [139, 7.1, 22, 2.6, 6.4, 1.6, 45, 0, 0, 0.5],
  'Black beans, tinned': [114, 7.5, 20, 0.5, 7.5, 1.8, 40, 0, 0, 0.5],
  'Kidney beans, tinned': [112, 7.4, 19, 0.5, 6.9, 1.7, 38, 0, 0, 0.5],
  'Cannellini beans, tinned': [114, 7.2, 20, 0.5, 6.3, 1.9, 60, 0, 0, 0.5],
  'Butter beans, tinned': [106, 6.6, 18, 0.5, 5.8, 1.6, 40, 0, 0, 0.5],
  'Baked beans': [88, 4.8, 15, 0.4, 3.8, 1.4, 45, 0, 0, 0.6],
  'Split peas': [341, 25, 60, 1.2, 26, 4.4, 55, 0, 0, 0.02],
  'Black eyed beans': [336, 24, 60, 1.3, 11, 8.3, 110, 0, 0, 0.04],
  'Firm tofu': [144, 16, 3, 8, 2.3, 2.7, 350, 0, 0, 0.02],
  'Silken tofu': [55, 5.5, 2, 2.7, 0.2, 1, 30, 0, 0, 0.01],
  Tempeh: [193, 19, 9, 11, 6, 2.7, 111, 0.1, 0, 0.02],
  'Soya mince': [345, 50, 33, 1.5, 18, 9, 240, 0, 0, 0.1],

  // ---- Vegetables -------------------------------------------------------
  Onion: [40, 1.1, 9, 0.1, 1.7, 0.2, 23, 0, 7.4, 0.01],
  'Red onion': [40, 1.1, 9, 0.1, 1.7, 0.2, 23, 0, 7.4, 0.01],
  'Spring onions': [32, 1.8, 7, 0.2, 2.6, 1.5, 72, 0, 18.8, 0.02],
  Shallots: [72, 2.5, 17, 0.1, 3.2, 1.2, 37, 0, 8, 0.01],
  Garlic: [149, 6.4, 33, 0.5, 2.1, 1.7, 181, 0, 31, 0.04],
  'Fresh ginger': [80, 1.8, 18, 0.8, 2, 0.6, 16, 0, 5, 0.03],
  Carrot: [41, 0.9, 10, 0.2, 2.8, 0.3, 33, 0, 5.9, 0.17],
  Celery: [16, 0.7, 3, 0.2, 1.6, 0.2, 40, 0, 3.1, 0.2],
  'Red pepper': [31, 1, 6, 0.3, 2.1, 0.4, 7, 0, 128, 0.01],
  'Green pepper': [20, 0.9, 4.6, 0.2, 1.7, 0.3, 10, 0, 80, 0.01],
  Tomatoes: [18, 0.9, 3.9, 0.2, 1.2, 0.3, 10, 0, 14, 0.01],
  'Cherry tomatoes': [18, 0.9, 3.9, 0.2, 1.2, 0.3, 10, 0, 14, 0.01],
  Cucumber: [15, 0.7, 3.6, 0.1, 0.5, 0.3, 16, 0, 2.8, 0.01],
  Courgette: [17, 1.2, 3.1, 0.3, 1, 0.4, 16, 0, 17.9, 0.01],
  Aubergine: [25, 1, 5.9, 0.2, 3, 0.2, 9, 0, 2.2, 0.01],
  Mushrooms: [22, 3.1, 3.3, 0.3, 1, 0.5, 3, 0.04, 2.1, 0.01],
  Spinach: [23, 2.9, 3.6, 0.4, 2.2, 2.7, 99, 0, 28, 0.19],
  Kale: [49, 4.3, 9, 0.9, 3.6, 1.5, 150, 0, 120, 0.09],
  Broccoli: [34, 2.8, 7, 0.4, 2.6, 0.7, 47, 0, 89, 0.08],
  'Tenderstem broccoli': [35, 3.4, 5, 0.4, 3.1, 0.9, 55, 0, 85, 0.06],
  Cauliflower: [25, 1.9, 5, 0.3, 2, 0.4, 22, 0, 48, 0.07],
  'Green beans': [31, 1.8, 7, 0.2, 3.4, 1, 37, 0, 12.2, 0.01],
  Peas: [81, 5.4, 14, 0.4, 5.7, 1.5, 25, 0, 40, 0.01],
  Beansprouts: [30, 3, 5.9, 0.2, 1.8, 0.9, 13, 0, 13.2, 0.01],
  'Pak choi': [13, 1.5, 2.2, 0.2, 1, 0.8, 105, 0, 45, 0.06],
  Cabbage: [25, 1.3, 6, 0.1, 2.5, 0.5, 40, 0, 36.6, 0.02],
  'White cabbage': [25, 1.3, 6, 0.1, 2.5, 0.5, 40, 0, 36.6, 0.02],
  'Chinese leaf': [16, 1.2, 3.2, 0.2, 1.2, 0.3, 77, 0, 27, 0.02],
  Leek: [61, 1.5, 14, 0.3, 1.8, 2.1, 59, 0, 12, 0.02],
  Sweetcorn: [86, 3.3, 19, 1.4, 2, 0.5, 2, 0, 6.8, 0.03],
  'Butternut squash': [45, 1, 12, 0.1, 2, 0.7, 48, 0, 21, 0.01],
  Pumpkin: [26, 1, 6.5, 0.1, 0.5, 0.8, 21, 0, 9, 0.01],
  Beetroot: [43, 1.6, 10, 0.2, 2.8, 0.8, 16, 0, 4.9, 0.19],
  Okra: [33, 1.9, 7, 0.2, 3.2, 0.6, 82, 0, 23, 0.02],
  Plantain: [122, 1.3, 32, 0.4, 2.3, 0.6, 3, 0, 18.4, 0.01],
  Avocado: [160, 2, 9, 15, 6.7, 0.6, 12, 0, 10, 0.02],
  Olives: [145, 1, 3.8, 15, 3.3, 3.3, 88, 0, 0, 3.3],
  'Sun dried tomatoes': [258, 14, 56, 3, 12, 9.1, 110, 0, 39, 5],
  Lettuce: [15, 1.4, 2.9, 0.2, 1.3, 0.9, 36, 0, 9.2, 0.03],
  Radish: [16, 0.7, 3.4, 0.1, 1.6, 0.3, 25, 0, 14.8, 0.04],
  Asparagus: [20, 2.2, 3.9, 0.1, 2.1, 2.1, 24, 0, 5.6, 0.01],

  // ---- Chillies and fresh herbs -----------------------------------------
  'Red chilli': [40, 1.9, 9, 0.4, 1.5, 1, 14, 0, 144, 0.01],
  'Green chilli': [40, 1.9, 9, 0.4, 1.5, 1, 14, 0, 144, 0.01],
  'Scotch bonnet': [40, 1.9, 9, 0.4, 1.5, 1, 14, 0, 144, 0.01],
  'Habanero chilli': [40, 1.9, 9, 0.4, 1.5, 1, 14, 0, 144, 0.01],
  'Fresh coriander': [23, 2.1, 3.7, 0.5, 2.8, 1.8, 67, 0, 27, 0.11],
  Parsley: [36, 3, 6.3, 0.8, 3.3, 6.2, 138, 0, 133, 0.06],
  Basil: [23, 3.2, 2.7, 0.6, 1.6, 3.2, 177, 0, 18, 0.01],
  'Thai basil': [23, 3.2, 2.7, 0.6, 1.6, 3.2, 177, 0, 18, 0.01],
  Mint: [44, 3.3, 8.4, 0.7, 6.8, 5.1, 199, 0, 31.8, 0.03],
  Dill: [43, 3.5, 7, 1.1, 2.1, 6.6, 208, 0, 85, 0.06],
  Chives: [30, 3.3, 4.4, 0.7, 2.5, 1.6, 92, 0, 58, 0.01],
  'Lemongrass': [99, 1.8, 25, 0.5, 0.2, 8.2, 65, 0, 2.6, 0.01],
  'Curry leaves': [108, 6, 19, 1, 6.4, 0.9, 830, 0, 4, 0.01],
  'Kaffir lime leaves': [60, 3, 13, 0.8, 5, 1.5, 100, 0, 20, 0.01],

  // ---- Fruit ------------------------------------------------------------
  Lemon: [29, 1.1, 9, 0.3, 2.8, 0.6, 26, 0, 53, 0.01],
  Lime: [30, 0.7, 11, 0.2, 2.8, 0.6, 33, 0, 29, 0.01],
  Mango: [60, 0.8, 15, 0.4, 1.6, 0.2, 11, 0, 36.4, 0.01],
  Pineapple: [50, 0.5, 13, 0.1, 1.4, 0.3, 13, 0, 47.8, 0.01],
  Banana: [89, 1.1, 23, 0.3, 2.6, 0.3, 5, 0, 8.7, 0.01],
  Apple: [52, 0.3, 14, 0.2, 2.4, 0.1, 6, 0, 4.6, 0.01],
  Orange: [47, 0.9, 12, 0.1, 2.4, 0.1, 40, 0, 53, 0.01],
  Pomegranate: [83, 1.7, 19, 1.2, 4, 0.3, 10, 0, 10.2, 0.01],
  Dates: [277, 1.8, 75, 0.2, 6.7, 0.9, 39, 0, 0.4, 0.01],
  Raisins: [299, 3.1, 79, 0.5, 3.7, 1.9, 50, 0, 2.3, 0.03],
  'Dried apricots': [241, 3.4, 63, 0.5, 7.3, 2.7, 55, 0, 1, 0.03],

  // ---- Meat and poultry (raw, edible portion) ---------------------------
  'Chicken breast': [106, 24, 0, 1.2, 0, 0.4, 5, 0.3, 0, 0.15],
  'Chicken thighs': [177, 19, 0, 11, 0, 0.9, 8, 0.5, 0, 0.16],
  'Chicken wings': [186, 17.5, 0, 12.4, 0, 0.9, 10, 0.4, 0, 0.19],
  'Chicken mince': [143, 20, 0, 6.9, 0, 0.8, 8, 0.4, 0, 0.16],
  'Beef mince': [217, 19, 0, 15, 0, 2.2, 12, 2.1, 0, 0.18],
  'Beef brisket': [206, 20, 0, 14, 0, 2.1, 11, 2.5, 0, 0.18],
  'Beef steak': [158, 22, 0, 7.6, 0, 2.4, 8, 2.2, 0, 0.14],
  'Beef bones': [80, 8, 0, 5, 0, 1.5, 20, 1, 0, 0.1],
  'Lamb mince': [235, 18, 0, 18, 0, 1.7, 15, 2.6, 0, 0.18],
  'Lamb shoulder': [235, 18, 0, 18, 0, 1.7, 15, 2.6, 0, 0.18],
  'Pork mince': [218, 19, 0, 16, 0, 0.9, 14, 0.7, 0, 0.16],
  'Pork shoulder': [211, 19, 0, 15, 0, 0.9, 14, 0.7, 0, 0.16],
  'Pork belly': [518, 9.3, 0, 53, 0, 0.5, 5, 0.5, 0, 0.15],
  Bacon: [316, 21, 0.5, 25, 0, 0.7, 8, 0.7, 0, 3.5],
  Guanciale: [450, 15, 0, 43, 0, 0.8, 8, 0.6, 0, 3.2],
  Pancetta: [393, 20, 0.5, 35, 0, 0.9, 9, 0.7, 0, 3.6],
  Chorizo: [455, 24, 1.9, 38, 0, 1.4, 12, 1.9, 0, 3.6],
  Sausages: [301, 12, 9, 24, 0.8, 1, 30, 0.9, 0, 1.9],
  Ham: [145, 21, 1.5, 6, 0, 0.9, 8, 0.6, 0, 3.2],

  // ---- Fish and seafood (raw, edible portion) ---------------------------
  'Raw prawns, peeled': [76, 17, 0.2, 0.6, 0, 0.5, 52, 1.1, 0, 0.5],
  Salmon: [208, 20, 0, 13, 0, 0.3, 12, 3.2, 0, 0.12],
  'Cod fillet': [82, 18, 0, 0.7, 0, 0.4, 16, 0.9, 1, 0.19],
  'White fish fillet': [82, 18, 0, 0.7, 0, 0.4, 16, 0.9, 1, 0.19],
  Mackerel: [205, 19, 0, 14, 0, 1.6, 12, 8.7, 0.4, 0.23],
  'Tuna in spring water': [109, 25, 0, 0.8, 0, 1.3, 11, 2.2, 0, 0.8],
  Sardines: [208, 25, 0, 11, 0, 2.9, 382, 8.9, 0, 1.5],
  Anchovies: [210, 29, 0, 9.7, 0, 4.6, 232, 0.6, 0, 3.5],
  Squid: [92, 16, 3.1, 1.4, 0, 0.7, 32, 1.3, 4.7, 0.11],
  Mussels: [86, 12, 3.7, 2.2, 0, 4, 26, 12, 8, 0.7],

  // ---- Dairy and eggs ---------------------------------------------------
  Eggs: [143, 13, 0.7, 9.5, 0, 1.8, 56, 1.1, 0, 0.35],
  Milk: [64, 3.4, 4.7, 3.6, 0, 0.03, 120, 0.4, 0, 0.1],
  'Whole milk': [64, 3.4, 4.7, 3.6, 0, 0.03, 120, 0.4, 0, 0.1],
  Yoghurt: [61, 3.5, 4.7, 3.3, 0, 0.05, 121, 0.4, 0.5, 0.13],
  'Greek yoghurt': [97, 9, 4, 5, 0, 0.04, 100, 0.5, 0, 0.13],
  'Double cream': [449, 1.7, 2.7, 48, 0, 0.03, 50, 0.2, 0, 0.05],
  'Single cream': [198, 2.6, 4, 19, 0, 0.03, 91, 0.3, 0, 0.08],
  'Soured cream': [198, 2.4, 4.6, 19, 0, 0.06, 101, 0.3, 0.9, 0.08],
  'Creme fraiche': [292, 2.4, 3, 30, 0, 0.04, 80, 0.3, 0, 0.06],
  Butter: [744, 0.9, 0.6, 82, 0, 0.02, 24, 0.2, 0, 1.3],
  Ghee: [899, 0.3, 0, 100, 0, 0, 4, 0.1, 0, 0.01],
  Cheddar: [416, 25, 0.1, 35, 0, 0.3, 739, 1.1, 0, 1.8],
  'Mature cheddar': [416, 25, 0.1, 35, 0, 0.3, 739, 1.1, 0, 1.8],
  Mozzarella: [280, 19, 2.2, 22, 0, 0.2, 505, 0.7, 0, 1.3],
  Parmesan: [402, 36, 3.2, 28, 0, 0.8, 1180, 1.2, 0, 1.6],
  'Pecorino Romano': [419, 32, 3.6, 31, 0, 0.4, 1160, 1.4, 0, 4.1],
  Feta: [264, 14, 4.1, 21, 0, 0.7, 493, 1.7, 0, 3],
  Halloumi: [321, 22, 2.4, 25, 0, 0.4, 700, 1.2, 0, 2.7],
  'Cream cheese': [342, 6, 4.1, 34, 0, 0.1, 98, 0.2, 0, 0.8],
  Paneer: [296, 18, 3.6, 23, 0, 0.2, 480, 0.9, 0, 0.05],
  'Coconut milk': [197, 2, 2.8, 21, 0, 1.6, 16, 0, 1, 0.03],
  'Coconut cream': [330, 3.6, 6.7, 35, 0, 2.5, 11, 0, 1, 0.03],

  // ---- Fats, oils, nuts and seeds ---------------------------------------
  'Olive oil': [899, 0, 0, 100, 0, 0.06, 1, 0, 0, 0.01],
  'Vegetable oil': [899, 0, 0, 100, 0, 0, 0, 0, 0, 0.01],
  'Sesame oil': [899, 0, 0, 100, 0, 0.06, 0, 0, 0, 0.01],
  'Coconut oil': [899, 0, 0, 100, 0, 0.05, 1, 0, 0, 0.01],
  'Roasted peanuts': [599, 26, 16, 49, 8.5, 2.3, 62, 0, 0, 0.01],
  'Peanut butter': [588, 25, 20, 50, 6, 1.9, 43, 0, 0, 1.1],
  Cashews: [553, 18, 30, 44, 3.3, 6.7, 37, 0, 0.5, 0.03],
  Almonds: [579, 21, 22, 50, 12.5, 3.7, 269, 0, 0, 0.01],
  Walnuts: [654, 15, 14, 65, 6.7, 2.9, 98, 0, 1.3, 0.01],
  Pistachios: [560, 20, 28, 45, 10.6, 3.9, 105, 0, 5.6, 0.01],
  'Pine nuts': [673, 14, 13, 68, 3.7, 5.5, 16, 0, 0.8, 0.01],
  'Sesame seeds': [573, 18, 23, 50, 11.8, 14.6, 975, 0, 0, 0.03],
  Tahini: [595, 17, 21, 54, 9.3, 8.9, 426, 0, 0, 0.03],
  'Pumpkin seeds': [559, 30, 11, 49, 6, 8.8, 46, 0, 1.9, 0.02],
  'Sunflower seeds': [584, 21, 20, 51, 8.6, 5.2, 78, 0, 1.4, 0.02],
  'Desiccated coconut': [604, 6.9, 24, 65, 16, 3.3, 26, 0, 1.5, 0.09],

  // ---- Tinned, jarred and preserved -------------------------------------
  'Tinned tomatoes': [32, 1.6, 5.6, 0.3, 1.3, 0.9, 32, 0, 9, 0.05],
  'Chopped tomatoes': [32, 1.6, 5.6, 0.3, 1.3, 0.9, 32, 0, 9, 0.05],
  Passata: [35, 1.5, 6.5, 0.2, 1.4, 1, 20, 0, 11, 0.05],
  'Tomato puree': [82, 4.3, 15, 0.5, 3.3, 2.9, 36, 0, 22, 0.15],
  'Coconut milk, tinned': [197, 2, 2.8, 21, 0, 1.6, 16, 0, 1, 0.03],
  Gherkins: [14, 0.6, 2.3, 0.2, 1.2, 0.4, 26, 0, 1, 3],
  Capers: [23, 2.4, 4.9, 0.9, 3.2, 1.7, 40, 0, 4.3, 6.5],
  Kimchi: [23, 1.6, 4, 0.5, 1.6, 0.5, 33, 0, 15, 1.9],

  // ---- Sauces, condiments, stock ----------------------------------------
  'Soy sauce': [53, 8, 4.9, 0.6, 0.8, 1.9, 33, 0, 0, 14.5],
  'Dark soy sauce': [53, 8, 4.9, 0.6, 0.8, 1.9, 33, 0, 0, 15.5],
  'Fish sauce': [35, 5.1, 3.6, 0, 0, 0.8, 43, 0, 0, 19.5],
  'Oyster sauce': [51, 1.4, 11, 0.3, 0.3, 0.2, 32, 0, 0, 10.9],
  'Tamarind paste': [239, 2.8, 63, 0.6, 5.1, 2.8, 74, 0, 3.5, 0.07],
  'Miso paste': [199, 12, 26, 6, 5.4, 2.5, 57, 0.1, 0, 10.5],
  'Gochujang': [214, 5.5, 45, 1.6, 3.9, 1.5, 30, 0, 1, 6.9],
  'Tomato ketchup': [102, 1.3, 26, 0.1, 0.3, 0.4, 15, 0, 4.1, 2.5],
  'Worcestershire sauce': [78, 0, 19, 0, 0, 0.9, 107, 0, 13, 2.8],
  'Hot sauce': [11, 0.5, 1.8, 0.4, 0.3, 0.3, 9, 0, 13, 5.7],
  'Sriracha': [93, 1.9, 19, 0.9, 2.2, 1.6, 18, 0, 12, 5.1],
  Mayonnaise: [680, 1.1, 1.3, 75, 0, 0.2, 8, 0.1, 0, 1.1],
  'Dijon mustard': [66, 4, 5.8, 3.4, 4, 1.9, 58, 0, 0.3, 5.3],
  'Rice vinegar': [18, 0, 0.5, 0, 0, 0, 1, 0, 0, 0.01],
  'White wine vinegar': [18, 0, 0.4, 0, 0, 0.1, 6, 0, 0, 0.01],
  'Balsamic vinegar': [88, 0.5, 17, 0, 0, 0.7, 27, 0, 0, 0.06],
  'Stock cube': [230, 12, 22, 11, 0.5, 1.5, 90, 0, 0, 47],
  'Vegetable stock': [4, 0.2, 0.6, 0.1, 0, 0.05, 3, 0, 0, 0.7],
  'Chicken stock': [7, 0.9, 0.5, 0.2, 0, 0.05, 4, 0, 0, 0.7],
  'Red wine': [85, 0.1, 2.6, 0, 0, 0.5, 8, 0, 0, 0.01],
  'White wine': [82, 0.1, 2.6, 0, 0, 0.3, 9, 0, 0, 0.01],
  Mirin: [258, 0.2, 43, 0, 0, 0, 2, 0, 0, 0.01],

  // ---- Sweeteners -------------------------------------------------------
  Sugar: [400, 0, 100, 0, 0, 0.05, 1, 0, 0, 0.01],
  'Brown sugar': [380, 0, 98, 0, 0, 0.7, 83, 0, 0, 0.03],
  Honey: [304, 0.3, 82, 0, 0.2, 0.4, 6, 0, 0.5, 0.01],
  'Maple syrup': [260, 0, 67, 0.1, 0, 0.1, 102, 0, 0, 0.03],
  'Palm sugar': [375, 0, 94, 0, 0, 2, 8, 0, 0, 0.02],

  // ---- Dried spices and baking ------------------------------------------
  Salt: [0, 0, 0, 0, 0, 0.3, 24, 0, 0, 100],
  'Black pepper': [251, 10, 64, 3.3, 25, 9.7, 443, 0, 0, 0.05],
  'Black peppercorns': [251, 10, 64, 3.3, 25, 9.7, 443, 0, 0, 0.05],
  'Ground cumin': [375, 18, 44, 22, 11, 66, 931, 0, 7.7, 0.17],
  'Cumin seeds': [375, 18, 44, 22, 11, 66, 931, 0, 7.7, 0.17],
  'Coriander seeds': [298, 12, 55, 18, 42, 16, 709, 0, 21, 0.09],
  'Ground coriander': [298, 12, 55, 18, 42, 16, 709, 0, 21, 0.09],
  Turmeric: [312, 9.7, 67, 3.2, 22, 55, 168, 0, 0.7, 0.07],
  'Garam masala': [379, 15, 45, 15, 24, 24, 640, 0, 3, 0.1],
  'Curry powder': [325, 14, 56, 14, 33, 29, 478, 0, 11, 0.15],
  'Chilli powder': [282, 14, 50, 14, 35, 17, 330, 0, 65, 1.6],
  'Kashmiri chilli': [282, 14, 50, 14, 35, 17, 330, 0, 65, 0.2],
  'Smoked paprika': [282, 14, 54, 13, 35, 21, 229, 0, 0.9, 0.17],
  Paprika: [282, 14, 54, 13, 35, 21, 229, 0, 0.9, 0.17],
  Cinnamon: [247, 4, 81, 1.2, 53, 8.3, 1002, 0, 3.8, 0.03],
  'Cinnamon stick': [247, 4, 81, 1.2, 53, 8.3, 1002, 0, 3.8, 0.03],
  Cloves: [274, 6, 66, 13, 34, 12, 632, 0, 0.2, 0.07],
  Cardamom: [311, 11, 68, 6.7, 28, 14, 383, 0, 21, 0.05],
  'Star anise': [337, 18, 50, 16, 15, 37, 646, 0, 21, 0.16],
  Nutmeg: [525, 6, 49, 36, 21, 3, 184, 0, 3, 0.04],
  'Fennel seeds': [345, 16, 52, 15, 40, 19, 1196, 0, 21, 0.09],
  'Mustard seeds': [508, 26, 28, 36, 12, 9.2, 266, 0, 3, 0.02],
  'Dried oregano': [265, 9, 69, 4.3, 42, 37, 1597, 0, 2.3, 0.06],
  'Dried thyme': [276, 9.1, 64, 7.4, 37, 124, 1890, 0, 50, 0.14],
  'Dried mixed herbs': [270, 9, 66, 6, 40, 60, 1700, 0, 20, 0.1],
  'Bay leaves': [313, 7.6, 75, 8.4, 26, 43, 834, 0, 46.5, 0.06],
  'Dried red chillies': [324, 12, 57, 17, 27, 15, 148, 0, 76, 0.08],
  'Dried fenugreek leaf': [323, 23, 58, 6.4, 25, 34, 395, 0, 3, 0.07],
  'Ground ginger': [335, 9, 72, 4.2, 14, 20, 114, 0, 0.7, 0.07],
  'Garlic powder': [331, 17, 73, 0.7, 9, 5.7, 79, 0, 1.2, 0.06],
  'Onion powder': [341, 10, 79, 1, 15, 3.2, 384, 0, 3.8, 0.07],
  'Baking powder': [53, 0, 28, 0, 0.2, 1.1, 5876, 0, 0, 27],
  'Bicarbonate of soda': [0, 0, 0, 0, 0, 0, 0, 0, 0, 68],
  'Dried yeast': [325, 40, 41, 7.6, 27, 2.2, 30, 0.1, 0.3, 0.13],
  'Vanilla extract': [288, 0.1, 13, 0.1, 0, 0.1, 11, 0, 0, 0.02],
  'Saffron': [310, 11, 65, 5.8, 3.9, 11, 111, 0, 81, 0.15],
  'Sumac': [325, 7, 68, 7, 30, 15, 300, 0, 15, 0.1],
  "Za'atar": [335, 12, 52, 10, 28, 40, 800, 0, 20, 1.5],
  'Berbere': [320, 13, 55, 9, 30, 25, 400, 0, 30, 2],
  'Chinese five spice': [340, 8, 64, 8, 30, 30, 700, 0, 10, 0.1],
  'Cajun seasoning': [300, 11, 55, 8, 25, 25, 500, 0, 10, 12],
  'Italian seasoning': [270, 9, 66, 6, 40, 60, 1700, 0, 20, 0.1],
  'Ras el hanout': [330, 12, 55, 10, 28, 30, 600, 0, 15, 0.5],
  'Jerk seasoning': [290, 10, 50, 7, 22, 20, 400, 0, 20, 14],

  // ---- Added with the cookbook expansion --------------------------------
  'Fresh sage': [102, 3.4, 19.4, 4.1, 12.9, 9, 528, 0, 10.4, 0.01],
  'Mustard greens': [27, 2.9, 4.7, 0.4, 3.2, 1.6, 115, 0, 70, 0.05],
  'Toor dal': [335, 22, 63, 1.5, 15, 5.2, 130, 0, 0, 0.02],
  'Urad dal': [325, 25, 59, 1.6, 18, 7.6, 138, 0, 0, 0.02],
  'Rice flour': [360, 6, 80, 1.4, 2.4, 0.35, 10, 0, 0, 0.01],
  'Fenugreek seeds': [323, 23, 58, 6.4, 25, 33.5, 176, 0, 3, 0.07],
  'Sichuan peppercorns': [300, 10, 65, 6, 28, 8.4, 639, 0, 0, 0.05],
  'Chilli bean paste': [160, 9, 15, 8, 4, 3.5, 60, 0, 1, 14],
  'Shaoxing wine': [140, 1.6, 8, 0, 0, 0.3, 8, 0, 0, 0.4],
  'Hoisin sauce': [220, 3.3, 44, 3.4, 2.8, 1, 32, 0, 0.4, 3.6],
  'Chinkiang vinegar': [35, 0.6, 7.5, 0, 0, 0.8, 17, 0, 0, 0.3],
  'Chilli oil': [850, 1, 3, 92, 1.5, 2, 30, 0, 1, 0.5],
  'White pepper': [296, 10.4, 69, 2.1, 26, 14.3, 265, 0, 21, 0.02],
  'Korean rice cakes': [220, 4.2, 50, 0.5, 0.9, 0.4, 12, 0, 0, 0.4],
  'Sweet potato noodles': [348, 0.1, 87, 0.1, 0.6, 0.6, 20, 0, 0, 0.02],
  Gochugaru: [296, 13, 55, 11, 38, 7.8, 130, 0, 100, 0.05],
  Baguette: [265, 9, 52, 2.5, 2.4, 1.8, 55, 0, 0, 1.3],
  'Chipotle paste': [199, 2.5, 12, 16, 5, 2, 40, 0, 5, 3.2],
  'Hominy, tinned': [72, 1.5, 14.3, 0.9, 2.5, 0.6, 10, 0, 0, 0.86],
  'Pomegranate molasses': [265, 0.4, 66, 0.2, 0.5, 1, 20, 0, 1, 0.03],
  'Preserved lemons': [34, 1.1, 9, 0.3, 4.5, 0.6, 60, 0, 25, 6],
  Harissa: [127, 3, 11, 9, 5, 2.2, 40, 0, 15, 3.5],
  'Merguez sausages': [308, 15, 1.5, 27, 0.5, 1.8, 15, 2, 0, 1.9],
  Injera: [151, 5, 33, 0.8, 4, 2.5, 30, 0, 0, 0.3],
  'Egusi seeds': [595, 28.3, 15.3, 47.4, 3, 7.3, 54, 0, 0, 0.02],
  'Red palm oil': [884, 0, 0, 99.9, 0, 0.01, 0, 0, 0, 0.01],

  // ---- Added with the cookbook expansion --------------------------------
  Gruyere: [413, 30, 0.4, 32, 0, 0.2, 1011, 1.6, 0, 1.1],
};

/**
 * Weight in grams of one of the things a recipe counts rather than weighs.
 *
 * A recipe that says "2" onions has to become grams before it can become
 * calories. These are the middle of the range you would actually pick up in a
 * shop — a UK medium onion, a large egg — not a botanical average.
 */
export const UNIT = {
  Onion: 150,
  'Red onion': 130,
  Shallots: 30,
  Eggs: 58,
  Lemon: 90,
  Lime: 65,
  Tomatoes: 110,
  'Cherry tomatoes': 15,
  Carrot: 80,
  Celery: 40,
  'Red pepper': 160,
  'Green pepper': 160,
  Potatoes: 180,
  'Sweet potato': 200,
  Avocado: 150,
  Banana: 120,
  Apple: 150,
  Orange: 140,
  Courgette: 200,
  Aubergine: 250,
  Cucumber: 300,
  'Red chilli': 15,
  'Green chilli': 15,
  'Scotch bonnet': 8,
  'Habanero chilli': 8,
  Garlic: 5,
  'Bay leaves': 0.2,
  'Cinnamon stick': 2.5,
  Cloves: 0.1,
  'Star anise': 1,
  'Dried red chillies': 1.5,
  'Stock cube': 10,
  Bread: 38,
  Sourdough: 45,
  'Corn tortillas': 30,
  'Flour tortillas': 45,
  Flatbread: 90,
  'Pitta bread': 60,
  'Burger buns': 60,
  'Tuna in spring water': 145,
  'Chickpeas, tinned': 400,
  'Black beans, tinned': 400,
  'Kidney beans, tinned': 400,
  'Cannellini beans, tinned': 400,
  'Butter beans, tinned': 400,
  'Tinned tomatoes': 400,
  'Chopped tomatoes': 400,
  'Coconut milk': 400,
  'Kaffir lime leaves': 0.3,
  'Curry leaves': 0.2,
  Lemongrass: 20,
  Plantain: 180,
  Sausages: 60,
  Mussels: 12,
  Baguette: 130,
  'Preserved lemons': 30,
  'Merguez sausages': 60,
  Injera: 90,
  Lettuce: 300,
};

/**
 * The fraction of the listed weight that is actually food.
 *
 * Two different problems wear the same shape. A 400 g tin of chickpeas drains
 * to about 240 g, so the number on the shopping list is not the number that
 * goes on the plate. And 700 g of beef bones for a pho gives up its collagen
 * and almost nothing else — counting it as 700 g of beef would put a fantasy
 * on the nutrition card. Anything absent here is taken at face value.
 */
export const YIELD = {
  'Chickpeas, tinned': 0.6,
  'Black beans, tinned': 0.6,
  'Kidney beans, tinned': 0.6,
  'Cannellini beans, tinned': 0.6,
  'Butter beans, tinned': 0.6,
  'Beef bones': 0.08,
  Mussels: 0.3,
  Lemongrass: 0.4,
  'Bay leaves': 0.05,
  'Cinnamon stick': 0.1,
  'Star anise': 0.1,
  'Curry leaves': 0.3,
  'Kaffir lime leaves': 0.05,
  'Black peppercorns': 0.6,
  'Dried red chillies': 0.5,
};

/**
 * Names that mean the same food.
 *
 * Cupboard matching runs on the ingredient string, so "Onion" and "Onions"
 * being two different things meant owning one did not stop the other appearing
 * on your shopping list. The cookbook is written in canonical names now and
 * this map only exists to catch the ones already out in saved kitchens.
 */
export const ALIAS = {
  Onions: 'Onion',
  'Red onions': 'Red onion',
  Carrots: 'Carrot',
  'Celery sticks': 'Celery',
  'Red peppers': 'Red pepper',
  'Green peppers': 'Green pepper',
  Limes: 'Lime',
  Lemons: 'Lemon',
  Egg: 'Eggs',
  Potato: 'Potatoes',
  Tomato: 'Tomatoes',
  Cumin: 'Ground cumin',
  Coriander: 'Ground coriander',
  Ginger: 'Fresh ginger',
  'Root ginger': 'Fresh ginger',
  Mushroom: 'Mushrooms',
  'Chives or parsley': 'Chives',
  'Spring onion': 'Spring onions',
  'Natural yoghurt': 'Yoghurt',
  'Plain yoghurt': 'Yoghurt',
  Pecorino: 'Pecorino Romano',
  'Parmigiano Reggiano': 'Parmesan',
  'Olive oil, extra virgin': 'Olive oil',
  Aubergines: 'Aubergine',
  Courgettes: 'Courgette',
  Shallot: 'Shallots',
  'Green chillies': 'Green chilli',
  'Red chillies': 'Red chilli',
};

/** EU nutrient reference values — the denominator under every micro row. */
export const NRV = {
  fibre: 30,
  iron: 14,
  calcium: 800,
  b12: 2.5,
  vitc: 80,
  salt: 6,
};

/** Which column of a FOODS row each derived micronutrient reads. */
export const COL = { kcal: 0, protein: 1, carb: 2, fat: 3, fibre: 4, iron: 5, calcium: 6, b12: 7, vitc: 8, salt: 9 };

/** Fixed per nutrient, not per value — the design never ramps these by amount. */
export const MICRO_COLOUR = {
  Fibre: '#8fa073',
  Iron: '#d67f48',
  Calcium: '#8fa073',
  'Vitamin B12': '#d67f48',
  'Vitamin C': '#8fa073',
  Salt: '#c0b6a5',
};

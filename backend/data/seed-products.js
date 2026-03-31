function toSlug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildFragrancePrice(price) {
  return 1800;
}

function buildFragranceDescription(product) {
  const base = product.description || `${product.name} in a matching fragrance mist.`;
  return base
    .replace(/body wash/gi, 'fragrance mist')
    .replace(/lotion/gi, 'fragrance mist')
    .replace(/body cream/gi, 'fragrance mist');
}

const baseProducts = [
  {
    name: 'Princess Belle',
    type: 'Body Wash',
    price: 1800,
    category: 'Body Wash',
    image: 'assets/images/bodywash.jpg',
    description: 'A soft floral body wash inspired by a sweet fairytale finish.',
    notes: ['rose petals', 'golden pear', 'vanilla musk']
  },
  {
    name: 'Cucumber Melon',
    type: 'Body Wash',
    price: 1800,
    category: 'Body Wash',
    image: 'assets/images/bodywash2.jpg',
    description: 'A fresh daily wash with juicy melon and cool cucumber.',
    notes: ['crisp cucumber', 'honeydew melon', 'green apple']
  },
  {
    name: 'At The Beach',
    type: 'Body Wash',
    price: 1800,
    category: 'Body Wash',
    image: 'assets/images/bodywash.jpg',
    description: 'A breezy beachy cleanser with a warm sun-kissed feel.',
    notes: ['toasted coconut', 'saltwater breeze', 'frangipani']
  },
  {
    name: 'Malibu Heat',
    type: 'Body Wash',
    price: 1800,
    category: 'Body Wash',
    image: 'assets/images/bodywash.jpg',
    description: 'A tropical body wash with bright citrus and creamy warmth.',
    notes: ['pineapple nectar', 'sun-kissed coconut', 'vanilla']
  },
  {
    name: 'Twisted Peppermint',
    type: 'Body Wash',
    price: 1800,
    category: 'Body Wash',
    image: 'assets/images/bodywash.jpg',
    description: 'A cool minty body wash with a festive sweet finish.',
    notes: ['peppermint', 'vanilla cream', 'sugared musk']
  },
  {
    name: 'Champange in Paris',
    type: 'Body Wash',
    price: 1800,
    category: 'Body Wash',
    image: 'assets/images/bodywash.jpg',
    description: 'A sparkling wash with fruity sweetness and a polished finish.',
    notes: ['pink champagne', 'berry nectar', 'soft woods']
  },
  {
    name: 'Gingham Legend',
    type: 'Body Wash',
    price: 1800,
    category: 'Body Wash',
    image: 'assets/images/bodywash.jpg',
    description: 'A fresh clean body wash with a bold modern edge.',
    notes: ['citrus zest', 'lavender', 'sandalwood']
  },
  {
    name: 'Paris Amor',
    type: 'Body Wash',
    price: 1800,
    category: 'Body Wash',
    image: 'assets/images/bodywash.jpg',
    description: 'A romantic body wash with sweet florals and soft fruit.',
    notes: ['pink tulip', 'apple blossom', 'vanilla']
  },
  {
    name: 'In The Sun',
    type: 'Body Wash',
    price: 1800,
    category: 'Body Wash',
    image: 'assets/images/bodywash.jpg',
    description: 'A radiant cleanser with bright fruit and warm solar notes.',
    notes: ['mandarin', 'orange blossom', 'sun-warmed musk']
  },
  {
    name: 'Malibu Heat',
    type: 'Lotion',
    price: 1800,
    category: 'Lotion and Body Cream',
    image: 'assets/images/lotion.jpg',
    description: 'A tropical lotion that leaves skin soft and lightly scented.',
    notes: ['pineapple nectar', 'coconut milk', 'vanilla']
  },
  {
    name: 'Bahamas Passion Fruit',
    type: 'Lotion',
    price: 1800,
    category: 'Lotion and Body Cream',
    image: 'assets/images/lotion2.jpg',
    description: 'A juicy island-inspired lotion with a bright tropical finish.',
    notes: ['passion fruit', 'sun-ripened berries', 'golden amber']
  },
  {
    name: 'Firecracker Pop',
    type: 'Lotion',
    price: 1800,
    category: 'Lotion and Body Cream',
    image: 'assets/images/lotion2.jpg',
    description: 'A playful lotion with a sweet icy treat scent.',
    notes: ['red cherry', 'citrus ice', 'sugared berries']
  },
  {
    name: 'Pink Cashmere',
    type: 'Lotion',
    price: 1800,
    category: 'Lotion and Body Cream',
    image: 'assets/images/lotion2.jpg',
    description: 'A smooth comforting lotion with soft floral sweetness.',
    notes: ['pink jasmine', 'cashmere musk', 'creamy sandalwood']
  },
  {
    name: 'Blue Raspberry Burst',
    type: 'Lotion',
    price: 1800,
    category: 'Lotion and Body Cream',
    image: 'assets/images/lotion2.jpg',
    description: 'A bright lotion with a juicy candy-fruit twist.',
    notes: ['blue raspberry', 'sugar crystals', 'soft vanilla']
  },
  {
    name: 'Costa Rica Pink Pimeapple Glaze',
    type: 'Lotion',
    price: 1800,
    category: 'Lotion and Body Cream',
    image: 'assets/images/lotion2.jpg',
    description: 'A tropical lotion with sweet pink pineapple and glossed fruit.',
    notes: ['pink pineapple', 'coconut water', 'glazed nectar']
  },
  {
    name: 'Cucumber Melon',
    type: 'Body Cream',
    price: 1800,
    category: 'Lotion and Body Cream',
    image: 'assets/images/lotion2.jpg',
    description: 'A rich body cream with cool cucumber and ripe melon.',
    notes: ['crisp cucumber', 'melon nectar', 'clean musk']
  },
  {
    name: 'Pearberry',
    type: 'Body Cream',
    price: 1800,
    category: 'Lotion and Body Cream',
    image: 'assets/images/lotion2.jpg',
    description: 'A creamy body cream with bright pear and soft berry sweetness.',
    notes: ['anjou pear', 'wild berries', 'apple blossom']
  },
  {
    name: 'Madam Mystique',
    type: 'Body Cream',
    price: 1800,
    category: 'Lotion and Body Cream',
    image: 'assets/images/lotion2.jpg',
    description: 'A rich body cream with a smooth mysterious floral finish.',
    notes: ['dark berries', 'velvet rose', 'amber musk']
  },
  {
    name: 'Pistachio Glaze',
    type: 'Body Cream',
    price: 1800,
    category: 'Lotion and Body Cream',
    image: 'assets/images/lotion2.jpg',
    description: 'A decadent body cream with a sweet nutty dessert-inspired scent.',
    notes: ['roasted pistachio', 'vanilla glaze', 'whipped cream']
  },
  {
    name: 'Rose Sugar Scrub',
    type: 'Scrub',
    price: 1800,
    category: 'Scrubs',
    image: 'assets/images/scrub.jpg',
    description: 'A polishing scrub with floral sweetness and a silky afterfeel.',
    notes: ['rose water', 'pink sugar', 'white amber']
  },
  {
    name: 'Coconut Body Oil',
    type: 'Oil',
    price: 1800,
    category: 'Oils',
    image: 'assets/images/bodyoil.jpg',
    description: 'A nourishing body oil with a warm coconut glow.',
    notes: ['coconut cream', 'golden vanilla', 'soft musk']
  }
];

const fragranceProducts = baseProducts
  .filter(product => product.category === 'Body Wash' || product.category === 'Lotion and Body Cream')
  .map(product => ({
    name: product.name,
    type: 'Fine Fragrance Mist',
    price: buildFragrancePrice(product.price),
    category: 'Fragrances',
    image: `assets/images/fragrance-${toSlug(product.name)}.jpg`,
    description: buildFragranceDescription(product),
    notes: product.notes
  }));

module.exports = [...baseProducts, ...fragranceProducts];

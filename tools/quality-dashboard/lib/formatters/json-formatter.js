'use strict';

const { starRating } = require('../utils');

function format(data) {
  const cats = data.categories;
  const totalItems = cats.reduce((s, cat) => s + cat.count, 0);
  const overallAvg = totalItems
    ? +(cats.reduce((s, cat) => s + cat.avgScore * cat.count, 0) / totalItems).toFixed(1)
    : 0;

  const output = {
    generated: new Date().toISOString(),
    summary: {
      totalItems,
      overallAvg,
      rating: starRating(overallAvg),
    },
    categories: {},
  };

  for (const cat of cats) {
    output.categories[cat.category.toLowerCase()] = {
      count: cat.count,
      avgScore: cat.avgScore,
      rating: cat.rating,
      items: cat.items,
    };
  }

  if (data.detail) {
    output.detail = data.detail;
  }

  return JSON.stringify(output, null, 2);
}

module.exports = { format };

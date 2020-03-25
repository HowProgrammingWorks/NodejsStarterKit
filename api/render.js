'use strict';

module.exports = async name => {
  const shape = application.db.read('Shape', name);
  if (!shape) return 'Shape is not found';
  const points = [];
  for (const key in shape) {
    const point = shape[key];
    points.push(point);
  }
  const svg = [];
  svg.push('<svg viewBox="-20 -20 40 40" xmlns="http://www.w3.org/2000/svg">');
  svg.push('<polygon points="');
  svg.push(points.map(({ x, y }) => `${x},${y}`).join(' '));
  svg.push('" /></svg>');
  return svg.join('');
};

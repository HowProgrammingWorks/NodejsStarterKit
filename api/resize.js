'use strict';

const resize = (point, k) => {
  let { x, y } = point;
  x *= k;
  y *= k;
  point.x = x;
  point.y = y;
};

module.exports = async (name, k) => {
  const shape = application.db.read('Shape', name);
  if (!shape) return 'Shape is not found';
  for (const key in shape) {
    const point = shape[key];
    resize(point, k);
  }
  return 'Shape rotated';
};

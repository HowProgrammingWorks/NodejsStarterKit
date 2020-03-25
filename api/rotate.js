'use strict';

const rotate = (point, angle) => {
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  const { x, y } = point;
  point.x = x * cos - y * sin;
  point.y = x * sin + y * cos;
};

module.exports = async (name, angle) => {
  const shape = application.db.read('Shape', name);
  if (!shape) return 'Shape is not found';
  for (const key in shape) {
    const point = shape[key];
    rotate(point, angle);
  }
  return 'Shape rotated';
};

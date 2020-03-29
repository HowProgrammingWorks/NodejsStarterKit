'use strict';

const move = (point, x, y) => {
  point.x += x;
  point.y += y;
};

module.exports = async (name, x, y) => {
  const shape = application.state.get(name);
  if (!shape) return 'Shape is not found';
  for (const key in shape) {
    const point = shape[key];
    move(point, x, y);
  }
  return 'Shape moved';
};

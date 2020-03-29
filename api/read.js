'use strict';

module.exports = async name => {
  const shape = application.state.get(name);
  if (!shape) return 'Shape is not found';
  return shape;
};

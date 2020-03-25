'use strict';

module.exports = async name => {
  const shape = application.db.read('Shape', name);
  if (!shape) return 'Shape is not found';
  return shape;
};

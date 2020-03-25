'use strict';

const { Rect } = application.domain;

module.exports = async (name, x1, y1, x2, y2) => {
  const rect = new Rect(x1, y1, x2, y2);
  application.db.save('Shape', name, rect);
  return 'ok';
};

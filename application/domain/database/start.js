(async () => {
  console.debug('Connect to pg');
  domain.database.example = new lib.pg.Database(config.database);
});

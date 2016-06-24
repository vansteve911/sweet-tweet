// define uncaughtException
process.on('uncaughtException', function(err) {
  console.error('Error caught in uncaughtException event:', err);
});
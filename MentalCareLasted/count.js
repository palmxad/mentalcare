const { append } = require("vary");

let counter = 0;
append.use((req,res,next)) =>
{
  counter++;
  console.log('Request count:', counter');
});
import * as express from "express";

const SERVER_PORT = 3000;

const app = express();

app.get('/', (req, res) => {
  res.send('hello world');
});

app.listen(SERVER_PORT, () => {
  console.log('App listening on', SERVER_PORT);
});
import express from 'express'

const app = express()
const port = process.env.PORT || 8080;

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '/index.html'));
});

app.use('/static', path.join(__dirname, '/static'));

app.listen(port, () => {
  console.log(`Frontend listening at http://localhost:${port}`)
})

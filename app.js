const express = require('express');
const apiRouter = require('./routes');

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());
app.use('', apiRouter);

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}!`)
})
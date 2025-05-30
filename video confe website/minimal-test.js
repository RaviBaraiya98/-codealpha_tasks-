const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Test server is working!');
});

const port = 3000;
app.listen(port, () => {
    console.log('Test server is running on port', port);
});

import express from 'express';
console.log('Express imported successfully');

const app = express();
app.listen(3001, () => {
    console.log('Server running on port 3001');
});

const bcrypt = require('bcrypt');

const password = "123456"; // admin ke liye plain password

bcrypt.hash(password, 10, (err, hash) => {
    if (err) throw err;
    console.log("Hashed password:", hash);
});

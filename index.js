const db = require("./config/db");
const express = require("express");
const path = require("path");
const session = require("express-session");
const mainRoutes = require("./routers/mainRoutes");
require("dotenv").config();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

// Session
app.use(session({
    secret: "secretkey",
    resave: false,
    saveUninitialized: false
}));

app.use((req,res,next)=>{
    res.locals.session = req.session;
    next();
});


// Routes
app.use("/", mainRoutes);




const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
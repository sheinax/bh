//server.js


const express = require("express");
const cookieParser = require("cookie-parser"); // Import cookie-parser
require("dotenv").config();
const tenant_router = require("./routes/tenant.route.js");
const admin_router = require("./routes/admin.route.js");


const path = require("path");

const app = express();

app.set("view engine", "ejs"); // Register ejs package
app.use(express.urlencoded({ extended: true })); // Send data using form
app.use(cookieParser()); // Use cookie-parser middleware
app.use(express.static(path.join(__dirname, "public"))); // Register static files
app.use(express.json());

app.use(tenant_router); 
app.use(admin_router); 




app.listen(process.env.PORT, () => {
    console.log("server started!");
});

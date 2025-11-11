require('dotenv').config();
const express = require("express");
const cors = require("cors");   // ✅ Import cors
const bodyParser = require("body-parser");  
const connectDB = require("./utils/db");

const Roles = require("./Routes/RoleRoutes");
const User = require("./Routes/UserRoutes");
const stock=require("./Routes/StockRoutes");
const AuthRoutes = require("./Routes/AuthRoutes");
const statsRoutes = require("./Routes/DashboardRoute");

const Bills = require("./Routes/BillRoutes");
const app = express();
const port = 5008;
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use("/roles", Roles);
app.use("/user", User);
app.use("/stock", stock);
app.use("/bill", Bills);
app.use("/auth", AuthRoutes);
app.use("/stats", statsRoutes);
connectDB().then(() => {
    app.listen(port, () => {
        console.log("Server is running on port:", port);
    });
});

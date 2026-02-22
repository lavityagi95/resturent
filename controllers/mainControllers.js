const db = require("../config/db");
const bcrypt = require("bcrypt");

// ===== Home & Menu =====
exports.homepage = (req,res)=> res.render("home");
exports.menupage = (req,res)=>{
    db.query("SELECT * FROM products", (err, results)=>{
        if(err) throw err;
        res.render("menu", { products: results });
    });
};

// ===== Admin =====
exports.adminLoginPage = (req,res)=> res.render("adminLogin");

exports.adminLogin = (req,res)=>{
    const { email, password } = req.body;
    db.query("SELECT * FROM admin WHERE email = ?", [email], (err, result)=>{
        if(err) throw err;
        if(result.length > 0){
            bcrypt.compare(password, result[0].password, (err, match)=>{
                if(match){
                    req.session.admin = true;
                    res.redirect("/admin/products");
                } else res.send("Incorrect Password");
            });
        } else res.send("Admin not found");
    });
};

exports.adminLogout = (req,res)=>{
    req.session.destroy();
    res.redirect("/admin-login");
};

exports.adminProducts = (req,res)=>{
    db.query("SELECT * FROM products", (err, products)=>{
        if(err) throw err;

        db.query("SELECT COUNT(*) AS totalOrders FROM orders", (err, orderCount)=>{
            if(err) throw err;

            db.query("SELECT COUNT(*) AS totalUsers FROM users", (err, userCount)=>{
                if(err) throw err;

                res.render("admin", { 
                    products,
                    totalOrders: orderCount[0].totalOrders,
                    totalUsers: userCount[0].totalUsers
                });
            });
        });
    });
};


exports.addProduct = (req,res)=>{
    const { name, price, description } = req.body;
    const image = req.file.filename;
    db.query("INSERT INTO products (name, price, description, image) VALUES (?, ?, ?, ?)",
    [name, price, description, image], (err)=>{
        if(err) throw err;
        res.redirect("/admin/products");
    });
};

// ===== User Auth =====
exports.registerPage = (req,res)=> res.render("register");
exports.registerUser = (req,res)=>{
    const { name, email, password } = req.body;
    bcrypt.hash(password, 10, (err, hash)=>{
        if(err) throw err;
        db.query("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", 
        [name, email, hash], (err)=>{
            if(err) throw err;
            res.redirect("/login");
        });
    });
};

exports.loginPage = (req,res)=> res.render("login");
exports.loginUser = (req,res)=>{
    const { email, password } = req.body;

    // 1️⃣ Check Admin First
    db.query("SELECT * FROM admin WHERE email = ?", [email], (err, adminResult)=>{
        if(err) throw err;

        if(adminResult.length > 0){
            // Admin Found
            bcrypt.compare(password, adminResult[0].password, (err, match)=>{
                if(match){
                    req.session.admin = true;
                    req.session.userId = adminResult[0].id;
                    req.session.role = "admin";
                    return res.redirect("/admin/products");
                } else {
                    return res.send("Incorrect Password");
                }
            });
        } else {

            // 2️⃣ Check Normal User
            db.query("SELECT * FROM users WHERE email = ?", [email], (err, userResult)=>{
                if(err) throw err;

                if(userResult.length > 0){
                    bcrypt.compare(password, userResult[0].password, (err, match)=>{
                        if(match){
                            req.session.userId = userResult[0].id;
                            req.session.role = "user";
                            return res.redirect("/menu");
                        } else {
                            return res.send("Incorrect Password");
                        }
                    });
                } else {
                    return res.send("Email not found");
                }
            });

        }
    });
};

exports.logoutUser = (req,res)=>{
    req.session.destroy();
    res.redirect("/login");
};

// ===== Orders =====
exports.placeOrder = (req,res)=>{
    const userId = req.session.userId;
    const { productId, quantity } = req.body;
    db.query("INSERT INTO orders (user_id, product_id, quantity) VALUES (?, ?, ?)",
    [userId, productId, quantity], (err)=>{
        if(err) throw err;
        res.send("Order placed successfully!");
    });
};

exports.userOrders = (req, res) => {

    const userId = req.session.userId;

    const sql = `
    SELECT orders.id, products.name, products.price,
    orders.quantity, orders.status
    FROM orders
    JOIN products ON orders.product_id = products.id
    WHERE orders.user_id = ?
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.log(err);
            return res.send("Error fetching orders");
        }

        res.render("userOrders", { orders: results });
    });
};


exports.adminOrders = (req, res) => {

    if (req.session.role !== "admin") {
        return res.redirect("/");
    }

    const sql = `
    SELECT orders.id, users.name AS userName, products.name AS productName,
    orders.quantity, orders.status
    FROM orders
    JOIN users ON orders.user_id = users.id
    JOIN products ON orders.product_id = products.id
    WHERE orders.admin_deleted = 0
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.log(err);
            return res.send("Error fetching orders");
        }

        res.render("adminOrders", { orders: results });
    });
};



exports.updateOrder = (req,res)=>{
    const { id, status } = req.params;

    db.query("UPDATE orders SET status = ? WHERE id = ?", 
    [status, id], (err)=>{
        if(err) throw err;
        res.redirect("/admin-orders");
    });
};

exports.updateOrderStatus = (req, res) => {

    if (req.session.role !== "admin") {
        return res.redirect("/");
    }

    const orderId = req.params.id;
    const { status } = req.body;

    const query = "UPDATE orders SET status = ? WHERE id = ?";

    db.query(query, [status, orderId], (err) => {
        if (err) {
            console.log(err);
            return res.send("Error updating order");
        }

        res.redirect("/admin-orders");
    });
};


// ====== delete ======
exports.deleteProduct = (req, res) => {
    if (req.session.role !== "admin") {
        return res.redirect("/");
    }

    const productId = req.params.id;

    const query = "DELETE FROM products WHERE id = ?";

    db.query(query, [productId], (err, result) => {
        if (err) {
            console.log(err);
            return res.send("Error deleting product");
        }

        res.redirect("/admin/products");
    });
};

exports.deleteOrder = (req, res) => {

    if (req.session.role !== "admin") {
        return res.redirect("/");
    }

    const orderId = req.params.id;

    const query = "UPDATE orders SET admin_deleted = 1 WHERE id = ?";

    db.query(query, [orderId], (err) => {
        if (err) {
            console.log(err);
            return res.send("Error deleting order");
        }

        res.redirect("/admin-orders");
    });
};



// ====== Cart ======
exports.addToCart = (req,res)=>{
    const { productId, quantity } = req.body;

    if(!req.session.cart){
        req.session.cart = [];
    }

    const cart = req.session.cart;

    const existingProduct = cart.find(item => item.productId == productId);

    if(existingProduct){
        existingProduct.quantity += parseInt(quantity);
    } else {
        cart.push({
            productId,
            quantity: parseInt(quantity)
        });
    }

    res.redirect("/menu");   // 👈 Important change
};

exports.viewCart = (req,res)=>{
    const cart = req.session.cart || [];

    if(cart.length === 0){
        return res.render("cart", { items: [] });
    }

    const ids = cart.map(item => item.productId);

    db.query("SELECT * FROM products WHERE id IN (?)", [ids], (err, products)=>{
        if(err) throw err;

        const cartItems = products.map(product => {
            const cartItem = cart.find(item => item.productId == product.id);
            return {
                ...product,
                quantity: cartItem.quantity
            };
        });

        res.render("cart", { items: cartItems });
    });
};

exports.removeFromCart = (req,res)=>{
    const id = req.params.id;

    req.session.cart = req.session.cart.filter(item => item.productId != id);

    res.redirect("/cart");
};

exports.checkout = (req,res)=>{
    const cart = req.session.cart;
    const userId = req.session.userId;

    if(!cart || cart.length === 0){
        return res.send("Cart is empty");
    }

    cart.forEach(item=>{
        db.query(
            "INSERT INTO orders (user_id, product_id, quantity) VALUES (?, ?, ?)",
            [userId, item.productId, item.quantity]
        );
    });

    req.session.cart = [];
    res.redirect("/menu");
};

exports.AllUsers = (req, res) => {

    if (req.session.role !== "admin") {
        return res.redirect("/");
    }

    const query = "SELECT id, name, email, role FROM users";

    db.query(query, (err, results) => {
        if (err) {
            console.log(err);
            return res.send("Error fetching users");
        }

        res.render("adminUsers", { users: results });
    });
};



exports.loginPage = (req,res)=> res.render("login");

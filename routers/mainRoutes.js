const express = require("express");
const router = express.Router();
const mainControllers = require("../controllers/mainControllers");
const upload = require("../config/multer");
const { isAdmin, isUser } = require("../middleware/auth");

// ====== Home & Menu ======
router.get("/", mainControllers.homepage);
router.get("/menu", mainControllers.menupage);

// ====== Admin ======
router.get("/admin-logout", mainControllers.adminLogout);
router.get("/admin/products", isAdmin, mainControllers.adminProducts);
router.post("/add-product", upload.single("image"), mainControllers.addProduct);

// ====== User Auth ======
router.get("/register", mainControllers.registerPage);
router.post("/register", mainControllers.registerUser);
router.get("/login", mainControllers.loginPage);
router.post("/login", mainControllers.loginUser);
router.get("/logout", mainControllers.logoutUser);
router.get("/admin/users", isAdmin, mainControllers.AllUsers); // ✅ controller name match

// ====== Orders ======
router.post("/place-order", isUser, mainControllers.placeOrder);
router.get("/my-orders", isUser, mainControllers.userOrders);
router.get("/admin-orders", isAdmin, mainControllers.adminOrders);
router.get("/update-order/:id/:status", isAdmin, mainControllers.updateOrder);
router.post("/admin/update-order/:id", isAdmin, mainControllers.updateOrderStatus);

// ====== Delete ======
router.post("/admin/delete-product/:id", isAdmin, mainControllers.deleteProduct);
router.get("/delete-order/:id", isAdmin, mainControllers.deleteOrder);

// ====== Cart ======
router.get("/cart", isUser, mainControllers.viewCart);
router.post("/add-to-cart", isUser, mainControllers.addToCart);
router.get("/remove-from-cart/:id", isUser, mainControllers.removeFromCart);
router.post("/checkout", isUser, mainControllers.checkout);

module.exports = router;
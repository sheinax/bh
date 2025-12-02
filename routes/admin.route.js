

//admin.route.js

const express = require("express");
const admin_Controller = require("../controller/admin.controller.js");


const router = express.Router();

// Admin Routes

router.get("/login", admin_Controller.login_view   ) 
router.get("/register", admin_Controller.register_view )

router.get("/admin/Admindashboard", admin_Controller.Admindashboard_view);
router.get("/admin/usermanagement", admin_Controller.usermanagement_view);
router.get("/admin/message", admin_Controller.message_view);
router.get("/admin/payment", admin_Controller.payment_view);
router.get("/admin/room", admin_Controller.room_view);

router.post("/register-user" , admin_Controller.save_user )
router.post("/login-user" , admin_Controller.login_user )


// Fetch all rooms
router.get("/admin/rooms", admin_Controller.getRooms);

// Add a new room
router.post("/admin/addRoom", admin_Controller.addRoom);


router.get("/admin/getTotalActiveTenants", admin_Controller.getTotalActiveTenants);

// Add new tenant

// (Admin) Add new user
router.post("/admin/addUser", admin_Controller.addUser);

// Edit user
router.get("/admin/editUser/:id", admin_Controller.editUser);
router.post("/admin/editUser/:id", admin_Controller.updateUser);

// Update User route
router.post("/admin/editUser/:id", admin_Controller.updateUser);

module.exports = router;

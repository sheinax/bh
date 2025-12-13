
// admin.controller.js


const { where } = require("sequelize");
const models = require("../models");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");




// Sa Navigation
const Admindashboard_view = async (req, res) => {
    try {
        // Total Balance Deposit from Deposits
        const depositTotalResult = await models.Deposit.sum('balance_deposit') || 0;

        // Total Remaining Balance from Monthly Payments
        const monthlyRemainingTotal = await models.MonthlyPayment.sum('remaining_balance') || 0;

        // Total Pending Payments
        const totalPendingPayments = depositTotalResult + monthlyRemainingTotal;

        // Render dashboard and send totalPendingPayments
        res.render("admin/Admindashboard", {
            totalPendingPayments: totalPendingPayments.toFixed(2),
            // send other dashboard data here if needed
        });
    } catch (error) {
        console.error("Error fetching pending payments:", error);
        res.render("admin/Admindashboard", { totalPendingPayments: 0 });
    }
};



// Add monthly payment
const addMonthlyPayment = async (req, res) => {
    try {
        const { tenant_id, tenant_name, monthly_due_date, monthly_rent, amount_paid } = req.body;

        const remaining_balance = monthly_rent - amount_paid;

        await models.MonthlyPayment.create({
            tenant_id,
            tenant_name,
            monthly_due_date,
            monthly_rent,
            date_paid: amount_paid > 0 ? new Date() : null,
            amount_paid,
            remaining_balance
        });

        res.redirect("/admin/monthlypayment?message=PaymentAdded");
    } catch (error) {
        console.error("Error:", error);
        res.redirect("/admin/monthlypayment?message=Error");
    }
};


// Get all monthly payments for rendering
const getAllMonthlyPayments = async (req, res) => {
    try {
        const monthlyPayments = await models.MonthlyPayment.findAll({ order: [['createdAt', 'DESC']] });
        res.render("admin/monthlypayment", { monthlyPayments });
    } catch (error) {
        console.error("Error fetching monthly payments:", error);
        res.render("admin/monthlypayment", { monthlyPayments: [] });
    }
};


const monthlypayment_view = async (req, res) => {
    try {
        const tenants = await models.tenant.findAll({
            attributes: ["Users_ID", "FirstName", "LastName", "Monthly_DueDate", "Monthly_Rent"]
        });

        const monthlyPayments = await models.MonthlyPayment.findAll({
            order: [['createdAt', 'DESC']]
        });

        res.render("admin/monthlypayment", { monthlyPayments, tenants });
    } catch (error) {
        console.error("Error:", error);
        res.render("admin/monthlypayment", { monthlyPayments: [], tenants: [] });
    }
};


const payment_view = async (req, res) => {
  try {
    const deposits = await models.Deposit.findAll({
      order: [['createdAt', 'DESC']],
    });

    // Pass deposits to EJS
    res.render('admin/payment', { deposits }); // <-- make sure the key is exactly 'deposits'
  } catch (error) {
    console.error(error);
    res.render('admin/payment', { deposits: [] }); // fallback to empty array
  }
};

// Add Payment
exports.addPayment = async (req, res) => {
    try {
        const tenantId = req.body.tenant_id;
        const amountPaid = parseFloat(req.body.amount_paid);

        const tenant = await models.tenant.findOne({
            where: { Users_ID: tenantId }
        });

        const monthlyRent = tenant.Monthly_Rent;

        // Compute balance
        const balance = monthlyRent - amountPaid;

        await models.payment.create({
            Tenant_ID: tenantId,
            Amount_Paid: amountPaid,
            Balance: balance <= 0 ? 0 : balance,
            Status: balance <= 0 ? "Paid" : "Partial"
        });

        res.redirect("/admin/payment");

    } catch (error) {
        res.send(error);
    }
};

// MARK MONTHLY PAYMENT AS PAID
const markMonthlyPaid = async (req, res) => {
    try {
        const paymentId = req.params.id;

        const payment = await models.MonthlyPayment.findByPk(paymentId);
        if (!payment) return res.redirect("/admin/monthlypayment?message=NotFound");

        await payment.update({
            amount_paid: payment.monthly_rent,
            remaining_balance: 0,
            date_paid: new Date()
        });

        res.redirect("/admin/monthlypayment?message=MarkedAsPaid");
    } catch (error) {
        console.error("Error marking monthly payment as paid:", error);
        res.redirect("/admin/monthlypayment?message=Error");
    }
};

const message_view= (req, res) => {
    res.render("admin/message");
};



const room_view= (req, res) => {
    res.render("admin/room");
};

const usermanagement_view = async (req, res) => {
    try {
        const users = await models.tenant.findAll(); // fetch all tenants
        res.render("admin/usermanagement", { users });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.render("admin/usermanagement", { users: [] }); // fallback empty array
    }
};


const login_view = (req, res) => {
    const message = req.query.message || null;
    res.render("login", { message });
};

const register_view = (req, res) => {
    const message = req.query.message;
    res.render("register", { message });
};


const addUser_view = (req, res) => {
    const message = req.query.message;
    res.render("addUser", { message });
};

const save_user = (req, res) => {
    const ConfirmPassword_data = req.body.ConfirmPassword_data;

    const user_data = {
        FirstName: req.body.firstName_data,
        LastName: req.body.lastName_data,
        // Admin_Birthdate: req.body.birthdate_data,
        // Admin_Gender: req.body.gender_data,
        // ContactNumber: req.body.contactNumber_data,
        Username: req.body.Username_data,
        Password: req.body.Password_data,
    };

    console.log("Admin registration data:", user_data);
    console.log("Confirm password:", ConfirmPassword_data);

    // Validate password confirmation
    if (ConfirmPassword_data !== user_data.Password) {
        return res.redirect("register?message=PasswordNotMatch");
    }

    // Hash the password before saving to the database
    user_data.Password = bcrypt.hashSync(user_data.Password, 10);
    console.log("Hashed password:", user_data.Password);

    // Insert to the 'admin' table
    models.admin.create(user_data)
        .then(result => {
            res.redirect("/login");
        })
        .catch(error => {
            console.error("Database insertion error:", error);
            res.redirect("register?message=ServerError");
        });
};

const login_user = (req, res) => {
    const user_data = {
        Username: req.body.Username,
        Password: req.body.Password,
    };

    console.log("Login attempt:", user_data);

    // Check if the user exists in the 'admin' table
    models.admin.findOne({ where: { Username: user_data.Username } })
        .then(result => {
            if (!result) {
                console.log("Admin not found in database");
                return res.render("login", { message: "Admin not found" });
            }

            console.log("Admin found:", result);

            // Compare the entered password with the hashed password from the database
            const passwordMatch = bcrypt.compareSync(user_data.Password, result.Password);
            console.log("Password match result:", passwordMatch);

            if (passwordMatch) {
                // Password is correct, generate token
                const token = jwt.sign({ id: result.Admin_ID, Username: result.Username }, "secretKey", { expiresIn: '1h' });
                res.cookie("token", token); // Set the token as a cookie
                console.log("Login successful.");

                // Redirect to Admin dashboard (since there is no specific role)
                return res.redirect("/admin/Admindashboard"); // Redirect to Admin dashboard
            } else {
                console.log("Incorrect password");
                return res.render("login", { message: "Incorrect password" });
            }
        })
        .catch(error => {
            console.error("Error during login:", error);
            res.render("login", { message: "Server error" });
        });
};



// Get total Active tenants
const getTotalActiveTenants = (req, res) => {
    models.tenant.count({
        where: {
            Users_Status: 'Active'  
        }
    })
    .then(totalActiveTenants => {
        res.json({ totalActiveTenants });
    })
    .catch(error => {
        console.error('Error fetching active tenants :', error);
        res.status(500).json({ error: 'Unable to fetch data' });
    });
};




// Add new user function
const addUser = async (req, res) => {
    try {
        const data_addUser = {
            FirstName: req.body.firstName_data,
            LastName: req.body.lastName_data,
            Address: req.body.address_data,
            Users_Gender: req.body.gender_data,
            ContactNumber: req.body.contactNumber_data,
            Room_Type: req.body.roomType_data,
            Room_Number: req.body.roomNumber_data,
            Monthly_Rent: req.body.monthlyRent_data,
            Users_Status: req.body.status || "Active",
            Username: req.body.Username_data,
            Password: bcrypt.hashSync(req.body.Password_data, 10),
            Monthly_DueDate: req.body.monthlyDueDate_data, // <-- required
        };

        await models.tenant.create(data_addUser);
        res.redirect("/admin/usermanagement?message=UserAdded");
    } catch (error) {
        console.error("Error adding user:", error);
        res.redirect("/admin/usermanagement?message=ErrorAddingUser");
    }
};


// Edit User
const editUser = (req, res) => {
    const userId = req.params.id;
    models.tenant.findOne({
        where: { Users_ID: userId }
    })
    .then(user => {
        if (user) {
            res.render("admin/editUser", { user });  // Pass the user object to the view
        } else {
            res.redirect("/admin/usermanagement?message=UserNotFound");
        }
    })
    .catch(error => {
        console.error("Error fetching user for edit:", error);
        res.redirect("/admin/usermanagement?message=ServerError");
    });
};


const updateUser = async (req, res) => {
    const userId = req.params.id;
    const updatedData = {
        FirstName: req.body.firstName_data,
        LastName: req.body.lastName_data,
        ContactNumber: req.body.contactNumber_data,
        Monthly_DueDate: req.body.monthlyDueDate_data,
        Room_Type: req.body.roomType_data,
        Room_Number: req.body.roomNumber_data,
        Monthly_Rent: req.body.monthlyRent_data,
        Users_Status: req.body.status,
    };

    try {
        await models.tenant.update(updatedData, { where: { Users_ID: userId } });
        res.redirect("/admin/usermanagement?message=UserUpdated");
    } catch (error) {
        console.error("Error updating user:", error);
        res.redirect("/admin/usermanagement?message=ErrorUpdatingUser");
    }
};


// GET all rooms (fetch for frontend)
const getRooms = async (req, res) => {
    try {
        const rooms = await models.Room.findAll({ order: [['id', 'ASC']] });
        res.json(rooms); // send as JSON
    } catch (error) {
        console.error("Error fetching rooms:", error);
        res.status(500).json({ error: "Unable to fetch rooms" });
    }
};

// ADD a new room (robust version)
const addRoom = async (req, res) => {
    try {
        console.log("Incoming addRoom payload:", req.body);

        // Accept multiple key shapes (just in case)
        const Room_Number = req.body.Room_Number ?? req.body.roomNumber ?? req.body.RoomNumber;
        const Room_Type = req.body.Room_Type ?? req.body.roomType ?? req.body.RoomType;
        const Rent_Amount_raw = req.body.Rent_Amount ?? req.body.rentAmount ?? req.body.RentAmount;
        const Availability_Status = req.body.Availability_Status ?? req.body.availabilityStatus ?? req.body.AvailabilityStatus;

        // Basic validation
        if (!Room_Number || !Room_Type || !Rent_Amount_raw || !Availability_Status) {
            console.warn("Validation failed - missing fields:", { Room_Number, Room_Type, Rent_Amount_raw, Availability_Status });
            return res.status(400).json({ error: "All fields are required" });
        }

        // Normalize rent to a number
        const Rent_Amount = Number(Rent_Amount_raw);
        if (Number.isNaN(Rent_Amount) || Rent_Amount < 0) {
            console.warn("Invalid rent amount:", Rent_Amount_raw);
            return res.status(400).json({ error: "Invalid Rent_Amount" });
        }

        // Optional: check duplicate Room_Number if that should be unique
        const existing = await models.Room.findOne({ where: { Room_Number } });
        if (existing) {
            console.warn("Attempt to add duplicate room number:", Room_Number);
            return res.status(409).json({ error: "Room number already exists" });
        }

        // Create room
        const newRoom = await models.Room.create({
            Room_Number,
            Room_Type,
            Rent_Amount,
            Availability_Status
        });

        console.log("Room created:", newRoom.toJSON ? newRoom.toJSON() : newRoom);
        return res.status(201).json({ message: "Room added successfully", room: newRoom });
    } catch (error) {
        console.error("Error in addRoom:", error);
        return res.status(500).json({ error: "Unable to add room", details: error.message });
    }
};


//update room

const updateRoom = async (req, res) => {
    try {
        const id = req.params.id;

        const data = {
            Room_Number: req.body.Room_Number,
            Room_Type: req.body.Room_Type,
            Rent_Amount: req.body.Rent_Amount,
            Availability_Status: req.body.Availability_Status
        };

        await models.Room.update(data, { where: { id } });

        res.json({ message: "Room updated successfully" });
    } catch (error) {
        console.error("Error updating room:", error);
        res.status(500).json({ error: "Failed to update room" });
    }
};

const deleteRoom = async (req, res) => {
    try {
        const id = req.params.id;

        await models.Room.destroy({ where: { id } });

        res.json({ message: "Room deleted successfully" });
    } catch (error) {
        console.error("Error deleting room:", error);
        res.status(500).json({ error: "Failed to delete room" });
    }
};


// GET TOTAL ROOMS

const getTotalRooms = async (req, res) => {
    try {
        const totalRooms = await models.Room.count(); // counts all rows
        res.json({ totalRooms });
    } catch (error) {
        console.error("Error fetching total rooms:", error);
        res.status(500).json({ error: "Unable to fetch total rooms" });
    }
};

// Get room stats
const getRoomStats = async (req, res) => {
    try {
        // Fetch all rooms
        const rooms = await models.Room.findAll();

        // Initialize counts
        const stats = {
            total: rooms.length,
            occupied: {},
            available: {}
        };

        rooms.forEach(room => {
            const type = room.Room_Type || "Unknown";
            if (room.Availability_Status === "Occupied") {
                stats.occupied[type] = (stats.occupied[type] || 0) + 1;
            } else if (room.Availability_Status === "Available") {
                stats.available[type] = (stats.available[type] || 0) + 1;
            }
        });

        res.json(stats);

    } catch (error) {
        console.error("Error fetching room stats:", error);
        res.status(500).json({ error: "Unable to fetch room stats" });
    }
};



// ADD DEPOSIT
const addDeposit = async (req, res) => {
    try {
        const { tenant_name, deposit_amount, partial_deposit } = req.body;

        // Compute balance
        const balance_deposit = deposit_amount - (partial_deposit || 0);

        // Determine status
        let payment_status = "Unpaid";
        if (partial_deposit > 0 && balance_deposit > 0) payment_status = "Partial";
        if (balance_deposit === 0) payment_status = "Paid";

        await models.Deposit.create({
            tenant_name,
            deposit_amount,
            partial_deposit: partial_deposit || 0,
            balance_deposit,
            payment_status,
            partial_date: partial_deposit ? new Date() : null  // optional date for partial payment
        });

        res.redirect("/admin/payment?message=DepositAdded");
    } catch (error) {
        console.error("Error adding deposit:", error);
        res.redirect("/admin/payment?message=Error");
    }
};

// GET all deposits
const getAllDeposits = async (req, res) => {
    try {
        const deposits = await models.Deposit.findAll({
            order: [["createdAt", "DESC"]] // latest first
        });

        // Render the EJS view with deposits
        res.render('admin/payment', { deposits });
    } catch (error) {
        console.error("Error fetching deposits:", error);
        res.render('admin/payment', { deposits: [] }); // fallback
    }
};

// MARK AS PAID
const markAsPaid = async (req, res) => {
    try {
        const depositId = req.params.id;

        // Fetch deposit
        const deposit = await models.Deposit.findByPk(depositId);

        if (!deposit) {
            return res.redirect("/admin/payment?message=NotFound");
        }

        // Update values
        const deposit_amount = Number(deposit.deposit_amount);

        await deposit.update({
            partial_deposit: deposit_amount,
            balance_deposit: 0,
            payment_status: "Paid"
        });

        res.redirect("/admin/payment?message=MarkedAsPaid");
    } catch (error) {
        console.error("Error marking as paid:", error);
        res.redirect("/admin/payment?message=Error");
    }
};

const getRecentMonthlyPayments = async (req, res) => {
    try {
        const payments = await models.MonthlyPayment.findAll({
            order: [['createdAt', 'DESC']],
            limit: 3 // only fetch 3 latest
        });

        res.json(payments);
    } catch (error) {
        console.error("Error fetching recent monthly payments:", error);
        res.status(500).json({ error: "Unable to fetch recent payments" });
    }
};


module.exports = {
    getRecentMonthlyPayments,
    markMonthlyPaid,
     addMonthlyPayment,
    getAllMonthlyPayments,
    monthlypayment_view,
    markAsPaid,
    addDeposit,
    getAllDeposits,
    getRoomStats,
    getTotalRooms,
    updateRoom,
    deleteRoom,
    addRoom,
    getRooms,
    Admindashboard_view,
    usermanagement_view,
    payment_view,
    message_view,
    room_view,
    login_view,
    register_view,
    addUser_view,
    save_user,
    login_user,
    addUser,
    editUser,
    updateUser,
    getTotalActiveTenants

  
};


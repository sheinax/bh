
// admin.controller.js


const { where } = require("sequelize");
const models = require("../models");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");




// Sa Navigation

const Admindashboard_view = (req, res) => {
    res.render("admin/Admindashboard");
};

const payment_view= (req, res) => {
    res.render("admin/payment");
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
const addUser = (req, res) => {
    const data_addUser = {
        FirstName: req.body.firstName_data,
        LastName: req.body.lastName_data,
        Address: req.body.address_data,  // updated
        Users_Gender: req.body.gender_data,
        ContactNumber: req.body.contactNumber_data,
        Users_Status: req.body.status,
        Username: req.body.Username_data,
        Password: req.body.Password_data,
    };

    // Hash the password before saving
    data_addUser.Password = bcrypt.hashSync(data_addUser.Password, 10);

    // Insert data into the tenant table
    models.tenant.create(data_addUser)
        .then(result => {
            console.log("New user added successfully:", result);
            res.redirect("/admin/usermanagement?message=UserAdded");
        })
        .catch(error => {
            console.error("Error adding new user:", error);
            res.redirect("/admin/usermanagement?message=UsernameAlreadyExist!");
        });
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


// Update User Data
const updateUser = (req, res) => {
    const userId = req.params.id;
    const updatedData = {
        FirstName: req.body.firstName_data,
        LastName: req.body.lastName_data,
        ContactNumber: req.body.contactNumber_data,
        Users_Status: req.body.status,
    };

    models.tenant.update(updatedData, {
        where: { Users_ID: userId }
    })
    .then(() => {
        res.redirect("/admin/usermanagement?message=UserUpdated");
    })
    .catch(error => {
        console.error("Error updating user:", error);
        res.redirect("/admin/usermanagement?message=ServerError");
    });
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

module.exports = {
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

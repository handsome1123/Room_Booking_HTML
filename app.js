const express = require('express');
const path = require('path');
const bcrypt = require("bcrypt");
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const multer = require('multer');
const con = require('./config/db');

const app = express();

// Check database connection
con.connect(function (err) {
    if (err) {
        console.error('Error connecting to database');
        return;
    }
    console.log('Connected to database');
});

// Define storage for the uploaded image
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/img/'); //Uploads will be stored in the 'public/img' directory
    },
    filename: function(req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname); // Appendig timestamp to avoid filename conflicts
    }
  });

const upload = multer({storage: storage});

// set the public folder
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// for session
app.use(session({
    cookie: { maxAge: 24 * 60 * 60 * 1000 }, //1 day in millisec
    secret: 'mysecretcode',
    resave: false,
    saveUninitialized: true,
    // config MemoryStore here
    store: new MemoryStore({
        checkPeriod: 24 * 60 * 60 * 1000 // prune expired entries every 24h
    })
}));



// Register route
app.post('/register', function (req, res) {
    const { username, useremail, password } = req.body;
    const sql = "SELECT user_id FROM users WHERE email = ?";
    con.query(sql, [useremail], function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).send("Database server error");
        }
        if (results.length > 0) {
            return res.status(409).send("Useremail already exists");
        }
        // hash the password
        bcrypt.hash(password, 10, function (err, hash) {
            if (err) {
                console.error(err);
                return res.status(500).send("Server error");
            }
            // insert user into database
            const insertSql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
            con.query(insertSql, [username, useremail, hash], function (err, results) {
                if (err) {
                    console.error(err);
                    return res.status(500).send("Database server error");
                }
                res.send('/');
            });
        });
    });
});

// Login route
app.post('/login', function (req, res) {
    const { useremail, password } = req.body;
    const sql = "SELECT user_id, password, role FROM users WHERE email = ?";
    con.query(sql, [useremail], function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).send("Database server error");
        }
        if (results.length != 1) {
            return res.status(401).send("Wrong username");
        }
        // check password
        bcrypt.compare(password, results[0].password, function (err, same) {
            if (err) {
                res.status(500).send("Server error");
            }
            else if (same) {
                // remember user
                req.session.userID = results[0].user_id;
                req.session.useremail = useremail;
                req.session.role = results[0].role;
                // role check
                if (results[0].role == 'staff') {
                    // admin
                    res.send('/staff/roomPage');
                }
                else if (results[0].role == 'user') {
                    // user
                    res.send('/user/roomPage');
                }
                else if (results[0].role == 'lecturer') {
                    // user
                    res.send('/approver/roomPage');
                }
            }
            else {
                res.status(401).send("Wrong password");
            }
        });
    });
});

// get user info
app.get('/userInfo', function (req, res) {
    res.json({ "userID": req.session.userID, "useremail": req.session.useremail });
});

// get room for user
app.get('/user/room', function (req, res) {
    const sql = "SELECT time_slots.*, rooms.room_name, rooms.image_path FROM time_slots INNER JOIN rooms ON time_slots.room_id = rooms.room_id";
    con.query(sql, function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).send("Database server error");
        }
        res.json(results);
    });
});

// book a slot 
app.post('/user/book-slot/:slotId', function (req, res) {
    const slotId = req.params.slotId;
    const { roomId, bookingObjective } = req.body;
    const userId = req.session.userID;

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Get current hour and minutes
    const currentHour = new Date().getHours();
    const currentMinute = new Date().getMinutes();

    // Combine current time to get current time in HH:MM format
    const currentTime = currentHour + ':' + (currentMinute < 10 ? '0' : '') + currentMinute;

    // Retrieve time slots from the database
    con.query('SELECT * FROM time_slots WHERE slot_id = ? AND start_time > ? ORDER BY start_time ASC', [slotId, currentTime], (err, timeSlotResults) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Internal server error');
        }
        // If there are no available time slots for today, return an error
        if (timeSlotResults.length === 0) {
            return res.status(400).send('No available time slots for today');
        }

        // Check if the student has already booked a slot for today
        con.query('SELECT * FROM bookings WHERE user_id = ? AND date = ?', [userId, today], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Internal server error');
            }
            // If the student has already booked a slot for today, return an error
            if (results.length > 0) {
                return res.status(409).send('Student can book only one slot per day');
            }

            // Insert booking record into the database 
            const sql = `INSERT INTO bookings (user_id, room_id, slot_id, objective, status, action_by, date) VALUES (?, ?, ?, ?, ?, ?, ?)`;
            con.query(sql, [userId, roomId, slotId, bookingObjective, 'pending', userId, today], function (err, insertResults) {
                if (err) {
                    console.error(err);
                    return res.status(500).send("Database server error");
                }

                if (insertResults.affectedRows != 1) {
                    return res.status(500).send("Book error");
                }

                // Update the status of the room's time slots to "pending"
                con.query('UPDATE time_slots SET status = ? WHERE slot_id = ?', ['pending', slotId], (err, updateResults) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send('Internal server error');
                    }
                    res.send('Slot booked successfully!');
                });
            });
        });

    });
});


// user check request route
app.get('/user/request', function (req, res) {
    const userId = req.session.userID;
    // Query database to get pending booking requests for the specific login user ID
    const sql = `
     SELECT bookings.*, rooms.room_name, time_slots.start_time, time_slots.end_time, rooms.image_path
     FROM bookings 
     JOIN rooms ON bookings.room_id = rooms.room_id 
     JOIN time_slots ON bookings.slot_id = time_slots.slot_id 
     WHERE bookings.status = 'pending' 
       AND bookings.user_id = ?`;

    con.query(sql, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Database server error");
        }
        res.json(results);
    });
});

// user history route
app.get('/user/history', function (req, res) {
    const userId = req.session.userID;
    // Query database to get pending booking requests for the specific login user ID
    const sql = `
     SELECT bookings.*, rooms.room_name, time_slots.start_time, time_slots.end_time, rooms.image_path
     FROM bookings 
     JOIN rooms ON bookings.room_id = rooms.room_id 
     JOIN time_slots ON bookings.slot_id = time_slots.slot_id 
     WHERE bookings.status != 'pending' 
       AND bookings.user_id = ?`;

    con.query(sql, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Database server error");
        }
        res.json(results);
    });
});

// Render user room page
app.get('/user/roomPage', function (req, res) {
    res.sendFile(path.join(__dirname, 'views/user_room.html'));
});

// Render user check request page
app.get('/user/check-requestPage', function (req, res) {
    res.sendFile(path.join(__dirname, 'views/user_check_request.html'));
});

// Render user history page 
app.get('/user/historyPage', function (req, res) {
    res.sendFile(path.join(__dirname, 'views/user_history.html'));
});

// Render register page
app.get('/register', function (req, res) {
    res.sendFile(path.join(__dirname, 'views/register.html'));
});

//*********** route for approver **********//
// Render approver dashboard
app.get('/approver/dashboard', function (req, res) {
    res.sendFile(path.join(__dirname, 'views/approver/approver_dashboard.html'));
});

// approver get room counts
app.get('/approver/timeslots', (req, res) => {
    const query = `
    SELECT 
            (SELECT COUNT(*) FROM time_slots) AS totalSlots,
            (SELECT COUNT(*) FROM time_slots WHERE status = 'free') AS freeSlots,
            (SELECT COUNT(*) FROM time_slots WHERE status = 'pending') AS pendingSlots,
            (SELECT COUNT(*) FROM time_slots WHERE status = 'reserved') AS reservedSlots,
            (SELECT COUNT(*) FROM time_slots WHERE status = 'disabled') AS disabledSlots
    `;
    
    con.query(query, (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send(err.message);
        }
        res.status(200).json(result);
    });
});

// Render approver roomPage
app.get('/approver/roomPage', function (req, res) {
    res.sendFile(path.join(__dirname, 'views/approver/approver_room.html'));
});

// Render approver see Request Page
app.get('/approver/see-requestPage', function (req, res) {
    res.sendFile(path.join(__dirname, 'views/approver/approver_see_request.html'));
});

// show user request for approver
app.get('/approver/user-requests', function (req, res) {
    const sql = `
    SELECT 
        bookings.*, 
        rooms.room_name, 
        time_slots.start_time, 
        time_slots.end_time, 
        rooms.image_path,
        users.username,
        users.email
    FROM 
        bookings 
        JOIN rooms ON bookings.room_id = rooms.room_id 
        JOIN time_slots ON bookings.slot_id = time_slots.slot_id 
        JOIN users ON bookings.user_id = users.user_id
    WHERE 
        bookings.status = 'pending'`;

    con.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Database server error");
        }
        res.json(results);
    });
});

// approve booking
app.put('/approver/approve/:bookingID', function (req, res) {
    const bookingID = req.params.bookingID;
    const userId = req.session.userID;

    const sql = "UPDATE bookings SET status=?, action_by = ? WHERE id=?";
    con.query(sql, ['approved', userId, bookingID], function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).send("Database server error");
        }

        if (results.affectedRows != 1) {
            return res.status(500).send("Update error");
        }

        const updateSlotQuery = 'UPDATE time_slots SET status = ? WHERE slot_id = (SELECT slot_id FROM bookings WHERE id = ?)';
        con.query(updateSlotQuery, ["reserved", bookingID], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Internal Server Error');
            }

            res.send('Approve request!');
        });
    });
});

// approve booking
app.put('/approver/reject/:bookingID', function (req, res) {
    const bookingID = req.params.bookingID;
    const userId = req.session.userID;

    const sql = "UPDATE bookings SET status=?, action_by = ? WHERE id=?";
    con.query(sql, ['rejected', userId, bookingID], function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).send("Database server error");
        }

        if (results.affectedRows != 1) {
            return res.status(500).send("Update error");
        }

        const updateSlotQuery = 'UPDATE time_slots SET status = ? WHERE slot_id = (SELECT slot_id FROM bookings WHERE id = ?)';
        con.query(updateSlotQuery, ["free", bookingID], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Internal Server Error');
            }

            res.send('Rejected request!');
        });
    });
});

// Render approver hisotyPage
app.get('/approver/historyPage', function (req, res) {
    res.sendFile(path.join(__dirname, 'views/approver/approver_history.html'));
});

// approver history route
app.get('/approver/history', function (req, res) {
    const userId = req.session.userID;
    // Query database to get pending booking requests for the specific login user ID
    const sql = `
    SELECT 
    bookings.*, 
    rooms.room_name, 
    time_slots.start_time, 
    time_slots.end_time, 
    rooms.image_path,
    users.username,
    users.email
FROM 
    bookings 
    JOIN rooms ON bookings.room_id = rooms.room_id 
    JOIN time_slots ON bookings.slot_id = time_slots.slot_id 
    JOIN users ON bookings.user_id = users.user_id
WHERE 
    bookings.status != 'pending' 
       AND bookings.action_by = ?`;

    con.query(sql, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Database server error");
        }
        res.json(results);
    });
});


//*********** route for staff **********//
//render staff dashboard
app.get('/staff/dashboardPage', function(req, res) {
    res.sendFile(path.join(__dirname, 'views/staff/staff_dashboard.html'));
});

// staff get room counts
app.get('/staff/timeslots', (req, res) => {
    const query = `
    SELECT 
            (SELECT COUNT(*) FROM time_slots) AS totalSlots,
            (SELECT COUNT(*) FROM time_slots WHERE status = 'free') AS freeSlots,
            (SELECT COUNT(*) FROM time_slots WHERE status = 'pending') AS pendingSlots,
            (SELECT COUNT(*) FROM time_slots WHERE status = 'reserved') AS reservedSlots,
            (SELECT COUNT(*) FROM time_slots WHERE status = 'disabled') AS disabledSlots
    `;
    
    con.query(query, (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send(err.message);
        }
        res.status(200).json(result);
    });
});

// render staff room route
app.get('/staff/roomPage', function(req, res) {
    res.sendFile(path.join(__dirname, 'views/staff/staff_room.html'));
});

// staff enable/disable time slots 
app.put('/staff/time-slot/:pid/:status', function (req, res) {
    const sql = "UPDATE time_slots SET status=? WHERE slot_id=?";
    con.query(sql, [req.params.status, req.params.pid], function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).send("Database server error");
        }
        if (results.affectedRows != 1) {
            return res.status(500).send("Update error");
        }
        res.send('Product status updated!');
    });
});

// render all approvers history 
app.get('/staff/all-approvers-historyPage', function(req, res) {
    res.sendFile(path.join(__dirname, 'views/staff/all_approver_history.html'));
});

// staff get all aprovers hisotry 
app.get('/staff/all-approvers-history', function(req, res) {

    // Query to fetch booking history for the lecturer
    const query = `
    SELECT 
        bookings.*, 
        rooms.room_name, 
        time_slots.start_time, 
        time_slots.end_time, 
        booking_users.username AS student_name, 
        action_users.username AS lecturer_name
    FROM 
        bookings 
        JOIN rooms ON bookings.room_id = rooms.room_id 
        JOIN time_slots ON bookings.slot_id = time_slots.slot_id 
        JOIN users AS booking_users ON bookings.user_id = booking_users.user_id
        LEFT JOIN users AS action_users ON bookings.action_by = action_users.user_id
    WHERE 
        bookings.status != 'pending';
    `;
    con.query(query, function(err, results) {
        if (err) {
            console.error(err);
            return res.status(500).send("Database server error");
        }
        res.json(results);
    });
});





// root service
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'views/login.html'));
});

// Logout
app.get("/logout", function (req, res) {
    //clear session variable
    req.session.destroy(function (err) {
        if (err) {
            console.error(err);
            res.status(500).send("Cannot clear session");
        }
        else {
            res.redirect("/");
        }
    });
});

app.listen(8000, function () {
    console.log('Server is listening on port 8000')
});
import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import bcrypt from 'bcrypt';
import session from 'express-session';
import { log } from 'console';
import { title } from 'process';


const uploadPath = 'C:\\Users\\Admin\\Documents\\the-project\\Web-Proejct\\public\\images';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + Date.now() + ext);
    }
});

var upload = multer({ storage: storage });

mongoose.connect("mongodb://localhost:27017/Mycars", { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();
const port = 3000;

const carSchema = ({
    carType: String,
    carModel: String,
    carYear: Number,
    carInfo: String,
    carImage: String
    
});

const Car = mongoose.model("Car", carSchema);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
    session({
        secret: 'abdullah',
        resave: false,
        saveUninitialized: false,
    })
);

app.get("/", (req, res) => {
    res.render("home.ejs", { isLoggedIn: req.session.isLoggedIn || false });
});
app.get("/home", (req, res) => {
    res.render("home.ejs", { isLoggedIn: req.session.isLoggedIn || false });
});


app.get("/cars", (req, res) => {
    Car.find({}, function (err, items) {
        res.render("cars.ejs", { newitems: items, isLoggedIn: req.session.isLoggedIn || false });
    });
});

app.get("/login", (req, res) => {
    res.render("login.ejs", { isLoggedIn: req.session.isLoggedIn || false });
});

app.get("/register", (req, res) => {
    res.render("register.ejs", { isLoggedIn: req.session.isLoggedIn || false });
});

app.get("/addcars", (req, res) => {
    res.render("addcars.ejs", { isLoggedIn: req.session.isLoggedIn || false });
});

app.get("/contact", (req, res) => {
    res.render("contact.ejs", { isLoggedIn: req.session.isLoggedIn || false });
});

app.get("/update", (req, res) => {
    res.render("update.ejs", { isLoggedIn: req.session.isLoggedIn || false });
});
app.get("/search", (req, res) => {
    res.render("search.ejs", { selected : req.session.searched,isLoggedIn: req.session.isLoggedIn || false });
});


app.post("/add-car", upload.single('carimage'), (req, res) => {
    const title = req.body["cartype"];
    const model = req.body["carmodel"];
    const year = req.body["caryear"];
    const info = req.body["carinfo"];
    const carimage = req.file.filename;
    const car4 = new Car({
        carType: title,
        carModel: model,
        carYear: year,
        carInfo: info,
        carImage: carimage
    });
    
    car4.save();
    res.redirect("/cars");
});

//update
app.post("/update", upload.single('carimage'), (req, res) => {
   const updating = req.body.updateCar; 
  
 req.session.updating = updating;

res.redirect("/update")



});

app.post("/update-car", upload.single('carimage'), (req, res) => {
    const updating = req.session.updating;
    
    const updatedCar = {
        carType: req.body["cartype"],
        carModel: req.body["carmodel"],
        carYear: req.body["caryear"],
        carInfo: req.body["carinfo"],
        carImage: req.file.filename
    };

    Car.findByIdAndUpdate(updating, updatedCar, { new: true }, (err, updatedCar) => {
        if (err) {
            console.log(err);
        } else {
            console.log(updatedCar);
            // Redirect to the cars page or wherever appropriate
            res.redirect("/cars");
        }
    });
});

//delete
app.post("/delete", (req, res) => {
    const deleting = req.body.deletecar;
    Car.findByIdAndRemove(deleting, function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log("Deleted");
        }
    });
    res.redirect("/cars");
});

const userSchema = ({
    userEmail: String,
    userPass: String,
  
});
//
const User = mongoose.model("User", userSchema);

app.post('/register', async (req, res) => {
    const email = req.body["email"];
    const passOne = req.body["passOne"];
    const passTwo = req.body["passTwo"];
   
    try {
        const existingUser = await User.findOne({ userEmail: email });
        if (existingUser) {
            res.send("Email Found");
        } else if (passOne !== passTwo) {
            const errorMessage = 'Passwords do not match. Please try again.';
            res.send(errorMessage);
        } else {
            const hashedPassword = await bcrypt.hash(passOne, 10);

            const newUser = new User({
                userEmail: email,
                userPass: hashedPassword
            });
            await newUser.save();
            res.redirect("/login");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred.");
    }
});
//Login
app.post('/login', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    try {
        const user = await User.findOne({ userEmail: email });
        if (!user) {
            res.send("Email not found.");
        } else {
            const hashedPassword = user.userPass;
            const isPasswordValid = await bcrypt.compare(password, hashedPassword);
            if (isPasswordValid) {
                req.session.isLoggedIn = true;
                res.redirect("/cars");
            } else {
                res.send("Incorrect password");
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred.");
    }
});
//searching find
app.post("/search" ,async (req,res)=>{
    const searched = req.body["typeofcar"];
    
  const regex = new RegExp(searched, "i");

  Car.find({ carType: regex }, (err,result)=>{
    if (err) {
 console.log(err);       
    } else {
       req.session.searched =result;
       
       console.log(req.session.searched);
       
        res.redirect('/search')
    }
});

})

app.get('/logout', (req, res) => {
    req.session.isLoggedIn = false;
    res.redirect('/');
});

app.listen(port, () => {
    console.log("Server On");
});

const express = require("express")
const bodyParser = require('body-parser')
const app = express()
const Pool = require('pg')
const db = require('./database')
const auth = require('./controllers/auth')
// Import your auth routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require("./controllers/user.routes")

app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)

authRoutes(app);
userRoutes(app);


app.get('/', (req, res) => {
  res.send("Homify baby")
})

app.listen(3000, () => {
  console.log("serving on port 3000")
})
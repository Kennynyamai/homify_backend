const Pool = require('pg').Pool

const pool = new Pool({
    host: "20.164.19.124",
    user: "kennedy",
    port: 5432,
    password: "beasty",
    database: "homify",
})

const getOwners = (request, response) => {
    pool.query('SELECT * FROM apartment_owner', (error, results) => {
        if (error) {
            throw (error)
        }
        response.status(200).json(results.rows)
    })
}

//owner


module.exports = {
    getOwners,
    pool,
}
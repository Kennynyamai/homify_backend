const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require('../database');
const { v4: uuidv4 } = require('uuid');

const register_owner = async (req, res) => {
    console.log(req.body);
    const client = await db.pool.connect();
    try {
        await client.query("BEGIN");

        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const result = await client.query(`SELECT id FROM "apartment_owner" WHERE "email" = $1`, [req.body.email]);

        if (result.rows.length > 0) {
            res.status(400).send("Email is already taken");
            return;
        }

        const insertResult = await client.query(
            `INSERT INTO apartment_owner (id, "firstName", "lastName", email, password, phone_number)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [uuidv4(), req.body.firstName, req.body.lastName, req.body.email, hashedPassword, req.body.phone_number]
        );

        await client.query("COMMIT");

        res.status(200).json(insertResult.rows[0]);
    } catch (e) {
        await client.query("ROLLBACK");
        console.error(e);
        res.status(500).send("Error adding owner");
    } finally {
        client.release();
    }
};

const signin_owner = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const result = await client.query(`SELECT * FROM "apartment_owner" WHERE email = $1`, [req.body.email]);

        if (result.rows.length === 0) {
            return res.status(404).send({ message: "Owner Not Found." });
        }

        const user = result.rows[0];
        const passwordIsValid = await bcrypt.compare(req.body.password, user.password);

        if (!passwordIsValid) {
            return res.status(401).send({
                accessToken: null,
                message: "Invalid Password!"
            });
        }

        const accessToken = jwt.sign({ id: user.id }, "lovelovelove", {
            algorithm: 'HS256',
            expiresIn: 86400, // 24 hours
        });

        // Generate refresh token
        const refreshToken = jwt.sign({ id: user.id }, "refreshSecret", {
            algorithm: 'HS256',
            expiresIn: '7d' // 7 days
        });

        // Store refresh token in DB (optional, but recommended for logout/revocation)
        await client.query(
            `UPDATE "apartment_owner" SET "refresh_token" = $1 WHERE id = $2`,
            [refreshToken, user.id]
        );

        res.status(200).send({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            accessToken: accessToken,
            refreshToken: refreshToken
        });
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: "Error signing in" });
    } finally {
        client.release();
    }
};

//--------------------------------------caretaker----------------------
const register_caretaker = async (req, res) => {
    console.log(req.body);
    const client = await db.pool.connect();
    try {
        await client.query("BEGIN");

        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const result = await client.query(`SELECT id FROM "caretaker" WHERE "email" = $1`, [req.body.email]);

        if (result.rows.length > 0) {
            res.status(400).send("Email is already taken");
            return;
        }

        const insertResult = await client.query(
            `INSERT INTO caretaker (id, "firstName", "lastName", email, password, phone_number, description, apartment_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [uuidv4(), req.body.firstName, req.body.lastName, req.body.email, hashedPassword, req.body.phone_number, req.body.description, req.body.apartment_id || null]
        );


        await client.query("COMMIT");

        res.status(200).json(insertResult.rows[0]);
    } catch (e) {
        await client.query("ROLLBACK");
        console.error(e);
        res.status(500).send("Error adding caretaker");
    } finally {
        client.release();
    }
};

const signin_caretaker = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const result = await client.query(`SELECT * FROM "caretaker" WHERE email = $1`, [req.body.email]);

        if (result.rows.length === 0) {
            return res.status(404).send({ message: "Caretaker Not Found." });
        }

        const user = result.rows[0];
        const passwordIsValid = await bcrypt.compare(req.body.password, user.password);

        if (!passwordIsValid) {
            return res.status(401).send({
                accessToken: null,
                message: "Invalid Password!"
            });
        }

        const accessToken = jwt.sign({ id: user.id }, "lovelovelove", {
            algorithm: 'HS256',
            expiresIn: 86400, // 24 hours
        });

        // Generate refresh token
        const refreshToken = jwt.sign({ id: user.id }, "refreshSecret", {
            algorithm: 'HS256',
            expiresIn: '7d' // 7 days
        });

        // Store refresh token in DB (optional, but recommended for logout/revocation)
        await client.query(
            `UPDATE "caretaker" SET "refresh_token" = $1 WHERE id = $2`,
            [refreshToken, user.id]
        );

        res.status(200).send({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            accessToken: accessToken,
            refreshToken: refreshToken
        });
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: "Error signing in" });
    } finally {
        client.release();
    }
};


const register_tenant = async (req, res) => {
    const client = await db.pool.connect();
    try {
        await client.query("BEGIN");

        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const emailCheck = await client.query(`SELECT id FROM "tenant" WHERE "email" = $1`, [req.body.email]);

        if (emailCheck.rows.length > 0) {
            res.status(400).send("Email is already taken");
            return;
        }

        const apartmentCheck = await client.query(`SELECT id FROM public.apartment WHERE "name" = $1`, [req.body.apartment_name]);

        if (apartmentCheck.rows.length === 0) {
            res.status(400).send("Apartment not found");
            return;
        }

        const apartmentId = apartmentCheck.rows[0].id;

        const insertResult = await client.query(
            `INSERT INTO tenant (id, "firstName", "lastName", email, password, phone_number, apartment_id, house_number, house_type, paid, active, no_of_days_passed)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
            [
                uuidv4(),
                req.body.firstName,
                req.body.lastName,
                req.body.email,
                hashedPassword,
                req.body.phone_number,
                apartmentId,
                req.body.house_number || null,
                req.body.house_type || null,
                req.body.paid !== undefined ? req.body.paid : null,
                req.body.active !== undefined ? req.body.active : null,
                req.body.no_of_days_passed || null // Allow no_of_days_passed to be null
            ]
        );

        await client.query("COMMIT");

        res.status(200).json(insertResult.rows[0]);
    } catch (e) {
        await client.query("ROLLBACK");
        console.error("Error adding tenant:", e.message);
        res.status(500).send("Error adding tenant");
    } finally {
        client.release();
    }
};






const signin_tenant = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const result = await client.query(`SELECT * FROM "tenant" WHERE email = $1`, [req.body.email]);

        if (result.rows.length === 0) {
            return res.status(404).send({ message: "Tenant Not Found." });
        }

        const user = result.rows[0];
        const passwordIsValid = await bcrypt.compare(req.body.password, user.password);

        if (!passwordIsValid) {
            return res.status(401).send({
                accessToken: null,
                message: "Invalid Password!"
            });
        }

        const accessToken = jwt.sign({ id: user.id }, "lovelovelove", {
            algorithm: 'HS256',
            expiresIn: 86400, // 24 hours
        });

        // Generate refresh token
        const refreshToken = jwt.sign({ id: user.id }, "refreshSecret", {
            algorithm: 'HS256',
            expiresIn: '7d' // 7 days
        });

        // Store refresh token in DB (optional, but recommended for logout/revocation)
        await client.query(
            `UPDATE "tenant" SET "refresh_token" = $1 WHERE id = $2`,
            [refreshToken, user.id]
        );

        res.status(200).send({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            accessToken: accessToken,
            refreshToken: refreshToken
        });
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: "Error signing in" });
    } finally {
        client.release();
    }
};


// New function to handle refresh token requests
const refresh_token = async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(403).send({ message: "Refresh Token is required!" });
    }

    try {
        // Verify the refresh token
        const decoded = jwt.verify(refreshToken, "refreshSecret");

        const client = await db.pool.connect();

        // Run queries in parallel to check if the refresh token is valid in any table
        const [ownerResult, caretakerResult, tenantResult] = await Promise.all([
            client.query(`SELECT refresh_token FROM "apartment_owner" WHERE id = $1`, [decoded.id]),
            client.query(`SELECT refresh_token FROM "caretaker" WHERE id = $1`, [decoded.id]),
            client.query(`SELECT refresh_token FROM "tenant" WHERE id = $1`, [decoded.id])
        ]);

        // Initialize a variable to hold the valid refresh token, if found
        let foundToken = null;

        // Check each result for a valid token
        if (ownerResult.rows.length > 0 && ownerResult.rows[0].refresh_token === refreshToken) {
            foundToken = ownerResult.rows[0].refresh_token;
        } else if (caretakerResult.rows.length > 0 && caretakerResult.rows[0].refresh_token === refreshToken) {
            foundToken = caretakerResult.rows[0].refresh_token;
        } else if (tenantResult.rows.length > 0 && tenantResult.rows[0].refresh_token === refreshToken) {
            foundToken = tenantResult.rows[0].refresh_token;
        }

        // If no valid token is found, return an error
        if (!foundToken) {
            return res.status(403).send({ message: "Invalid Refresh Token!" });
        }

        // Generate a new access token
        const newAccessToken = jwt.sign({ id: decoded.id }, "lovelovelove", {
            algorithm: 'HS256',
            expiresIn: 86400 // 24 hours
        });

        res.status(200).send({
            accessToken: newAccessToken,
        });

        // Release the database client
        client.release();
    } catch (err) {
        return res.status(403).send({ message: "Refresh token expired or invalid!" });
    }
};


module.exports = {
    register_owner,
    signin_owner,
    register_caretaker,
    signin_caretaker,
    register_tenant,
    signin_tenant,
    refresh_token, // Add refresh token function
    secret: "lovelovelove"
};

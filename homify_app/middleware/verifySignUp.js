const db = require('../database');

const checkDuplicateEmail = async (req, res, next) => {
    console.log(req.body); // Log the request body for debugging
    const client = await db.pool.connect();
    try {
        await client.query("BEGIN");

        // Check if email exists in apartment_owner table
        let result = await client.query(
            `SELECT id FROM "apartment_owner" WHERE "email" = $1`,
            [req.body.email]
        );
        if (result.rows.length > 0) {
            res.status(400).send("Email is already taken by an owner.");
            return; // Early return to prevent further execution
        }

        // Check if email exists in caretaker table
        result = await client.query(
            `SELECT id FROM "caretaker" WHERE "email" = $1`,
            [req.body.email]
        );
        if (result.rows.length > 0) {
            res.status(400).send("Email is already taken by a caretaker.");
            return; // Early return to prevent further execution
        }

        // Check if email exists in tenant table
        result = await client.query(
            `SELECT id FROM "tenant" WHERE "email" = $1`,
            [req.body.email]
        );
        if (result.rows.length > 0) {
            res.status(400).send("Email is already taken by a tenant.");
            return; // Early return to prevent further execution
        }

        await client.query("COMMIT");
        next();
    } catch (e) {
        try {
            await client.query("ROLLBACK");
        } catch (rollbackErr) {
            console.error("Rollback failed:", rollbackErr);
        }
        console.error(e);
        res.status(500).send("An error occurred while checking the email.");
    } finally {
        client.release(); // Ensure client is released in all cases
    }
};

const verifySignUp = {
    checkDuplicateEmail: checkDuplicateEmail,
};

module.exports = verifySignUp;

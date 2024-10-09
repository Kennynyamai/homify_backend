const jwt = require("jsonwebtoken");
const auth = require('../controllers/auth')
const db = require('../database')

const verifyToken = (req, res, next) => {
    let token = req.headers["x-access-token"];
    if (!token) {
        return res.status(403).send({
            message: "No token provided!"
        });
    }
    jwt.verify(token,
        auth.secret,
        (err, decoded) => {
            if (err) {
                return res.status(401).send({
                    message: "Unauthorized!",
                });
            }
            req.userId = decoded.id;
            next();
        });
}
const isOwner = async (req, res, next) => {
    const client = await db.pool.connect();

    try {
        // Assuming req.userId is set from an earlier middleware (e.g., JWT or session)
        const userId = req.userId;

        if (!userId) {
            return res.status(401).send({
                message: "Unauthorized! No user ID provided."
            });
        }

        // Query the database to check if the user is an apartment owner
        const result = await client.query(`SELECT id FROM "apartment_owner" WHERE id = $1`, [userId]);

        if (result.rows.length === 0) {
            return res.status(403).send({
                message: "Access denied. User is not an owner."
            });
        }

        // If the user is found in the apartment_owner table, continue to the next middleware
        next();
    } catch (e) {
        console.error(e);
        res.status(500).send("Internal server error.");
    } finally {
        client.release();
    }
};

const isCaretaker = async (req, res, next) => {
    const client = await db.pool.connect();

    try {
        // Assuming req.userId is set from an earlier middleware (e.g., JWT or session)
        const userId = req.userId;

        if (!userId) {
            return res.status(401).send({
                message: "Unauthorized! No user ID provided."
            });
        }

        // Query the database to check if the user is an apartment owner
        const result = await client.query(`SELECT id FROM "caretaker" WHERE id = $1`, [userId]);

        if (result.rows.length === 0) {
            return res.status(403).send({
                message: "Access denied. User is not a caretaker."
            });
        }

        // If the user is found in the apartment_owner table, continue to the next middleware
        next();
    } catch (e) {
        console.error(e);
        res.status(500).send("Internal server error.");
    } finally {
        client.release();
    }
};

const isTenant = async (req, res, next) => {
    const client = await db.pool.connect();

    try {
        // Assuming req.userId is set from an earlier middleware (e.g., JWT or session)
        const userId = req.userId;

        if (!userId) {
            return res.status(401).send({
                message: "Unauthorized! No user ID provided."
            });
        }

        // Query the database to check if the user is an apartment owner
        const result = await client.query(`SELECT id FROM "tenant" WHERE id = $1`, [userId]);

        if (result.rows.length === 0) {
            return res.status(403).send({
                message: "Access denied. User is not a tenant."
            });
        }

        // If the user is found in the apartment_owner table, continue to the next middleware
        next();
    } catch (e) {
        console.error(e);
        res.status(500).send("Internal server error.");
    } finally {
        client.release();
    }
};


const isVerifiedCaretaker = async (req, res, next) => {
    const client = await db.pool.connect();

    try {
        // Assuming req.userId is set from an earlier middleware (e.g., verifyToken)
        const userId = req.userId;

        if (!userId) {
            return res.status(401).send({
                message: "Unauthorized! No user ID provided."
            });
        }

        // Query the database to check if the user is a verified caretaker
        const result = await client.query(`
            SELECT verified FROM "caretaker" WHERE id = $1
        `, [userId]);

        // If the caretaker is not found or is not verified, deny access
        if (result.rows.length === 0) {
            return res.status(403).send({
                message: "Access denied. User is not a caretaker."
            });
        }

        // Check if the caretaker is verified
        const { verified } = result.rows[0];
        if (!verified) {
            return res.status(403).send({
                message: "Access denied. Caretaker is not verified."
            });
        }

        // If the caretaker is verified, proceed to the next middleware or route
        next();
    } catch (e) {
        console.error(e);
        res.status(500).send("Internal server error.");
    } finally {
        client.release();
    }
};

const isOnboardedTenant = async (req, res, next) => {
    const client = await db.pool.connect();

    try {
        // Assuming req.userId is set from an earlier middleware (e.g., verifyToken)
        const userId = req.userId;

        if (!userId) {
            return res.status(401).send({
                message: "Unauthorized! No user ID provided."
            });
        }

        // Query the database to check if the user is a tenant and if they are onboarded
        const result = await client.query(`
            SELECT onboarded FROM "tenant" WHERE id = $1
        `, [userId]);

        // If the tenant is not found, deny access
        if (result.rows.length === 0) {
            return res.status(403).send({
                message: "Access denied. User is not a tenant."
            });
        }

        // Check if the tenant is onboarded
        const { onboarded } = result.rows[0];
        if (!onboarded) {
            return res.status(403).send({
                message: "Access denied. Tenant is not onboarded."
            });
        }

        // If the tenant is onboarded, proceed to the next middleware or route
        next();
    } catch (e) {
        console.error(e);
        res.status(500).send("Internal server error.");
    } finally {
        client.release();
    }
};


const authJwt = {
    verifyToken: verifyToken,
    isOwner: isOwner,
    isCaretaker: isCaretaker,
    isTenant: isTenant,
    isVerifiedCaretaker: isVerifiedCaretaker,
    isOnboardedTenant: isOnboardedTenant
};
module.exports = authJwt;
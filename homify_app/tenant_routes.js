const db = require("./database")

//apartment details specific to one apartment/loggedin_tenant
const getApartmentDetailsForLoggedInTenant = async (req, res) => {
    const client = await db.pool.connect();
    const tenantId = req.userId;  // Get tenantId from the authenticated tenant's session (JWT token or session)

    try {
        const result = await client.query(`
            SELECT 
                a.id AS apartment_id,
                a.name AS apartment_name,
                a.location,
                a.apartment_description,
                
                v.total_no_of_houses,
                v.total_no_of_occupied_houses,
                v.total_no_of_vacant_houses,
                v.total_no_of_aob_houses,
                v.no_of_bedsitters_available,
                v.no_of_1_bedrooms_available,
                v.no_of_2_bedrooms_available,
                v.no_of_3_bedrooms_available,
                v.no_of_bungalows_available,

                c."firstName" AS caretaker_first_name,
                c."lastName" AS caretaker_last_name,
                c.description AS caretaker_description,
                c.phone_number AS caretaker_phone_number
                
            FROM public.apartment a
            LEFT JOIN public.vacancy_information v ON a.id = v.apartment_id
            LEFT JOIN public.caretaker c ON a.caretaker_id = c.id
            JOIN public.tenant t ON a.id = t.apartment_id
            WHERE t.id = $1;
        `, [tenantId]);

        // Check if apartment details exist for the tenant
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No apartment found for this tenant' });
        }

        // Return apartment details for the logged-in tenant
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching apartment details for tenant:', error);
        res.status(500).send('Internal server error.');
    } finally {
        client.release();
    }
};


//number of scheduled visits of the tenant
const getScheduledVisitsForTenant = async (req, res) => {
    const client = await db.pool.connect();
    const tenantId = req.userId;  // Assuming tenantId is stored in the session or JWT

    try {
        const result = await client.query(`
            SELECT 
                t.number_of_scheduled_visits
            FROM public.tenant t
            WHERE t.id = $1;
        `, [tenantId]);

        // Check if the tenant exists
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Tenant not found' });
        }

        // Return the number of scheduled visits for the tenant
        res.status(200).json({ number_of_scheduled_visits: result.rows[0].number_of_scheduled_visits });
    } catch (error) {
        console.error('Error fetching scheduled visits for tenant:', error);
        res.status(500).send('Internal server error.');
    } finally {
        client.release();
    }
};


//reviews for the tenant's apartment
const getReviewsForTenantApartment = async (req, res) => {
    const client = await db.pool.connect();
    const tenantId = req.userId;  // Get tenantId from the authenticated tenant's session (JWT token or session)

    try {
        const result = await client.query(`
            SELECT 
                r.id AS review_id,
                r.description AS review_description,
                r.rating,
                r."timestamp" AS review_timestamp,
                t."firstName" AS tenant_first_name,
                t."lastName" AS tenant_last_name
            FROM public.reviews r
            JOIN public.tenant t ON r.tenant_id = t.id
            JOIN public.apartment a ON t.apartment_id = a.id
            WHERE t.id = $1;
        `, [tenantId]);

        // Check if there are any reviews for the tenant's apartment
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No reviews found for the apartment of this tenant' });
        }

        // Return the reviews as JSON
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching reviews for tenant apartment:', error);
        res.status(500).send('Internal server error.');
    } finally {
        client.release();
    }
};

//details of the logged in tenant
const getLoggedinTenantDetails = async (req, res) => {
    const client = await db.pool.connect();
    const tenantId = req.userId;  // Get tenantId from the authenticated tenant's session (JWT token or session)

    try {
        const result = await client.query(`
            SELECT 
                t.id AS tenant_id,
                t."firstName" AS tenant_first_name,
                t."lastName" AS tenant_last_name,
                t.email AS tenant_email,
                t.phone_number AS tenant_phone_number,
                t.house_number,
                t.house_type,
                t.paid,
                t.active,
                t.no_of_days_passed,
                t.onboarded,
                t.apartment_name,
                a.name AS apartment_name,
                a.location AS apartment_location,
                a.apartment_description,
                json_agg(
                    json_build_object(
                        'id', r.id,
                        'description', r.description,
                        'rating', r.rating,
                        'timestamp', r."timestamp"
                    )
                ) AS reviews,
                json_agg(
                    json_build_object(
                        'id', i.id,
                        'category', i.category,
                        'description', i.description,
                        'handled', i.handled,
                        'timestamp', i."timestamp"
                    )
                ) AS issues
            FROM public.tenant t
            JOIN public.apartment a ON t.apartment_id = a.id
            LEFT JOIN public.reviews r ON t.id = r.tenant_id
            LEFT JOIN public.issues i ON t.id = i.tenant_id
            WHERE t.id = $1
            GROUP BY t.id, a.id;
        `, [tenantId]);

        // Check if the tenant exists
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Tenant not found' });
        }

        // Return the tenant details including reviews and issues as JSON
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching tenant details:', error);
        res.status(500).send('Internal server error.');
    } finally {
        client.release();
    }
};



const update_tenant_info = async (req, res) => {
    const client = await db.pool.connect();
    
    try {
        // Extract tenant ID from JWT (assuming req.user contains decoded JWT payload)
        const tenantId = req.userId;

        // Fetch the tenant by ID and ensure onboarding status is active
        const result = await client.query(
            `SELECT * FROM "tenant" WHERE id = $1 AND onboarded = 'true'`,
            [tenantId]
        );

        // If no tenant is found or onboarding status isn't 'active'
        if (result.rows.length === 0) {
            return res.status(403).json({ message: "Tenant not found or onboarding status is not active." });
        }

          // Proceed with the update for tenants who have active onboarding status
          const updateResult = await client.query(
            `UPDATE tenant
            SET house_number = $1,
                house_type = $2
            WHERE id = $3
            RETURNING *`,
            [
                req.body.house_number,       // House number (optional field)
                req.body.house_type,         // House type (e.g., 1-bedroom, 2-bedroom)
                tenantId                     // Tenant ID from the JWT
            ]
        );

        // Respond with the updated tenant information
        res.status(200).json(updateResult.rows[0]);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Error updating tenant information. might be the house type value" });
    } finally {
        client.release();
    }
};


const create_review = async (req, res) => {
    const client = await db.pool.connect();
    
    try {
        // Extract tenant ID from JWT (assuming req.user contains decoded JWT payload)
        const tenantId = req.userId;

        // Fetch the tenant by ID and ensure onboarding status is active
        const result = await client.query(
            `SELECT * FROM "tenant" WHERE id = $1 AND onboarded = 'true'`,
            [tenantId]
        );

        // If no tenant is found or onboarding status isn't active
        if (result.rows.length === 0) {
            return res.status(403).json({ message: "Tenant not found or onboarding status is not active." });
        }

        // Insert the new review
        const insertReview = await client.query(
            `INSERT INTO reviews (description, rating, tenant_id)
            VALUES ($1, $2, $3)
            RETURNING *`,
            [
                req.body.description,  // Review description
                req.body.rating,       // Rating between 1-5
                tenantId               // Tenant ID from the JWT
            ]
        );

        // Respond with the created review
        res.status(201).json(insertReview.rows[0]);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Error creating review." });
    } finally {
        client.release();
    }
};

const create_issue = async (req, res) => {
    const client = await db.pool.connect();
    
    try {
        // Extract tenant ID from JWT (assuming req.user contains decoded JWT payload)
        const tenantId = req.userId;

        // Fetch the tenant by ID and ensure onboarding status is active
        const result = await client.query(
            `SELECT * FROM "tenant" WHERE id = $1 AND onboarded = 'true'`,
            [tenantId]
        );

        // If no tenant is found or onboarding status isn't active
        if (result.rows.length === 0) {
            return res.status(403).json({ message: "Tenant not found or onboarding status is not active." });
        }

        // Insert the new issue
        const insertIssue = await client.query(
            `INSERT INTO issues (category, description, handled, tenant_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [
                req.body.category,      // Issue category (e.g., Maintenance, Complaint)
                req.body.description,   // Detailed issue description
                false,                  // Issue initially marked as not handled
                tenantId                // Tenant ID from the JWT
            ]
        );

        // Respond with the created issue
        res.status(201).json(insertIssue.rows[0]);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Error creating issue." });
    } finally {
        client.release();
    }
};

module.exports = {
    getApartmentDetailsForLoggedInTenant,
    getScheduledVisitsForTenant,
    getReviewsForTenantApartment,
    getLoggedinTenantDetails,
    update_tenant_info,
    create_issue,
    create_review,
}
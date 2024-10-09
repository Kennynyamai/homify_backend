const db = require("./database")

//number of apartments owned by owner
const getApartmentCountByOwner = async (req, res) => {
    const client = await db.pool.connect();
    const ownerId = req.userId;  // Assuming userId is set after verifying the token

    try {
        const result = await client.query(
            'SELECT COUNT(*) FROM apartment WHERE apartment_owner_id = $1',
            [ownerId]
        );

        res.status(200).json({ apartment_count: result.rows[0].count });
    } catch (error) {
        console.error('Error getting apartment count:', error);
        res.status(500).send('Internal server error.');
    } finally {
        client.release();
    }
};


//number of tenants in all apartments owned by owner
const getTenantCountByOwner = async (req, res) => {
    const client = await db.pool.connect();
    const ownerId = req.userId;  // Assuming userId is set after verifying the token

    try {
        const result = await client.query(
            `SELECT COUNT(*) AS tenant_count
             FROM tenant t
             JOIN apartment a ON t.apartment_id = a.id
             WHERE a.apartment_owner_id = $1`,
            [ownerId]
        );

        res.status(200).json({ tenant_count: result.rows[0].tenant_count });
    } catch (error) {
        console.error('Error getting tenant count:', error);
        res.status(500).send('Internal server error.');
    } finally {
        client.release();
    }
};


//apartments owned by the owner
const getApartmentsByOwner = async (req, res) => {
    const client = await db.pool.connect();
    const ownerId = req.userId;  // Assuming userId is set after verifying the token

    try {
        const result = await client.query(
            'SELECT id, name FROM apartment WHERE apartment_owner_id = $1',
            [ownerId]
        );

        res.status(200).json(result.rows);  // Return the list of apartments as JSON
    } catch (error) {
        console.error('Error getting apartments by owner:', error);
        res.status(500).send('Internal server error.');
    } finally {
        client.release();
    }
};




//number of scheduled visits for apartments owned by owner
const getScheduledVisitsByOwner = async (req, res) => {
    const client = await db.pool.connect();  // Connect to the database
    const ownerId = req.userId;  // Assuming userId is set after verifying the token

    try {
        // SQL query to get the total number of scheduled visits for the owner's apartments
        const result = await client.query(
            `SELECT SUM(c.number_of_scheduled_visits) AS total_scheduled_visits
             FROM public.apartment a
             JOIN public.caretaker c ON a.id = c.apartment_id
             WHERE a.apartment_owner_id = $1`,
            [ownerId]
        );

        // Check if result is found, otherwise default to 0 visits
        const totalScheduledVisits = result.rows[0].total_scheduled_visits || 0;

        // Return the result
        res.status(200).json({ total_scheduled_visits: totalScheduledVisits });
    } catch (error) {
        console.error('Error fetching scheduled visits:', error);
        res.status(500).send('Internal server error.');
    } finally {
        client.release();  // Release the client connection
    }
};


// Get onboarded tenants for a specific apartment owned by the owner
const getOnboardedTenantsByApartment = async (req, res) => {
    const client = await db.pool.connect();
    const ownerId = req.userId;  // Assuming userId is set after verifying the token
    const apartmentId = req.params.apartmentId;  // Get apartmentId from the request parameters

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
                t.apartment_name
            FROM public.tenant t
            JOIN public.apartment a ON t.apartment_id = a.id
            WHERE a.id = $1 AND a.apartment_owner_id = $2 AND t.onboarded = true;
        `, [apartmentId, ownerId]);

        // Check if there are onboarded tenants in the apartment
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No onboarded tenants found for this apartment or apartment does not belong to the owner' });
        }

        // Return the tenants as JSON
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching onboarded tenants for apartment:', error);
        res.status(500).send('Internal server error.');
    } finally {
        client.release();
    }
};

// Get not onboarded tenants for a specific apartment owned by the owner
const getNotOnboardedTenantsByApartment = async (req, res) => {
    const client = await db.pool.connect();
    const ownerId = req.userId;  // Assuming userId is set after verifying the token
    const apartmentId = req.params.apartmentId;  // Get apartmentId from the request parameters

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
                t.apartment_name
            FROM public.tenant t
            JOIN public.apartment a ON t.apartment_id = a.id
            WHERE a.id = $1 AND a.apartment_owner_id = $2 AND t.onboarded = false;
        `, [apartmentId, ownerId]);

        // Check if there are not onboarded tenants in the apartment
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No not onboarded tenants found for this apartment or apartment does not belong to the owner' });
        }

        // Return the tenants as JSON
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching not onboarded tenants for apartment:', error);
        res.status(500).send('Internal server error.');
    } finally {
        client.release();
    }
};

// Get all tenants for a specific apartment owned by the owner
const getAllTenantsByApartment = async (req, res) => {
    const client = await db.pool.connect();
    const ownerId = req.userId;  // Assuming userId is set after verifying the token
    const apartmentId = req.params.apartmentId;  // Get apartmentId from the request parameters

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
                t.apartment_name
            FROM public.tenant t
            JOIN public.apartment a ON t.apartment_id = a.id
            WHERE a.id = $1 AND a.apartment_owner_id = $2;
        `, [apartmentId, ownerId]);

        // Check if there are tenants in the apartment
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No tenants found for this apartment or apartment does not belong to the owner' });
        }

        // Return the tenants as JSON
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching tenants for apartment:', error);
        res.status(500).send('Internal server error.');
    } finally {
        client.release();
    }
};


// Get tenant details by tenant ID, including reviews and issues, ensuring the tenant belongs to an apartment owned by the owner
const getTenantDetailsById = async (req, res) => {
    const client = await db.pool.connect();
    const ownerId = req.userId;  // Assuming userId is set after verifying the token
    const tenantId = req.params.tenantId;  // Get tenantId from the request parameters

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
            WHERE t.id = $1 AND a.apartment_owner_id = $2
            GROUP BY t.id, a.id;
        `, [tenantId, ownerId]);

        // Check if the tenant exists and belongs to the owner's apartment
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Tenant not found or does not belong to any of your apartments' });
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


// Get the number of tenants in a specific apartment owned by the owner
const getTenantCountInApartment = async (req, res) => {
    const client = await db.pool.connect();
    const ownerId = req.userId;  // Assuming userId is set after verifying the token
    const apartmentId = req.params.apartmentId;  // Get apartmentId from the request parameters

    try {
        const result = await client.query(`
            SELECT COUNT(t.id) AS tenant_count
            FROM public.tenant t
            JOIN public.apartment a ON t.apartment_id = a.id
            WHERE a.id = $1 AND a.apartment_owner_id = $2;
        `, [apartmentId, ownerId]);

        // If the apartment does not belong to the owner or there are no tenants
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Apartment not found or no tenants found' });
        }

        // Return the tenant count as JSON
        res.status(200).json({ tenant_count: result.rows[0].tenant_count });
    } catch (error) {
        console.error('Error fetching tenant count:', error);
        res.status(500).send('Internal server error.');
    } finally {
        client.release();
    }
};


const createApartmentAndAssignCaretaker = async (req, res) => {
    const client = await db.pool.connect();
    const ownerId = req.userId;  // Get ownerId from the authenticated apartment owner's token
    const { apartmentName, location, apartmentDescription, caretakerEmail } = req.body;  // Get apartment and caretaker details from the request body

    try {
        // 1. Check if the apartment name is already taken
        const apartmentExistsResult = await client.query(`
            SELECT id
            FROM public.apartment
            WHERE name = $1;
        `, [apartmentName]);

        if (apartmentExistsResult.rows.length > 0) {
            return res.status(400).json({ message: 'Apartment name already exists' });
        }

        // 2. Find the caretaker by email
        const caretakerResult = await client.query(`
            SELECT id, verified
            FROM public.caretaker
            WHERE email = $1;
        `, [caretakerEmail]);

        if (caretakerResult.rows.length === 0) {
            return res.status(404).json({ message: 'Caretaker not found' });
        }

        const caretaker = caretakerResult.rows[0];

        // 3. Check if the caretaker is already verified
        if (caretaker.verified) {
            return res.status(400).json({ message: 'Caretaker is already verified and assigned to another apartment' });
        }

        

        // 4. Create the apartment
        const insertApartmentResult = await client.query(`
    INSERT INTO public.apartment (name, location, apartment_description, apartment_owner_id, caretaker_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, name, location, apartment_description;
`, [apartmentName, location, apartmentDescription, ownerId, caretaker.id]);

        const newApartment = insertApartmentResult.rows[0];

        // 5. Update the caretaker to be verified and set the apartment_id
        await client.query(`
    UPDATE public.caretaker
    SET verified = true, apartment_id = $1
    WHERE id = $2;
`, [newApartment.id, caretaker.id]);

      



        // 6. Return success response with apartment details
        res.status(201).json({
            message: 'Apartment created and caretaker assigned successfully',
            apartment: newApartment
        });
    } catch (error) {
        console.error('Error creating apartment and assigning caretaker:', error);
        res.status(500).send('Internal server error.');
    } finally {
        client.release();
    }
};

module.exports = {
    getApartmentCountByOwner,
    getTenantCountByOwner,
    getApartmentsByOwner,
    getScheduledVisitsByOwner,
    getTenantDetailsById,
    getAllTenantsByApartment,
    getOnboardedTenantsByApartment,
    getNotOnboardedTenantsByApartment,
    getTenantCountInApartment,
    createApartmentAndAssignCaretaker,
}






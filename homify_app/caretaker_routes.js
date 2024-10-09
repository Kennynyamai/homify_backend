const db = require("./database")

//apartment details specific to one apartment/caretaker
const getApartmentDetailsForLoggedInCaretaker = async (req, res) => {
    const client = await db.pool.connect();
    const caretakerId = req.userId;  // Get caretakerId from the user session (JWT token or session)

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
            WHERE c.id = $1;
        `, [caretakerId]);

        if (result.rows.length === 0) {
            return res.status(404).send({
                message: 'No apartment found for this caretaker'
            });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching apartment details:', error);
        res.status(500).send('Internal server error.');
    } finally {
        client.release();
    }
};

// Get number of scheduled visits for the logged-in caretaker
const getScheduledVisitsForCaretaker = async (req, res) => {
    const client = await db.pool.connect();
    const caretakerId = req.userId;  // Assuming caretakerId is stored in the session or JWT

    try {
        const result = await client.query(`
            SELECT 
                c.number_of_scheduled_visits
            FROM public.caretaker c
            WHERE c.id = $1;
        `, [caretakerId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Caretaker not found' });
        }

        // Return only the number of scheduled visits
        res.status(200).json({ number_of_scheduled_visits: result.rows[0].number_of_scheduled_visits });
    } catch (error) {
        console.error('Error fetching scheduled visits for caretaker:', error);
        res.status(500).send('Internal server error.');
    } finally {
        client.release();
    }
};

//reviews specific to the apartment of the logged in caretaker
const getReviewsForCaretakerApartment = async (req, res) => {
    const client = await db.pool.connect();
    const caretakerId = req.userId;  // Get caretakerId from the authenticated caretaker's token

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
            WHERE a.caretaker_id = $1;
        `, [caretakerId]);

        // Check if there are any reviews for the caretaker's apartment
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No reviews found for the apartment managed by this caretaker' });
        }

        // Return the reviews as JSON
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching reviews for caretaker apartment:', error);
        res.status(500).send('Internal server error.');
    } finally {
        client.release();
    }
};

// Tenants list for onboarded tenants
const getOnboardedTenantsForCaretakerApartment = async (req, res) => {
    const client = await db.pool.connect();
    const caretakerId = req.userId;

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
            WHERE a.caretaker_id = $1 AND t.onboarded = true;
        `, [caretakerId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No onboarded tenants found for this apartment managed by the caretaker' });
        }

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching onboarded tenants for caretaker apartment:', error);
        res.status(500).send('Internal server error.');
    } finally {
        client.release();
    }
};

// Tenants list for not onboarded tenants
const getNotOnboardedTenantsForCaretakerApartment = async (req, res) => {
    const client = await db.pool.connect();
    const caretakerId = req.userId;

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
            WHERE a.caretaker_id = $1 AND t.onboarded = false;
        `, [caretakerId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No not onboarded tenants found for this apartment managed by the caretaker' });
        }

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching not onboarded tenants for caretaker apartment:', error);
        res.status(500).send('Internal server error.');
    } finally {
        client.release();
    }
};

// Tenants list for all tenants regardless of onboarded status
const getAllTenantsForCaretakerApartment = async (req, res) => {
    const client = await db.pool.connect();
    const caretakerId = req.userId;

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
            WHERE a.caretaker_id = $1;
        `, [caretakerId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No tenants found for this apartment managed by the caretaker' });
        }

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching all tenants for caretaker apartment:', error);
        res.status(500).send('Internal server error.');
    } finally {
        client.release();
    }
};

//when a specific tenant is clicked from the tenant list
const getTenantDetailsForCaretaker = async (req, res) => {
    const client = await db.pool.connect();
    const caretakerId = req.userId;  // Get caretakerId from the authenticated caretaker's token
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
            WHERE t.id = $1 AND a.caretaker_id = $2
            GROUP BY t.id, a.id;
        `, [tenantId, caretakerId]);

        // Check if the tenant exists and belongs to the caretaker's apartment
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Tenant not found or does not belong to your apartment' });
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

//tenant count of the apartment of the logged in caretaker
const getTenantCountForCaretakerApartment = async (req, res) => {
    console.log('Entering getTenantCountForCaretakerApartment function');
    const client = await db.pool.connect();
    const caretakerId = req.userId;  // Get caretakerId from the authenticated caretaker's token

    console.log('Caretaker ID:', caretakerId); // Log the caretakerId
    
    try {
        // Validate UUID format
        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        if (!caretakerId || !uuidRegex.test(caretakerId)) {
            console.log('Invalid or missing caretakerId:', caretakerId); // Log invalid or missing ID
            return res.status(400).json({ message: 'Invalid caretaker ID format' });
        }

        const result = await client.query(`
            SELECT COUNT(t.id) AS tenant_count
            FROM public.tenant t
            JOIN public.apartment a ON t.apartment_id = a.id
            WHERE a.caretaker_id = $1;
        `, [caretakerId]);

        // If no tenants are found
        if (result.rows.length === 0) {
            console.log('No tenants found for caretaker ID:', caretakerId);
            return res.status(404).json({ message: 'No tenants found in the apartment(s) managed by the caretaker' });
        }

        // Return the tenant count as JSON
        console.log('Tenant count result:', result.rows[0].tenant_count);
        res.status(200).json({ tenant_count: result.rows[0].tenant_count });
    } catch (error) {
        console.error('Error fetching tenant count for caretaker apartment:', error);
        res.status(500).send('Internal server error.');
    } finally {
        client.release();
    }
};



// Change the onboarded status of a tenant (by caretaker)
const updateTenantOnboardedStatus = async (req, res) => {
    const client = await db.pool.connect();
    const caretakerId = req.userId;  // Get caretakerId from the authenticated caretaker's token
    const tenantId = req.params.tenantId;  // Get tenantId from the request parameters
    const { onboarded } = req.body;  // Get the new onboarded status from the request body

    try {
        // First, check if the caretaker manages the apartment where the tenant lives
        const caretakerApartmentResult = await client.query(`
            SELECT a.id
            FROM public.apartment a
            JOIN public.caretaker c ON a.id = c.apartment_id
            JOIN public.tenant t ON t.apartment_id = a.id
            WHERE c.id = $1 AND t.id = $2;
        `, [caretakerId, tenantId]);

        // If the caretaker doesn't manage the tenant's apartment, return an error
        if (caretakerApartmentResult.rows.length === 0) {
            return res.status(403).json({ message: 'You do not have permission to update this tenant\'s status' });
        }

        // Update the tenant's onboarded status
        const updateResult = await client.query(`
            UPDATE public.tenant
            SET onboarded = $1
            WHERE id = $2
            RETURNING id, onboarded, "firstName", "lastName";
        `, [onboarded, tenantId]);

        // Check if the update was successful
        if (updateResult.rowCount === 0) {
            return res.status(404).json({ message: 'Tenant not found' });
        }

        // Return the updated tenant information
        res.status(200).json({
            message: 'Tenant onboarded status updated successfully',
            tenant: updateResult.rows[0]
        });
    } catch (error) {
        console.error('Error updating tenant onboarded status:', error);
        res.status(500).send('Internal server error.');
    } finally {
        client.release();
    }
};

const fillVacancyInformation = async (req, res) => {
    const client = await db.pool.connect();
    const caretakerId = req.userId;  // Get caretakerId from the authenticated caretaker's token

    // Extract vacancy information from request body
    const { 
        total_no_of_houses, 
        total_no_of_occupied_houses, 
        total_no_of_vacant_houses, 
        total_no_of_aob_houses, 
        no_of_bedsitters, 
        no_of_1_bedrooms, 
        no_of_2_bedrooms, 
        no_of_3_bedrooms, 
        no_of_bungalows, 
        no_of_bedsitters_available, 
        no_of_1_bedrooms_available, 
        no_of_2_bedrooms_available, 
        no_of_3_bedrooms_available, 
        no_of_bungalows_available 
    } = req.body;

    try {
        // 1. Check the caretaker's assigned apartment
        const caretakerApartmentResult = await client.query(`
            SELECT a.id, a.name
            FROM public.apartment a
            JOIN public.caretaker c ON a.id = c.apartment_id
            WHERE c.id = $1 AND c.verified = true;
        `, [caretakerId]);
            
        // If the caretaker is not verified or doesn't manage any apartment, return an error
        if (caretakerApartmentResult.rows.length === 0) {
            return res.status(403).json({ message: 'You do not have permission to fill in vacancy information, or you are not a verified caretaker.' });
        }

        const apartmentId = caretakerApartmentResult.rows[0].id;
        const apartmentName = caretakerApartmentResult.rows[0].name;

        // 2. Validate the provided vacancy information against the constraints
        const totalHouses = total_no_of_occupied_houses + total_no_of_vacant_houses + total_no_of_aob_houses;
        const totalAvailable = no_of_bedsitters_available + no_of_1_bedrooms_available + no_of_2_bedrooms_available + no_of_3_bedrooms_available + no_of_bungalows_available;

        if (total_no_of_houses !== totalHouses) {
            return res.status(400).json({ message: 'Total number of houses must equal the sum of occupied, vacant, and AOB houses.' });
        }
        if (total_no_of_vacant_houses !== totalAvailable) {
            return res.status(400).json({ message: 'Total number of vacant houses must equal the sum of available houses of each type.' });
        }

        // 3. Check if vacancy information already exists for this apartment
        const vacancyExistsResult = await client.query(`
            SELECT id 
            FROM public.vacancy_information 
            WHERE apartment_id = $1;
        `, [apartmentId]);

        if (vacancyExistsResult.rows.length > 0) {
            // 4. If vacancy info exists, update it
            await client.query(`
                UPDATE public.vacancy_information
                SET total_no_of_houses = $1,
                    total_no_of_occupied_houses = $2,
                    total_no_of_vacant_houses = $3,
                    total_no_of_aob_houses = $4,
                    no_of_bedsitters = $5,
                    no_of_1_bedrooms = $6,
                    no_of_2_bedrooms = $7,
                    no_of_3_bedrooms = $8,
                    no_of_bungalows = $9,
                    no_of_bedsitters_available = $10,
                    no_of_1_bedrooms_available = $11,
                    no_of_2_bedrooms_available = $12,
                    no_of_3_bedrooms_available = $13,
                    no_of_bungalows_available = $14
                WHERE apartment_id = $15
                RETURNING id;
            `, [
                total_no_of_houses, total_no_of_occupied_houses, total_no_of_vacant_houses, total_no_of_aob_houses,
                no_of_bedsitters, no_of_1_bedrooms, no_of_2_bedrooms, no_of_3_bedrooms, no_of_bungalows,
                no_of_bedsitters_available, no_of_1_bedrooms_available, no_of_2_bedrooms_available, no_of_3_bedrooms_available, no_of_bungalows_available,
                apartmentId
            ]);

            return res.status(200).json({ message: 'Vacancy information for apartment "' + apartmentName + '" updated successfully.' });
        } else {
            // 5. If vacancy info doesn't exist, insert it
            await client.query(`
                INSERT INTO public.vacancy_information (
                    total_no_of_houses, total_no_of_occupied_houses, total_no_of_vacant_houses, total_no_of_aob_houses,
                    no_of_bedsitters, no_of_1_bedrooms, no_of_2_bedrooms, no_of_3_bedrooms, no_of_bungalows,
                    no_of_bedsitters_available, no_of_1_bedrooms_available, no_of_2_bedrooms_available, no_of_3_bedrooms_available, no_of_bungalows_available, apartment_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                RETURNING id;
            `, [
                total_no_of_houses, total_no_of_occupied_houses, total_no_of_vacant_houses, total_no_of_aob_houses,
                no_of_bedsitters, no_of_1_bedrooms, no_of_2_bedrooms, no_of_3_bedrooms, no_of_bungalows,
                no_of_bedsitters_available, no_of_1_bedrooms_available, no_of_2_bedrooms_available, no_of_3_bedrooms_available, no_of_bungalows_available,
                apartmentId
            ]);

            return res.status(201).json({ message: 'Vacancy information for apartment "' + apartmentName + '" added successfully.' });
        }
    } catch (error) {
        console.error('Error filling vacancy information:', error);
        res.status(500).send('Internal server error while processing vacancy information.');
    } finally {
        client.release();
    }
};

module.exports = {
    getApartmentDetailsForLoggedInCaretaker,
    getScheduledVisitsForCaretaker,
    getReviewsForCaretakerApartment,
    getAllTenantsForCaretakerApartment,
    getNotOnboardedTenantsForCaretakerApartment,
    getOnboardedTenantsForCaretakerApartment,
    getTenantDetailsForCaretaker,
    getTenantCountForCaretakerApartment,
    updateTenantOnboardedStatus,
    fillVacancyInformation,
}
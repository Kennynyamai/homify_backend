const db = require("./database")


//apartment details
const getApartmentDetails = async (req, res) => {
    const client = await db.pool.connect();
    const apartmentId = req.params.apartmentId;  // Get apartmentId from the request parameters

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
            WHERE a.id = $1;
        `, [apartmentId]);

        if (result.rows.length === 0) {
            return res.status(404).send({
                message: 'Apartment not found'
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


// Get all reviews for a specific apartment
const getApartmentReviews = async (req, res) => {
    const client = await db.pool.connect();
    const apartmentId = req.params.apartmentId;  // Get apartmentId from the request parameters

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
            WHERE t.apartment_id = $1;
        `, [apartmentId]);

        // Check if there are reviews for the apartment
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No reviews found for this apartment' });
        }

        // Return the reviews as JSON
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching apartment reviews:', error);
        res.status(500).send('Internal server error.');
    } finally {
        client.release();
    }
};



module.exports = {
    getApartmentDetails,
    getApartmentReviews,

}




const { authJwt } = require("../middleware");
const db = require('../database');
const query_routes = require('../query_routes');
const owner_routes = require("../owner_routes");
const caretaker_routes = require("../caretaker_routes");
const tenant_routes = require("../tenant_routes");

module.exports = function (app) {
  // Set common headers for all routes
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // ****************** Owner Routes ******************

  // Retrieve all apartment owners
  app.get('/api/owners', [authJwt.verifyToken, authJwt.isOwner], db.getOwners);

  // Get the total number of apartments owned by the logged-in owner
  app.get('/api/owners/apartment-count', [authJwt.verifyToken, authJwt.isOwner], owner_routes.getApartmentCountByOwner);

  // Get the total number of tenants in all apartments owned by the logged-in owner
  app.get('/api/owners/tenant-count', [authJwt.verifyToken, authJwt.isOwner], owner_routes.getTenantCountByOwner);

  // Get a list of apartments owned by the logged-in owner
  app.get('/api/owners/apartments', [authJwt.verifyToken, authJwt.isOwner], owner_routes.getApartmentsByOwner);

  // Get details of a specific apartment owned by the logged-in owner
  app.get('/api/owners/apartments/:apartmentId', [authJwt.verifyToken, authJwt.isOwner], query_routes.getApartmentDetails);

  // Get the number of scheduled visits across all apartments owned by the logged-in owner
  app.get('/api/owners/scheduled-visits', [authJwt.verifyToken, authJwt.isOwner], owner_routes.getScheduledVisitsByOwner);

  // Get reviews for a specific apartment owned by the logged-in owner
  app.get('/api/owners/apartments/:apartmentId/reviews', [authJwt.verifyToken, authJwt.isOwner], query_routes.getApartmentReviews);

  // Retrieve onboarded tenants in a specific apartment owned by the logged-in owner
  app.get('/api/owners/apartments/:apartmentId/tenants/onboarded', [authJwt.verifyToken, authJwt.isOwner], owner_routes.getOnboardedTenantsByApartment);

  // Retrieve non-onboarded tenants in a specific apartment owned by the logged-in owner
  app.get('/api/owners/apartments/:apartmentId/tenants/not-onboarded', [authJwt.verifyToken, authJwt.isOwner], owner_routes.getNotOnboardedTenantsByApartment);

  // Retrieve all tenants, regardless of onboarded status, in a specific apartment owned by the logged-in owner
  app.get('/api/owners/apartments/:apartmentId/tenants', [authJwt.verifyToken, authJwt.isOwner], owner_routes.getAllTenantsByApartment);

  // Get details of a specific tenant
  app.get('/api/owners/tenants/:tenantId', [authJwt.verifyToken, authJwt.isOwner], owner_routes.getTenantDetailsById);

  // Get the tenant count in a specific apartment owned by the logged-in owner
  app.get('/api/owners/apartments/:apartmentId/tenant-count', [authJwt.verifyToken, authJwt.isOwner], owner_routes.getTenantCountInApartment);

  // Create a new apartment and assign a caretaker to it
  app.post('/api/owners/create-apartment', [authJwt.verifyToken, authJwt.isOwner], owner_routes.createApartmentAndAssignCaretaker);

  // ****************** Caretaker Routes ******************

  // Get the details of the apartment assigned to the currently logged-in caretaker
  app.get('/api/caretaker/apartment', [authJwt.verifyToken, authJwt.isCaretaker], caretaker_routes.getApartmentDetailsForLoggedInCaretaker);

  // Get scheduled visits for the apartment assigned to the currently logged-in caretaker
  app.get('/api/caretaker/scheduled-visits', [authJwt.verifyToken, authJwt.isCaretaker], caretaker_routes.getScheduledVisitsForCaretaker);

  // Get reviews for the apartment assigned to the currently logged-in caretaker
  app.get('/api/caretaker/apartment-reviews', [authJwt.verifyToken, authJwt.isCaretaker], caretaker_routes.getReviewsForCaretakerApartment);

  // Retrieve onboarded tenants in the apartment assigned to the currently logged-in caretaker
  app.get('/api/caretaker/tenants/onboarded', [authJwt.verifyToken, authJwt.isCaretaker], caretaker_routes.getOnboardedTenantsForCaretakerApartment);

  // Retrieve non-onboarded tenants in the apartment assigned to the currently logged-in caretaker
  app.get('/api/caretaker/tenants/not-onboarded', [authJwt.verifyToken, authJwt.isCaretaker], caretaker_routes.getNotOnboardedTenantsForCaretakerApartment);

  // Retrieve all tenants (regardless of onboarded status) in the apartment assigned to the currently logged-in caretaker
  app.get('/api/caretaker/tenants', [authJwt.verifyToken, authJwt.isCaretaker], caretaker_routes.getAllTenantsForCaretakerApartment);

  // Get the number of tenants in the apartment assigned to the currently logged-in caretaker
  app.get('/api/caretaker/tenants/count', [authJwt.verifyToken, authJwt.isCaretaker], caretaker_routes.getTenantCountForCaretakerApartment);

  // Get details of a specific tenant in the apartment assigned to the currently logged-in caretaker
  app.get('/api/caretaker/tenants/:tenantId', [authJwt.verifyToken, authJwt.isCaretaker], caretaker_routes.getTenantDetailsForCaretaker);

  // Caretaker updates tenant onboarding status in their assigned apartment
  app.put('/api/caretaker/tenants/:tenantId/onboard', [authJwt.verifyToken, authJwt.isCaretaker, authJwt.isVerifiedCaretaker], caretaker_routes.updateTenantOnboardedStatus);

  // Caretaker updates or fills vacancy information for their assigned apartment
  app.post('/api/caretaker/apartment/vacancy', [authJwt.verifyToken, authJwt.isCaretaker, authJwt.isVerifiedCaretaker], caretaker_routes.fillVacancyInformation);

  // ****************** Tenant Routes ******************

  // Get details of the apartment assigned to the currently logged-in tenant
  app.get('/api/tenant/apartment', [authJwt.verifyToken, authJwt.isTenant], tenant_routes.getApartmentDetailsForLoggedInTenant);

  // Get scheduled visits for the currently logged-in tenant's apartment
  app.get('/api/tenant/scheduled-visits', [authJwt.verifyToken, authJwt.isTenant], tenant_routes.getScheduledVisitsForTenant);

  // Get reviews for the currently logged-in tenant's apartment
  app.get('/api/tenant/apartment-reviews', [authJwt.verifyToken, authJwt.isTenant], tenant_routes.getReviewsForTenantApartment);

  // Retrieve details of the currently logged-in tenant
  app.get('/api/tenant/tenant-details', [authJwt.verifyToken, authJwt.isTenant], tenant_routes.getLoggedinTenantDetails);

  // Tenant updates their own profile information
  app.patch('/api/tenant/update', [authJwt.verifyToken, authJwt.isTenant, authJwt.isOnboardedTenant], tenant_routes.update_tenant_info);

  // Create a review for the currently logged-in tenant's apartment
  app.post('/api/reviews/create', [authJwt.verifyToken, authJwt.isTenant, authJwt.isOnboardedTenant], tenant_routes.create_review);

  // Create an issue for the currently logged-in tenant's apartment
  app.post('/api/issues/create', [authJwt.verifyToken, authJwt.isTenant, authJwt.isOnboardedTenant], tenant_routes.create_issue);
};

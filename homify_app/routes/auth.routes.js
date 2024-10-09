const { verifySignUp } = require("../middleware");
const controller = require("../controllers/auth");

module.exports = function(app) {
  // CORS Headers
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // Routes for Apartment Owners
  app.post('/api/owners/register', [verifySignUp.checkDuplicateEmail], controller.register_owner);
  app.post('/api/owners/signin', controller.signin_owner);

  // Routes for Caretakers
  app.post('/api/caretakers/register', [verifySignUp.checkDuplicateEmail], controller.register_caretaker);
  app.post('/api/caretakers/signin', controller.signin_caretaker);

  // Routes for Tenants
  app.post('/api/tenants/register', [verifySignUp.checkDuplicateEmail], controller.register_tenant);
  app.post('/api/tenants/signin', controller.signin_tenant);

  // Route for refreshing access tokens
  app.post('/api/auth/refresh_token', controller.refresh_token);
};

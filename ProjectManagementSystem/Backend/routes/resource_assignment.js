var express = require('express');
var router = express.Router();

var ResourceAssignmentController = require('../controllers/api/resource_assignment');

router.get(
    '/',
    function (req, res, next) {
        ResourceAssignmentController.getAll(req, res, next);
    }
)

router.get(
    '/:rsrcAssignId',
    function (req, res, next) {
        ResourceAssignmentController.getById(req.params.rsrcAssignId, req, res, next);
    }
)

router.get(
    '/project/:projectId',
    function (req, res, next) {
        ResourceAssignmentController.getByProject(req.params.projectId, req, res, next);
    }
)

router.post(
    '/',
    function (req, res, next) {
        ResourceAssignmentController.create(req, res, next);
    }
);

router.put(
    '/',
    function (req, res, next) {
        ResourceAssignmentController.assignResourcesToProject(req, res, next);
    }
)

module.exports = router;